import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SessionService } from './session.service';
import { AuditService } from '../audit/audit.service';
import { permissionsForRole } from '../authz/permissions';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private sessions: SessionService,
    private audit: AuditService,
  ) {}

  private signAccessToken(user: { id: string; email: string; organizationId: string; role: UserRole }) {
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };
    return this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' });
  }

  /** Registers a new user and either creates a new organization (making
   *  them its admin) or joins an existing one (as TEAM_MEMBER) via
   *  OrganizationMember — the org/role no longer live on User directly. */
  async register(dto: RegisterDto, meta: RequestMeta) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email, passwordHash },
      });

      let organizationId = dto.organizationId;
      let role: UserRole = UserRole.TEAM_MEMBER;

      if (!organizationId) {
        const org = await tx.organization.create({
          data: {
            name: dto.organizationName ?? `${dto.firstName}'s Organization`,
            slug: `${dto.firstName}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          },
        });
        organizationId = org.id;
        role = UserRole.ORGANIZATION_ADMIN;
      }

      await tx.organizationMember.create({
        data: { userId: user.id, organizationId, role },
      });

      return { user, organizationId, role };
    });

    await this.audit.log({
      organizationId: result.organizationId,
      actorId: result.user.id,
      action: 'USER_CREATED',
      resourceType: 'User',
      resourceId: result.user.id,
      result: 'SUCCESS',
    });

    return this.issueTokens(result.user.id, result.user.email, result.organizationId, result.role, meta);
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: true },
    });

    // Constant-shape failure — spec section 25: "authentication failures
    // should not reveal whether an email exists." Always run bcrypt.compare
    // against something even when the user doesn't exist, so timing
    // doesn't leak that fact either.
    const passwordHash = user?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinva';
    const valid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !valid || user.deletedAt) {
      await this.audit.log({
        action: 'USER_LOGIN',
        result: 'FAILURE',
        reason: 'Invalid credentials.',
        metadata: { email: dto.email },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('This account is not a member of any organization.');
    }

    await this.audit.log({
      organizationId: membership.organizationId,
      actorId: user.id,
      action: 'USER_LOGIN',
      result: 'SUCCESS',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return this.issueTokens(user.id, user.email, membership.organizationId, membership.role, meta);
  }

  async logout(refreshToken: string | undefined, userId: string | undefined, organizationId: string | undefined) {
    if (refreshToken) await this.sessions.revoke(refreshToken);
    await this.audit.log({
      organizationId,
      actorId: userId,
      action: 'USER_LOGOUT',
      result: 'SUCCESS',
    });
  }

  async refresh(refreshToken: string | undefined, meta: RequestMeta) {
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided.');

    const rotated = await this.sessions.rotate(refreshToken, meta);
    const user = await this.prisma.user.findUnique({ where: { id: rotated.userId } });
    if (!user || user.deletedAt) throw new UnauthorizedException('User no longer exists.');

    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId: rotated.userId, organizationId: rotated.organizationId } },
    });
    if (!membership) throw new UnauthorizedException('Organization membership no longer exists.');

    return {
      accessToken: this.signAccessToken({
        id: user.id, email: user.email, organizationId: membership.organizationId, role: membership.role,
      }),
      refreshToken: rotated.newRawToken,
    };
  }

  async me(userId: string, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, status: true },
    });
    if (!user) return null;

    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { organization: { select: { id: true, name: true } } },
    });
    if (!membership) return null;

    return {
      ...user,
      organization: membership.organization,
      role: membership.role,
      permissions: permissionsForRole(membership.role),
    };
  }

  private async issueTokens(
    userId: string, email: string, organizationId: string, role: UserRole, meta: RequestMeta,
  ) {
    const accessToken = this.signAccessToken({ id: userId, email, organizationId, role });
    const refreshToken = await this.sessions.createSession(userId, organizationId, meta);
    return { accessToken, refreshToken, expiresIn: 900 };
  }
}
