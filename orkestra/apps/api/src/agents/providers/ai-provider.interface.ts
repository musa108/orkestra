export interface AgentPromptSpec {
  identity: string;
  goal: string;
  constraints: string[];
  outputSchema: Record<string, unknown>; // JSON-schema-ish description
  input: Record<string, unknown>;
}

export interface AgentGeneration {
  structured_data: Record<string, unknown>;
  reasoning_summary: string;
  confidence: number; // 0..1
  tokenUsage?: { input: number; output: number };
}

/**
 * AIProvider — the pluggable boundary between the Agent Runtime and
 * whatever actually does the reasoning. Two implementations ship in this
 * scaffold:
 *   - MockAiProvider: deterministic, offline, used by default
 *   - GeminiAiProvider: real Gemini call, activates only when
 *     AI_PROVIDER=gemini and GEMINI_API_KEY is set
 */
export interface AIProvider {
  generate(spec: AgentPromptSpec): Promise<AgentGeneration>;
}

export const AI_PROVIDER = Symbol('AI_PROVIDER');
