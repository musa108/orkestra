import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AgentGeneration, AgentPromptSpec } from './ai-provider.interface';

/**
 * Calls the real ADK agent service (../../../../services/adk-agent) over
 * HTTP instead of hitting the raw Gemini SDK directly. This is what
 * actually satisfies "powered by Gemini + Google Cloud Agent Builder" —
 * GeminiAiProvider alone (a bare generateContent() call) does not, since
 * it bypasses Agent Builder/ADK's multi-agent delegation and tool-calling
 * infrastructure entirely.
 *
 * Requires the ADK service (and the MCP server it depends on) to be
 * running — see services/adk-agent/README.md and docker-compose.yml.
 */
@Injectable()
export class AdkAgentProvider implements AIProvider {
  private readonly logger = new Logger('AdkAgentProvider');
  private readonly baseUrl = process.env.ADK_AGENT_URL ?? 'http://localhost:8081';

  async generate(spec: AgentPromptSpec): Promise<AgentGeneration> {
    // agentType isn't part of AgentPromptSpec (the interface is provider-
    // agnostic), so it's inferred from the identity string set on each
    // BaseAgent subclass — matches the ADK service's AGENT_REGISTRY keys.
    const agentType = this.inferAgentType(spec.identity);

    const res = await fetch(`${this.baseUrl}/agents/${agentType}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        production_id: (spec.input as any).productionId ?? '',
        workflow_id: (spec.input as any).workflowId ?? '',
        input: spec.input,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ADK agent service returned ${res.status}: ${body}`);
    }

    const data = await res.json();
    return {
      structured_data: data.structured_data ?? {},
      reasoning_summary: data.reasoning_summary ?? '',
      confidence: data.confidence ?? 0.5,
      tokenUsage: undefined, // not exposed by the ADK service's response contract yet
    };
  }

  private inferAgentType(identity: string): string {
    const match = identity.match(/^(\w+) Agent/);
    return (match?.[1] ?? 'DIRECTOR').toUpperCase();
  }
}
