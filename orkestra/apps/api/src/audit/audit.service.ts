import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  organizationId?: string;
  actorId?: string;
  actorType?: 'HUMAN' | 'AGENT' | 'SYSTEM';
  action: string;
  resourceType?: string;
  resourceId?: string;
  result?: 'ALLOWED' | 'DENIED' | 'SUCCESS' | 'FAILURE';
  reason?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Central audit writer (spec section 20). Every security- and business-
 * sensitive action goes through here rather than ad hoc console.log calls,
 * so there's exactly one place that enforces "never log passwords or
 * tokens" and one queryable table for the whole system's audit trail.
 *
 * organizationId is genuinely optional here — a failed login attempt for
 * an email that doesn't exist has no organization to attribute it to, and
 * that event is still worth recording (spec explicitly lists failed
 * logins as an audit example), so the schema allows a null FK rather than
 * forcing a fabricated one.
 *
 * Deliberately never throws — a failed audit write should never break the
 * request it's describing; it logs the failure instead and moves on.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      // actorId is a FK to users.id — only valid for HUMAN actors.
      // AGENT/SYSTEM actor identifiers (e.g. "DIRECTOR") are not user UUIDs;
      // store them in metadata instead to avoid FK constraint violations.
      const isHuman = !entry.actorType || entry.actorType === 'HUMAN';
      await this.prisma.auditLog.create({
        data: {
          organizationId: entry.organizationId,
          actorId: isHuman ? entry.actorId : null,
          actorType: entry.actorType ?? 'HUMAN',
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          result: entry.result,
          reason: entry.reason,
          metadata: {
            ...(entry.metadata as Record<string, unknown> | undefined),
            // Preserve non-human actor identity in metadata for traceability
            ...(!isHuman && entry.actorId ? { actorIdentifier: entry.actorId } : {}),
          } as any,
          correlationId: entry.correlationId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log for ${entry.action}`, err as Error);
    }
  }
}
