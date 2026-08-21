import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

/**
 * Mirrors immutable domain events into ClickHouse for analytical queries
 * (08_Database_Design's stated split: Postgres = operational, ClickHouse =
 * analytics). Inactive — a documented no-op — unless CLICKHOUSE_URL is set,
 * so the scaffold runs without provisioning ClickHouse.
 *
 * Uses ClickHouse's HTTP interface directly (fetch + JSONEachRow) rather
 * than pulling in a client library, keeping the dependency footprint small.
 */
@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger('ClickHouse');
  private enabled = false;
  private url: string | null = null;

  async onModuleInit() {
    this.url = process.env.CLICKHOUSE_URL ?? null;
    this.enabled = !!this.url;
    if (!this.enabled) {
      this.logger.log('CLICKHOUSE_URL not set — analytics events will not be mirrored (Postgres-only mode).');
      return;
    }
    await this.ensureTable();
  }

  private async ensureTable() {
    const ddl = `
      CREATE TABLE IF NOT EXISTS events (
        id String,
        event_type String,
        workflow_id String,
        production_id String,
        correlation_id String,
        actor String,
        payload String,
        timestamp DateTime64(3)
      ) ENGINE = MergeTree()
      ORDER BY (event_type, timestamp)
    `;
    await this.exec(ddl).catch((err) =>
      this.logger.warn(`Could not ensure ClickHouse events table (will retry mirroring anyway): ${err.message}`),
    );
  }

  async mirror(event: {
    id: string; type: string; workflowId?: string; productionId?: string;
    correlationId: string; actor?: string; payload: unknown; timestamp: string;
  }) {
    if (!this.enabled) return;

    const row = {
      id: event.id,
      event_type: event.type,
      workflow_id: event.workflowId ?? '',
      production_id: event.productionId ?? '',
      correlation_id: event.correlationId,
      actor: event.actor ?? '',
      payload: JSON.stringify(event.payload ?? {}),
      timestamp: event.timestamp.replace('T', ' ').replace('Z', ''),
    };

    await this.exec(`INSERT INTO events FORMAT JSONEachRow`, JSON.stringify(row)).catch((err) =>
      this.logger.warn(`ClickHouse mirror failed for ${event.type}: ${err.message}`),
    );
  }

  private async exec(query: string, body?: string): Promise<void> {
    if (!this.url) return;
    const res = await fetch(`${this.url}/?query=${encodeURIComponent(query)}`, {
      method: 'POST',
      body,
    });
    if (!res.ok) {
      throw new Error(`ClickHouse HTTP ${res.status}: ${await res.text()}`);
    }
  }
}
