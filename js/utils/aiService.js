/**
 * AI Deep Reading & Writing Copilot Service
 * Google Gemini API & OpenAI API 연동 및 전문 독서 페르소나 엔진
 */

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
   * Send message to AI and receive deep reading insights
   * @param {Object} params 
   * @param {string} params.personaKey scholar, coauthor, socratic, synthesizer
   * @param {Array} params.messages [{role: 'user'|'assistant', content: string}]
   * @param {Object} params.bookContext Current book metadata (title, author, toc, quotes)
   * @param {Object} params.settings User settings (API keys, provider)
   * @returns {Promise<string>} AI Reply text with LaTeX
   */
  static async chat({ personaKey = 'scholar', messages, bookContext = {}, settings = {} }) {
    const persona = AI_PERSONAS[personaKey] || AI_PERSONAS.scholar;
    const provider = settings.aiProvider || 'gemini';

    // Build context-rich system prompt
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

    // 1. Direct Client-Side Gemini API (if user provided key)
    if (provider === 'gemini' && settings.geminiApiKey) {
      return this.callGeminiDirect(settings.geminiApiKey, fullSystemPrompt, messages);
    }

    // 2. Direct Client-Side OpenAI API (if user provided key)
    if (provider === 'openai' && settings.openAiApiKey) {
      return this.callOpenAiDirect(settings.openAiApiKey, fullSystemPrompt, messages);
    }

    // 3. Fallback to Vercel Serverless Function (/api/chat)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          messages,
          systemPrompt: fullSystemPrompt,
          apiKey: provider === 'gemini' ? settings.geminiApiKey : settings.openAiApiKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          return data.reply;
        }
      }
    } catch (e) {
      console.warn('Vercel AI proxy unavailable:', e);
    }

    // If no API key configured, provide a helpful demo response with rich LaTeX
    return this.getDemoResponse(personaKey, messages[messages.length - 1]?.content || '', bookContext);
  }

  static async callGeminiDirect(apiKey, systemPrompt, messages) {
    const model = 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `[시스템 역할 지침]\n${systemPrompt}` }]
      },
      {
        role: 'model',
        parts: [{ text: '이해했습니다. 독서 파트너 및 저술 코파일럿으로서 LaTeX 수식과 깊이 있는 분석으로 답변하겠습니다.' }]
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
      throw new Error(err.error?.message || `Gemini API Error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성하지 못했습니다.';
  }

  static async callOpenAiDirect(apiKey, systemPrompt, messages) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        temperature: 0.7
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `OpenAI API Error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '답변을 생성하지 못했습니다.';
  }

  static getDemoResponse(personaKey, userQuery, bookContext) {
    return `### 💡 《${bookContext.title || '이 책'}》에 대한 심층 분석 (데모 모드)

> **안내**: 실제 실시간 AI 대화를 진행하시려면 상단 [설정(⚙️)]에서 **Google Gemini API Key**(무료) 또는 **OpenAI Key**를 등록해 주세요.

#### 1. 핵심 질문 분석 및 이론적 모델
입력하신 질의: *"**${userQuery}**"*

이 개념은 저자가 강조하는 핵심 원리와 밀접하게 연결됩니다. 수학 및 공학적 모델링 관점에서 이를 다음과 같이 수식화할 수 있습니다:

$$\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p_{data}} [\\log p_\\theta(x)] - \\beta D_{KL}(q_\\phi(z|x) \\parallel p(z))$$

#### 2. 향후 저술 및 집필을 위한 제안
- **챕터 배치**: 사용자가 집필하실 도서의 *'제 3장: 연속성과 변화율의 지적 구조'*에 이 논거를 배치하는 것을 추천합니다.
- **인용 전략**: 원서의 핵심 명제와 연결하여 독자에게 직관적인 다이어그램과 함께 제시하세요.

하단의 **[⭐ 내 책 집필 자료로 저장]** 버튼을 누르면 이 통찰이 책 하단 저술 참고자료함에 자동으로 기록됩니다!`;
  }
}
