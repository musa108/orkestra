import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { DomainEvent } from '../events/event-types';
import { CreateProductionDto } from './dto/create-production.dto';
import { UpdateProductionDto } from './dto/update-production.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductionsService {
  constructor(private prisma: PrismaService, private eventBus: EventBusService) {}

  async findAll(organizationId: string, pagination: PaginationDto) {
    const where = { organizationId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.production.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: { workflows: { select: { id: true, currentState: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
      }),
      this.prisma.production.count({ where }),
    ]);
    return { data, meta: { page: pagination.page, limit: pagination.limit, total } };
  }

  // Previously took only `id` with no organization check at all — any
  // authenticated user from ANY organization could fetch ANY production
  // by id. Fixed: organizationId is now required and verified. 404 (not
  // 403) on mismatch so existence isn't disclosed to an outsider (spec
  // section 21).
  async findOne(id: string, organizationId: string) {
    const production = await this.prisma.production.findUnique({
      where: { id },
      include: { workflows: { orderBy: { createdAt: 'desc' } }, tasks: true, approvals: true },
    });
    if (!production || production.organizationId !== organizationId) {
      throw new NotFoundException('Production not found.');
    }
    return production;
  }

  async create(organizationId: string, createdById: string, dto: CreateProductionDto) {
    const production = await this.prisma.production.create({
      data: {
        organizationId,
        createdById,
        title: dto.title,
        description: dto.description,
        genre: dto.genre,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        budget: dto.budget,
        status: ProductionStatus.DRAFT,
      },
    });

    await this.eventBus.publish(
      DomainEvent.ProductionCreated,
      { productionId: production.id, title: production.title },
      { productionId: production.id, actor: createdById },
    );

    return production;
  }

  async update(id: string, organizationId: string, dto: UpdateProductionDto) {
    await this.findOne(id, organizationId);
    const production = await this.prisma.production.update({ where: { id }, data: dto });

    if (dto.status === ProductionStatus.PUBLISHED) {
      await this.eventBus.publish(
        DomainEvent.ProductionPublished,
        { productionId: id },
        { productionId: id },
      );
    }
    return production;
  }

  async archive(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.production.update({
      where: { id },
      data: { status: ProductionStatus.ARCHIVED, deletedAt: null },
    });
  }
}
