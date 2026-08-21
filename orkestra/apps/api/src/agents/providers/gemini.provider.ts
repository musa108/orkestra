import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AgentGeneration, AgentPromptSpec } from './ai-provider.interface';

/**
 * Real Gemini-backed provider. Inactive unless GEMINI_API_KEY is set and
 * AI_PROVIDER=gemini — see AgentsModule for the selection logic.
 */
@Injectable()
export class GeminiAiProvider implements AIProvider {
  private readonly logger = new Logger('GeminiAiProvider');
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key) this.client = new GoogleGenerativeAI(key);
  }

  async generate(spec: AgentPromptSpec): Promise<AgentGeneration> {
    if (!this.client) {
      throw new Error(
        'GeminiAiProvider selected but GEMINI_API_KEY is not set. ' +
        'Set AI_PROVIDER=mock or provide a key in .env.',
      );
    }

    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = [
      `Identity: ${spec.identity}`,
      `Goal: ${spec.goal}`,
      `Constraints: ${spec.constraints.join('; ')}`,
      `Expected JSON schema (keys): ${Object.keys(spec.outputSchema).join(', ')}`,
      `Input: ${JSON.stringify(spec.input)}`,
      'Respond ONLY with a JSON object containing: structured_data (matching the schema keys), reasoning_summary (string), confidence (0-1 float).',
    ].join('\n\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const parsed = JSON.parse(text);
      return {
        structured_data: parsed.structured_data ?? {},
        reasoning_summary: parsed.reasoning_summary ?? '',
        confidence: parsed.confidence ?? 0.5,
      };
    } catch (err) {
      this.logger.error('Failed to parse Gemini JSON response', text);
      throw new Error('Gemini returned non-JSON output; validation failed.');
    }
  }
}
