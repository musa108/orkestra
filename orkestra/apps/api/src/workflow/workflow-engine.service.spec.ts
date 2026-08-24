import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { AgentRuntimeService } from '../agents/agent-runtime.service';
import { ToolAuthorizationService } from '../authz/tool-authorization.service';
import { WorkflowState, WorkflowStepStatus } from '@prisma/client';

describe('WorkflowEngineService', () => {
  let service: WorkflowEngineService;
  let prisma: PrismaService;
  let eventBus: EventBusService;
  let agentRuntime: AgentRuntimeService;
  let toolAuth: ToolAuthorizationService;

  const mockPrisma = {
    production: {
      findUnique: jest.fn(),
    },
    workflow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workflowStep: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    approval: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockEventBus = {
    publish: jest.fn(),
  };

  const mockAgentRuntime = {
    execute: jest.fn(),
  };

  const mockToolAuth = {
    verifyStepAuthorization: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: AgentRuntimeService, useValue: mockAgentRuntime },
        { provide: ToolAuthorizationService, useValue: mockToolAuth },
      ],
    }).compile();

    service = module.get<WorkflowEngineService>(WorkflowEngineService);
    prisma = module.get<PrismaService>(PrismaService);
    eventBus = module.get<EventBusService>(EventBusService);
    agentRuntime = module.get<AgentRuntimeService>(AgentRuntimeService);
    toolAuth = module.get<ToolAuthorizationService>(ToolAuthorizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('start', () => {
    it('should initialize workflow steps and advance state machine to RUNNING', async () => {
      const mockProduction = {
        id: 'prod-123',
        title: 'The Last Horizon',
        description: 'Sci-fi blockbuster production',
        organizationId: 'org-test',
      };

      const mockWorkflow = {
        id: 'wf-123',
        productionId: 'prod-123',
        currentState: WorkflowState.CREATED,
        steps: [],
      };

      mockPrisma.production.findUnique.mockResolvedValue(mockProduction);
      mockPrisma.workflow.create.mockResolvedValue(mockWorkflow);
      mockPrisma.workflowStep.create.mockResolvedValue({ id: 'step-1', name: 'director-plan' });
      mockPrisma.workflow.update.mockResolvedValue({ ...mockWorkflow, currentState: WorkflowState.RUNNING });
      mockPrisma.workflow.findUnique.mockResolvedValue({
        ...mockWorkflow,
        currentState: WorkflowState.RUNNING,
        steps: [{ id: 'step-1', name: 'director-plan', status: WorkflowStepStatus.PENDING }],
      });

      // Mock private runNextReadySteps
      jest.spyOn(service as any, 'runNextReadySteps').mockResolvedValue(undefined);

      const result = await service.start('prod-123', 'Project Brief', 'user-1', 'org-test');

      expect(mockPrisma.production.findUnique).toHaveBeenCalledWith({ where: { id: 'prod-123' } });
      expect(mockPrisma.workflow.create).toHaveBeenCalled();
      expect(result.id).toBe('wf-123');
    });
  });

  describe('resumeAfterApproval', () => {
    it('should mark approval step completed and resume downstream workflow execution', async () => {
      const mockWorkflow = {
        id: 'wf-123',
        productionId: 'prod-123',
        currentState: WorkflowState.WAITING_APPROVAL,
        production: { organizationId: 'org-test' },
      };

      const mockApprovalStep = {
        id: 'step-app-1',
        name: 'budget-approval',
        status: WorkflowStepStatus.PENDING,
      };

      mockPrisma.workflow.findUnique.mockResolvedValue(mockWorkflow);
      mockPrisma.workflowStep.findFirst.mockResolvedValue(mockApprovalStep);
      mockPrisma.workflowStep.update.mockResolvedValue({ ...mockApprovalStep, status: WorkflowStepStatus.COMPLETED });
      mockPrisma.workflow.update.mockResolvedValue({ ...mockWorkflow, currentState: WorkflowState.RUNNING });

      jest.spyOn(service as any, 'runNextReadySteps').mockResolvedValue(undefined);

      await service.resumeAfterApproval('wf-123', 'user-1');

      expect(mockPrisma.workflowStep.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'step-app-1' },
          data: expect.objectContaining({ status: WorkflowStepStatus.COMPLETED }),
        }),
      );
    });
  });
});
