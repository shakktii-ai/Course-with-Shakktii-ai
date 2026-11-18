/**
 * Base AI Adapter Interface
 * All AI providers must implement these contract methods.
 */
export class BaseAIAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  async generateText(prompt, options = {}) {
    throw new Error('generateText must be implemented by provider adapter');
  }

  async generateOutline(brief, sourceChunks, options = {}) {
    throw new Error('generateOutline must be implemented by provider adapter');
  }

  async generateLesson(brief, lessonTitle, sourceChunks, options = {}) {
    throw new Error('generateLesson must be implemented by provider adapter');
  }

  async generateEmbeddings(texts, options = {}) {
    throw new Error('generateEmbeddings must be implemented by provider adapter');
  }

  async rewriteContent(content, mode, options = {}) {
    throw new Error('rewriteContent must be implemented by provider adapter');
  }

  async generateQuiz(content, options = {}) {
    throw new Error('generateQuiz must be implemented by provider adapter');
  }

  async generateTutorReply(payload, options = {}) {
    throw new Error('generateTutorReply must be implemented by provider adapter');
  }

  async generateSocraticHints(payload, options = {}) {
    throw new Error('generateSocraticHints must be implemented by provider adapter');
  }

  async generateRemediation(payload, options = {}) {
    throw new Error('generateRemediation must be implemented by provider adapter');
  }
}


