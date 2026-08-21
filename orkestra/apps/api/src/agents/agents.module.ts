import { Module, Provider } from '@nestjs/common';
import { AgentRuntimeService } from './agent-runtime.service';
import { AgentsController } from './agents.controller';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { MockAiProvider } from './providers/mock.provider';
import { GeminiAiProvider } from './providers/gemini.provider';
import { AdkAgentProvider } from './providers/adk.provider';
import { DirectorAgent } from './agents/director.agent';
import { ScriptAgent } from './agents/script.agent';
import { BudgetAgent } from './agents/budget.agent';
import { ScheduleAgent } from './agents/schedule.agent';
import { RiskAgent } from './agents/risk.agent';
import { MarketingAgent } from './agents/marketing.agent';
import { AnalyticsAgent } from './agents/analytics.agent';

const providerFactory: Provider = {
  provide: AI_PROVIDER,
  useFactory: () => {
    // "adk"    -> real Google ADK agents (Gemini + Agent Builder infra +
    //             MCP tools) via services/adk-agent's HTTP API
    // "gemini" -> raw Gemini SDK call, no Agent Builder/ADK/MCP involved
    // "mock"   -> deterministic offline provider (default)
    switch (process.env.AI_PROVIDER) {
      case 'adk':
        return new AdkAgentProvider();
      case 'gemini':
        return new GeminiAiProvider();
      default:
        return new MockAiProvider();
    }
  },
};

function agentFactory(AgentClass: any) {
  return {
    provide: AgentClass,
    useFactory: (provider: any) => new AgentClass(provider),
    inject: [AI_PROVIDER],
  };
}

@Module({
  providers: [
    providerFactory,
    agentFactory(DirectorAgent),
    agentFactory(ScriptAgent),
    agentFactory(BudgetAgent),
    agentFactory(ScheduleAgent),
    agentFactory(RiskAgent),
    agentFactory(MarketingAgent),
    agentFactory(AnalyticsAgent),
    AgentRuntimeService,
  ],
  controllers: [AgentsController],
  exports: [AgentRuntimeService],
})
export class AgentsModule {}
