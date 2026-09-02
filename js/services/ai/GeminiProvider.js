/**
 * Google Gemini AI Provider Implementation
 * Strategy 패턴: Gemini API 연동 (OCP 준수)
 */

import { BaseAIProvider } from './BaseAIProvider.js';

export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gemini-1.5-flash') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async generateResponse({ systemPrompt, messages, bookContext }) {
    if (!this.apiKey) {
      throw new Error('Google Gemini API Key가 설정되지 않았습니다.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `[시스템 역할 지침]\n${systemPrompt}` }]
      },
      {
        role: 'model',
        parts: [{ text: '이해했습니다. 독서 파트너 및 저술 코파일럿으로서 LaTeX 수식과 깊이 있는 학술적 분석으로 답변하겠습니다.' }]
      }
    ];

    for (const m of messages) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Gemini API 오류: ${res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성하지 못했습니다.';
  }
}
