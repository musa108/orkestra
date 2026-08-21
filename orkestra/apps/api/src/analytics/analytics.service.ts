import { Injectable } from '@nestjs/common';
import { WorkflowState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async dashboard(organizationId: string) {
    const [activeProductions, runningWorkflows, pendingApprovals, agents] = await Promise.all([
      this.prisma.production.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.workflow.count({ where: { currentState: WorkflowState.RUNNING, production: { organizationId } } }),
      this.prisma.approval.count({ where: { status: 'PENDING', production: { organizationId } } }),
      this.prisma.agent.findMany(),
    ]);

    return {
      activeProductions,
      runningWorkflows,
      pendingApprovals,
      agents,
      note: 'Historical/trend analytics stream to ClickHouse in production; this returns a live Postgres snapshot.',
    };
  }

  async production(productionId: string) {
    const workflows = await this.prisma.workflow.findMany({ where: { productionId }, include: { steps: true } });
    return { productionId, workflows };
  }

  async agentPerformance() {
    return this.prisma.agent.findMany();
  }
}
