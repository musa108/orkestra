import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, DomainEventPayload } from '../events/event-types';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  // Listens on the same event bus every other subsystem uses — notifications
  // are a side effect of domain events, not a separately-triggered concern.
  @OnEvent(DomainEvent.ApprovalRequested)
  async onApprovalRequested(event: DomainEventPayload) {
    // In the full implementation this fans out to reviewers based on role;
    // left as a documented hook point in this scaffold.
    void event;
  }
}
