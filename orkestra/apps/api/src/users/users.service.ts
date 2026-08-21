import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

const SAFE_SELECT = {
  id: true, firstName: true, lastName: true, email: true,
  status: true, avatarUrl: true, createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, pagination: PaginationDto, search?: string) {
    const where = {
      deletedAt: null,
      memberships: { some: { organizationId } },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, select: { ...SAFE_SELECT, memberships: { where: { organizationId }, select: { role: true } } },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map(({ memberships, ...u }) => ({ ...u, role: memberships[0]?.role }));
    return { data, meta: { page: pagination.page, limit: pagination.limit, total } };
  }

  async create(organizationId: string, dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName, lastName: dto.lastName, email: dto.email, passwordHash,
        memberships: { create: { organizationId, role: dto.role } },
      },
      select: SAFE_SELECT,
    });
    return { ...user, role: dto.role };
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto) {
    await this.ensureMember(id, organizationId);

    if (dto.role) {
      await this.prisma.organizationMember.update({
        where: { userId_organizationId: { userId: id, organizationId } },
        data: { role: dto.role },
      });
    }

    const { firstName, lastName, status } = dto;
    return this.prisma.user.update({
      where: { id },
      data: { firstName, lastName, status },
      select: SAFE_SELECT,
    });
  }

  async softDelete(id: string, organizationId: string, deletedBy: string) {
    await this.ensureMember(id, organizationId);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy },
      select: SAFE_SELECT,
    });
  }

  /** Confirms the target user is actually a member of the caller's
   *  organization before any mutation — previously missing entirely,
   *  which meant an org admin could edit/delete a user in a DIFFERENT
   *  organization just by knowing their user id. */
  private async ensureMember(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) throw new NotFoundException('User not found.');
  }
}
