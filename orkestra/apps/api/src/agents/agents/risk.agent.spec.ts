import { Test, TestingModule } from '@nestjs/testing';
import { RiskAgent } from './risk.agent';
import { AIProvider, AgentGeneration } from '../providers/ai-provider.interface';

describe('RiskAgent', () => {
  let agent: RiskAgent;
  let mockProvider: AIProvider;

  beforeEach(async () => {
    mockProvider = {
      generate: jest.fn(),
    };

    agent = new RiskAgent(mockProvider);
  });

  it('should be defined with RISK type and schema', () => {
    expect(agent).toBeDefined();
    expect(agent.type).toBe('RISK');
    expect(agent.outputSchema).toHaveProperty('riskLevel');
    expect(agent.outputSchema).toHaveProperty('evidence');
  });

  it('should execute prompt spec and return structured data with confidence', async () => {
    const expectedGeneration: AgentGeneration = {
      structured_data: {
        riskLevel: 'HIGH',
        summary: 'Schedule compression and multi-unit complexity pose 32% turnaround risk.',
        contributingFactors: ['schedule_compression'],
        evidence: [
          {
            factor: 'schedule_compression',
            source: 'clickhouse',
            finding: 'Historical correlation score 0.84 on similar productions.',
          },
        ],
        recommendation: 'Authorize 15% budget and schedule buffer.',
        expectedImpact: 'Mitigates 40% downstream delay probability.',
        affectedWorkflowSteps: ['schedule-generation', 'budget-approval'],
      },
      reasoning_summary: 'Historical ClickHouse analysis shows elevated turnaround risk.',
      confidence: 0.92,
    };

    (mockProvider.generate as jest.Mock).mockResolvedValue(expectedGeneration);

    const result = await agent.execute({
      productionId: 'prod-123',
      workflowId: 'wf-123',
      input: {
        budget: 8500000,
        timelineWeeks: 12,
      },
    });

    expect(mockProvider.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: agent.identity,
        goal: agent.goal,
        constraints: agent.constraints,
        outputSchema: agent.outputSchema,
      }),
    );
    expect(result.structured_data).toEqual(expectedGeneration.structured_data);
    expect(result.confidence).toBe(0.92);
  });
});
