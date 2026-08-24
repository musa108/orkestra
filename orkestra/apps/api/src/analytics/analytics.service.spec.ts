import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClickHouseService } from '../events/clickhouse.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;
  let clickhouse: ClickHouseService;

  const mockPrisma = {
    production: { count: jest.fn().mockResolvedValue(5) },
    workflow: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([]) },
    approval: { count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([]) },
    agent: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const mockClickhouse = {
    isAvailable: jest.fn().mockReturnValue(true),
    getWorkflowPerformance: jest.fn().mockResolvedValue({
      startedCount: 10,
      completedCount: 10,
      failedCount: 0,
      successRate: 100,
      avgDurationMs: 3800,
      stepBreakdown: [],
    }),
    getAgentPerformance: jest.fn().mockResolvedValue([]),
    getApprovalLatency: jest.fn().mockResolvedValue({
      totalRequested: 4,
      totalGranted: 4,
      totalRejected: 0,
      approvalRate: 100,
      rejectionRate: 0,
      avgTurnaroundSecs: 45,
    }),
    getHistoricalRiskPatterns: jest.fn().mockResolvedValue([
      {
        factor: 'schedule_compression',
        correlationScore: 0.82,
        observedIncidents: 3,
        finding: 'Historical productions with compressed schedules experienced approval delays.',
        recommendationTemplate: 'Incorporate 5-day contingency buffer.',
        source: 'clickhouse',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClickHouseService, useValue: mockClickhouse },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
    clickhouse = module.get<ClickHouseService>(ClickHouseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return combined performance intelligence from ClickHouse', async () => {
    const data = await service.performance('org-123');
    expect(data.source).toBe('clickhouse');
    expect(data.clickhouseAvailable).toBe(true);
    expect(data.workflowPerformance.startedCount).toBe(10);
  });

  it('should fall back gracefully to Postgres when ClickHouse is unavailable', async () => {
    mockClickhouse.isAvailable.mockReturnValue(false);
    mockClickhouse.getWorkflowPerformance.mockResolvedValue(null);

    const data = await service.performance('org-123');
    expect(data.source).toBe('postgres-fallback');
    expect(data.clickhouseAvailable).toBe(false);
  });

  it('should return risk intelligence patterns from ClickHouse or fallback', async () => {
    mockClickhouse.isAvailable.mockReturnValue(true);
    const data = await service.productionIntelligence('org-123');
    expect(data.clickhouseAvailable).toBe(true);
    expect(Array.isArray(data.patterns)).toBe(true);
    expect(data.patterns.length).toBeGreaterThan(0);
  });
});
