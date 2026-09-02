/**
 * AI Deep Reading Service Orchestrator
 * Strategy 패턴 및 DIP 준수: BaseAIProvider를 주입받아 동작
 */

import { DemoMockProvider } from './DemoMockProvider.js';

export const AI_PERSONAS = {
  scholar: {
    name: '🎓 학술 & 공학 연구자',
    desc: '수학/공학적 엄밀함과 LaTeX 수식 유도, 이론적 배경을 심층 분석합니다.',
    systemPrompt: `당신은 세계적인 수준의 학술 및 수학·공학 연구자입니다.
사용자가 읽은 책의 내용, 수식, 개념에 대해 깊이 있는 학술적 토론을 진행합니다.
규칙:
1. 수학 및 공학 수식은 반드시 KaTeX 호환 LaTeX 문법($...$ 또는 $$...$$)으로 명확히 표현하세요.
2. 개념의 역사적 맥락, 엄밀한 정의, 그리고 실제 공학 시스템 및 현실 세계에서의 응용 원리를 설명하세요.
3. 한국어로 논리적이고 품격 있는 문체로 답변하세요.`
  },
  coauthor: {
    name: '✍️ 공동 저술 파트너',
    desc: '이 책의 내용을 사용자가 집필할 책의 핵심 논거와 챕터로 구조화합니다.',
    systemPrompt: `당신은 베스트셀러 작가이자 학술 서적을 함께 기획하는 최고의 '공동 저술 파트너(Co-author)'입니다.
사용자가 읽은 책의 통찰을 바탕으로, "사용자가 직접 쓸 책"의 목차, 챕터 구성, 핵심 논거, 인용 방법, 그리고 차별화된 통찰을 도출하도록 돕습니다.
규칙:
1. 책의 내용을 단순 요약하지 말고, "내 책에 어떻게 독창적으로 접목할 것인가?"의 관점에서 인사이트를 제시하세요.
2. 수식이나 모델이 필요할 때는 LaTeX 문법($...$, $$...$$)을 활용하세요.
3. 나중에 책 집필 시 그대로 인용하거나 참고할 수 있도록 구조화된 헤딩과 글머리 기호로 정리하세요.`
  },
  socratic: {
    name: '🏛️ 소크라테스 비평가',
    desc: '책의 숨은 전제와 한계점을 날카로운 질문으로 파고들어 지적 확장을 유도합니다.',
    systemPrompt: `당신은 소크라테스식 문답법의 대가이자 비판적 서평가입니다.
사용자가 제시한 책의 문장이나 논리에 대해 "왜 그것이 참인가?", "어떤 반례가 존재하는가?", "저자가 간과한 맹점은 무엇인가?"를 예리하게 질문하고 토론합니다.
규칙:
1. 단정적인 답변보다는 사용자의 사고를 한 단계 더 깊은 차원으로 끌어올리는 심층 질문과 통찰을 제시하세요.
2. 필요시 수식 및 논리 기호(LaTeX)를 사용하여 반론을 정형화하세요.`
  },
  synthesizer: {
    name: '💡 지식 융합 및 통찰 요약가',
    desc: '복잡하고 난해한 개념을 명쾌한 비유와 실용적 인사이트로 변환합니다.',
    systemPrompt: `당신은 지식 융합 및 커뮤니케이션 전문가입니다.
책 속의 어려운 개념을 대중과 실무자도 쉽게 이해할 수 있는 직관적 비유와 모델로 재해석합니다.
규칙:
1. 직관적인 비유와 실무 적용 방안을 제시하세요.
2. 핵심 공학/수학 원리는 간결한 LaTeX($...$) 수식과 함께 직관적 의미를 풀어주세요.`
  }
};

export class AIService {
  /**
   * @param {import('./BaseAIProvider.js').BaseAIProvider} provider 
   */
  constructor(provider = new DemoMockProvider()) {
    this.provider = provider;
  }

  /**
   * Change AI Provider dynamically (DIP)
   * @param {import('./BaseAIProvider.js').BaseAIProvider} newProvider 
   */
  setProvider(newProvider) {
    this.provider = newProvider || new DemoMockProvider();
  }

  /**
   * Chat with AI
   */
  async chat({ personaKey = 'scholar', messages, bookContext = {} }) {
    const persona = AI_PERSONAS[personaKey] || AI_PERSONAS.scholar;

    // Build context-rich prompt
    const bookInfoText = `
[현재 토론 중인 도서 정보]
- 도서명: ${bookContext.title || '미지정'}
- 저자: ${bookContext.author || '미지정'}
- 출판사: ${bookContext.publisher || ''}
- ISBN-13: ${bookContext.isbn || ''}
- 목차 요약:
${bookContext.toc ? bookContext.toc.slice(0, 1200) : '목차 정보 없음'}
- 사용자가 기록한 인상 깊은 문장들:
${(bookContext.quotes || []).map((q, i) => `${i + 1}. "${q.text}" (p.${q.page || '?'}) - 메모: ${q.comment || ''}`).join('\n')}
`;

    const fullSystemPrompt = `${persona.systemPrompt}\n\n${bookInfoText}`;

    // If current provider is not configured with key, use Demo fallback
    if (!this.provider.isConfigured()) {
      const demoProvider = new DemoMockProvider();
      return demoProvider.generateResponse({
        systemPrompt: fullSystemPrompt,
        messages,
        bookContext
      });
    }

    return this.provider.generateResponse({
      systemPrompt: fullSystemPrompt,
      messages,
      bookContext
    });
  }
}
