import { BaseAIAdapter } from './base-ai.adapter.js';
import { MockAIAdapter } from './mock-ai.adapter.js';
import { logger } from '../../lib/logger.js';

export class OpenAIAdapter extends BaseAIAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'OPENAI';
    this.apiKey = process.env.OPENAI_API_KEY || config.apiKey || '';
    this.model = config.model || 'gpt-4o-mini';
    this.mockFallback = new MockAIAdapter(config);
  }

  async generateText(prompt) {
    if (!this.apiKey) {
      logger.info('[OpenAIAdapter] No OPENAI_API_KEY detected, using deterministic fallback adapter.');
      return await this.mockFallback.generateText(prompt);
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      logger.error('[OpenAIAdapter] API invocation failed, falling back:', err);
      return await this.mockFallback.generateText(prompt);
    }
  }

  async generateOutline(brief, sourceChunks = [], options = {}) {
    return await this.mockFallback.generateOutline(brief, sourceChunks, options);
  }

  async generateLesson(brief, lessonTitle, sourceChunks = [], options = {}) {
    return await this.mockFallback.generateLesson(brief, lessonTitle, sourceChunks, options);
  }

  async generateEmbeddings(texts, options = {}) {
    return await this.mockFallback.generateEmbeddings(texts, options);
  }

  async rewriteContent(content, mode = 'REWRITE', options = {}) {
    return await this.mockFallback.rewriteContent(content, mode, options);
  }

  async generateQuiz(content, options = {}) {
    return await this.mockFallback.generateQuiz(content, options);
  }

  async generateTutorReply(payload, options = {}) {
    return await this.mockFallback.generateTutorReply(payload, options);
  }

  async generateSocraticHints(payload, options = {}) {
    return await this.mockFallback.generateSocraticHints(payload, options);
  }

  async generateRemediation(payload, options = {}) {
    return await this.mockFallback.generateRemediation(payload, options);
  }
}


