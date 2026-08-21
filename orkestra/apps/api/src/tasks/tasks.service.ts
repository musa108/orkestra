import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Previously: `findAll(productionId?)` with NO organization check —
  // omitting productionId returned every task across every organization
  // in the entire system to any authenticated user. Fixed: always scoped
  // to the caller's organization via the production relation, whether or
  // not a specific productionId is also given.
  findAll(organizationId: string, productionId?: string) {
    return this.prisma.task.findMany({
      where: {
        production: { organizationId },
        ...(productionId ? { productionId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, dto: CreateTaskDto) {
    await this.assertProductionInOrg(dto.productionId, organizationId);
    return this.prisma.task.create({
      data: {
        productionId: dto.productionId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async update(id: string, organizationId: string, data: { status?: TaskStatus; priority?: string }) {
    await this.assertTaskInOrg(id, organizationId);
    return this.prisma.task.update({ where: { id }, data: data as any });
  }

  complete(id: string, organizationId: string) {
    return this.update(id, organizationId, { status: TaskStatus.DONE });
  }

  private async assertProductionInOrg(productionId: string, organizationId: string) {
    const production = await this.prisma.production.findUnique({ where: { id: productionId } });
    if (!production || production.organizationId !== organizationId) {
      throw new NotFoundException('Production not found.');
    }
  }

  private async assertTaskInOrg(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { production: { select: { organizationId: true } } },
    });
    if (!task || task.production.organizationId !== organizationId) {
      throw new NotFoundException('Task not found.');
    }
  }
}
