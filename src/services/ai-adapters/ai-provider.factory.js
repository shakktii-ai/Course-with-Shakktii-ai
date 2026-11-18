import { GeminiAdapter } from './gemini.adapter.js';
import { OpenAIAdapter } from './openai.adapter.js';
import { MockAIAdapter } from './mock-ai.adapter.js';
import AIProviderConfiguration from '../../models/AIProviderConfiguration.js';
import { AI_PROVIDER } from '../../constants/index.js';

export class AIProviderFactory {
  static async getProvider(tenantId, preferredProvider = null) {
    let providerType = preferredProvider;

    if (!providerType && tenantId) {
      const config = await AIProviderConfiguration.findOne({ tenantId, isEnabled: true });
      if (config) {
        providerType = config.provider;
      }
    }

    if (!providerType) {
      providerType = process.env.DEFAULT_AI_PROVIDER || AI_PROVIDER.GEMINI;
    }

    switch (providerType.toUpperCase()) {
      case AI_PROVIDER.OPENAI:
        return new OpenAIAdapter();
      case AI_PROVIDER.GEMINI:
        return new GeminiAdapter();
      case AI_PROVIDER.MOCK:
      default:
        return new MockAIAdapter();
    }
  }
}

