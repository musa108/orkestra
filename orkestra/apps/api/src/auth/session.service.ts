import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const REFRESH_TTL_MS = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d');

function parseDuration(input: string): number {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 86_400_000;
  return value * multiplier;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Server-side session tracking for refresh tokens (spec section 5).
 * Only a hash of the raw refresh token is ever stored — the raw value
 * lives only in the httpOnly cookie on the client and is never persisted.
 *
 * Rotation: every successful refresh revokes the session it came from and
 * creates a new one. Reuse detection: if a caller presents a refresh
 * token whose session is already revoked, that's a signal the token was
 * stolen and already used once — every session for that user is revoked
 * as a precaution (spec: "treat it as suspicious activity").
 */
@Injectable()
export class SessionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Returns the raw refresh token (to put in the cookie) — only this
   *  return value ever sees the unhashed token. */
  async createSession(
    userId: string,
    organizationId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    const rawToken = randomBytes(48).toString('hex');
    await this.prisma.session.create({
      data: {
        userId,
        organizationId,
        refreshTokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    return rawToken;
  }

  /** Validates a raw refresh token, rotates it (revoke old, create new),
   *  and returns the new raw token + the session's user/org for reissuing
   *  an access token. Throws on invalid/expired/revoked/reused tokens. */
  async rotate(
    rawToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ userId: string; organizationId: string; newRawToken: string }> {
    const tokenHash = hashToken(rawToken);
    const session = await this.prisma.session.findFirst({ where: { refreshTokenHash: tokenHash } });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (session.revokedAt) {
      // Reuse of an already-rotated token — treat as compromised and burn
      // every session for this user.
      await this.revokeAllForUser(session.userId, 'Refresh token reuse detected.');
      await this.audit.log({
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: 'HUMAN',
        action: 'TOKEN_REVOKED',
        resourceType: 'Session',
        resourceId: session.id,
        result: 'DENIED',
        reason: 'Refresh token reuse detected — all sessions revoked.',
      });
      throw new UnauthorizedException('Session invalidated. Please sign in again.');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired.');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newRawToken = await this.createSession(session.userId, session.organizationId, meta);

    await this.audit.log({
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: 'HUMAN',
      action: 'TOKEN_REFRESH',
      resourceType: 'Session',
      resourceId: session.id,
      result: 'SUCCESS',
    });

    return { userId: session.userId, organizationId: session.organizationId, newRawToken };
  }

  async revoke(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string, _reason?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
