import { Module } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowController } from './workflow.controller';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  providers: [WorkflowEngineService],
  controllers: [WorkflowController],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}
