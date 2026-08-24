import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DomainEvent, DomainEventPayload } from './event-types';
import { ClickHouseService } from './clickhouse.service';

/**
 * EventBus — the single coordination mechanism between the Workflow Engine,
 * Agent Runtime, and Approval Engine (ADR-007 / ADR-027).
 *
 * Implementation note: this uses an in-process EventEmitter so the scaffold
 * runs standalone. In the target Google Cloud deployment this adapter is
 * swapped for a Pub/Sub-backed implementation behind the same `publish`
 * interface — no caller code changes.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger('EventBus');

  constructor(
    private emitter: EventEmitter2,
    private prisma: PrismaService,
    private clickhouse: ClickHouseService,
  ) {}

  async publish<T extends Record<string, unknown>>(
    type: DomainEvent,
    payload: T,
    ctx: { workflowId?: string; productionId?: string; organizationId?: string; correlationId?: string; actor?: string } = {},
  ): Promise<DomainEventPayload<T>> {
    let orgId = ctx.organizationId;
    if (!orgId && ctx.productionId) {
      const prod = await this.prisma.production.findUnique({
        where: { id: ctx.productionId },
        select: { organizationId: true },
      });
      if (prod) orgId = prod.organizationId;
    } else if (!orgId && ctx.workflowId) {
      const wf = await this.prisma.workflow.findUnique({
        where: { id: ctx.workflowId },
        include: { production: { select: { organizationId: true } } },
      });
      if (wf?.production) orgId = wf.production.organizationId;
    }

    const event: DomainEventPayload<T> = {
      id: randomUUID(),
      type,
      workflowId: ctx.workflowId,
      productionId: ctx.productionId,
      organizationId: orgId,
      correlationId: ctx.correlationId ?? randomUUID(),
      actor: ctx.actor,
      timestamp: new Date().toISOString(),
      payload,
    };

    // Persist immutably (events are never edited or deleted — ADR-020).
    if (ctx.workflowId) {
      await this.prisma.event.create({
        data: {
          workflowId: ctx.workflowId,
          eventType: type,
          payload: payload as any,
          correlationId: event.correlationId,
          actor: ctx.actor,
        },
      });
    }

    this.logger.log(`${type} [${event.correlationId}]`);
    // Analytical mirror — no-op unless CLICKHOUSE_URL is set (see ClickHouseService).
    this.clickhouse.mirror(event as any).catch(() => void 0);
    this.emitter.emit(type, event);
    this.emitter.emit('*', event); // wildcard for the WebSocket gateway
    return event;
  }

  on(type: DomainEvent, handler: (event: DomainEventPayload) => void) {
    this.emitter.on(type, handler);
  }
}
