/**
 * Abstract Base AI Provider
 * Strategy 패턴 기반 AI 모델 제공자 인터페이스 (OCP & LSP 준수)
 */

export class BaseAIProvider {
  /**
   * @param {Object} params
   * @param {string} params.systemPrompt
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {Object} params.bookContext
   * @returns {Promise<string>}
   */
  async generateResponse({ systemPrompt, messages, bookContext }) {
    throw new Error('BaseAIProvider.generateResponse() must be implemented by subclass.');
  }

  /**
   * Check if provider is properly configured (e.g. API key exists)
   * @returns {boolean}
   */
  isConfigured() {
    return true;
  }
}
