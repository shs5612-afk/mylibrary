/**
 * OpenAI Provider Implementation
 * Strategy 패턴: OpenAI GPT 모델 연동 (OCP 준수)
 */

import { BaseAIProvider } from './BaseAIProvider.js';

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async generateResponse({ systemPrompt, messages, bookContext }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key가 설정되지 않았습니다.');
    }

    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `OpenAI API 오류: ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '답변을 생성하지 못했습니다.';
  }
}
