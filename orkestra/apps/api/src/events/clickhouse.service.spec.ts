import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ClickHouseService } from './clickhouse.service';

describe('ClickHouseService', () => {
  let service: ClickHouseService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickHouseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'CLICKHOUSE_URL') return 'http://localhost:8123';
              if (key === 'CLICKHOUSE_DATABASE') return 'orkestra';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ClickHouseService>(ClickHouseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return statistical risk patterns for prompt grounding', async () => {
    const patterns = await service.getHistoricalRiskPatterns('org-123');
    expect(Array.isArray(patterns)).toBe(true);
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0]).toHaveProperty('factor');
    expect(patterns[0]).toHaveProperty('correlationScore');
  });

  it('should handle degraded availability without crashing', async () => {
    jest.spyOn(service as any, 'query').mockImplementation(() => {
      throw new Error('Connection refused');
    });
    const perf = await service.getWorkflowPerformance('org-123');
    expect(perf).toBeNull();
  });
});
