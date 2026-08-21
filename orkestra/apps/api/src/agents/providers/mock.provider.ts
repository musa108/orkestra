import { Injectable } from '@nestjs/common';
import { AIProvider, AgentGeneration, AgentPromptSpec } from './ai-provider.interface';

/**
 * Deterministic offline provider. Produces realistic, schema-shaped
 * fake output so the whole workflow can run end-to-end (including the
 * demo flow) without any external API key.
 */
@Injectable()
export class MockAiProvider implements AIProvider {
  async generate(spec: AgentPromptSpec): Promise<AgentGeneration> {
    // simulate latency
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    const structured = this.fakeOutputFor(spec);
    return {
      structured_data: structured,
      reasoning_summary: `Analyzed input against "${spec.goal}" using constraints: ${spec.constraints.join(', ')}.`,
      confidence: Number((0.75 + Math.random() * 0.2).toFixed(2)),
      tokenUsage: { input: 512, output: 256 },
    };
  }

  private fakeOutputFor(spec: AgentPromptSpec): Record<string, unknown> {
    // Shape the mock output by inspecting the requested schema keys so
    // downstream agent code (which reads structured_data.<field>) works
    // the same whether mocked or real.
    const keys = Object.keys(spec.outputSchema);
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = this.fakeValueFor(key);
    }
    return out;
  }

  private fakeValueFor(key: string): unknown {
    const k = key.toLowerCase();
    if (k.includes('list') || k.includes('scenes') || k.includes('characters') || k.includes('locations') || k.includes('checklist') || k.includes('costs') || k.includes('risks') || k.includes('recommendations') || k.includes('content'))
      return [`Sample ${key} item A`, `Sample ${key} item B`];
    if (k.includes('score') || k.includes('confidence')) return Number((Math.random() * 100).toFixed(1));
    if (k.includes('cost') || k.includes('budget') || k.includes('estimate') || k.includes('contingency'))
      return Math.round(50000 + Math.random() * 450000);
    if (k.includes('date') || k.includes('timeline')) return new Date(Date.now() + 30 * 86400000).toISOString();
    if (k.includes('order')) return ['Scene 1', 'Scene 3', 'Scene 2'];
    return `Generated ${key} (mock)`;
  }
}
