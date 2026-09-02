/**
 * Google Gemini AI Provider Implementation
 * Strategy 패턴: Gemini 3.7 Flash -> 3.6 Flash -> 3.5 Flash 자동 순차 적용 및 Fallback
 */

import { BaseAIProvider } from './BaseAIProvider.js';

export class GeminiProvider extends BaseAIProvider {
  /**
   * Gemini 모델 순차 적용 우선순위 (3.7 Flash -> 3.6 Flash -> 3.5 Flash -> 2.5/2.0/1.5)
   */
  static MODELS_CASCADE = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  constructor(apiKey, preferredModel = 'gemini-3.7-flash') {
    super();
    this.apiKey = apiKey;
    this.preferredModel = preferredModel;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async generateResponse({ systemPrompt, messages, bookContext }) {
    if (!this.apiKey) {
      throw new Error('Google Gemini API Key가 설정되지 않았습니다. [설정⚙️]에서 API 키를 입력해 주세요.');
    }

    // 우선순위 모델 큐 구성 (선택된 모델 -> 3.7 Flash -> 3.6 Flash -> 3.5 Flash 순서)
    const modelQueue = [
      this.preferredModel,
      ...GeminiProvider.MODELS_CASCADE.filter(m => m !== this.preferredModel)
    ];

    const contents = [
      {
        role: 'user',
        parts: [{ text: `[시스템 역할 지침]\n${systemPrompt}\n\n[도서 컨텍스트]\n${bookContext || '선택된 도서'}` }]
      },
      {
        role: 'model',
        parts: [{ text: '이해했습니다. 심층 독서 파트너이자 공동 저술 코파일럿으로서 LaTeX 수식($...$, $$...$$)과 학술적 깊이를 갖춘 전문적 답변을 드리겠습니다.' }]
      }
    ];

    for (const m of messages) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    let lastError = null;

    // 순차 적용 (3.7 Flash -> 3.6 Flash -> 3.5 Flash ...)
    for (const modelName of modelQueue) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;
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

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return reply;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn(`Gemini [${modelName}] 응답 실패, 다음 우선순위 모델로 자동 전환합니다:`, errData.error?.message || res.statusText);
          lastError = new Error(errData.error?.message || `Gemini ${modelName} 오류 (${res.status})`);
        }
      } catch (err) {
        console.warn(`Gemini [${modelName}] 네트워크 통신 예외 발생, 다음 모델 시도:`, err);
        lastError = err;
      }
    }

    throw lastError || new Error('모든 Gemini 모델(3.7 Flash, 3.6 Flash, 3.5 Flash) 요청에 실패했습니다. API 키와 네트워크 상태를 확인해 주세요.');
  }
}
