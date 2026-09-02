/**
 * Demo Mock AI Provider Implementation
 * API 키가 없을 때 동작하는 데모/폴백 시뮬레이터 (LSP & OCP 준수)
 */

import { BaseAIProvider } from './BaseAIProvider.js';

export class DemoMockProvider extends BaseAIProvider {
  async generateResponse({ systemPrompt, messages, bookContext }) {
    const lastUserQuery = messages[messages.length - 1]?.content || '';

    return `### 💡 《${bookContext.title || '이 책'}》에 대한 심층 분석 (데모 모드)

> **안내**: 실제 실시간 AI 대화를 진행하시려면 상단 [설정(⚙️)]에서 **Google Gemini API Key**(무료) 또는 **OpenAI Key**를 등록해 주세요.

#### 1. 핵심 질문 분석 및 이론적 모델
입력하신 질의: *"**${lastUserQuery}**"*

이 개념은 저자가 강조하는 핵심 원리와 밀접하게 연결됩니다. 수학 및 공학적 모델링 관점에서 이를 다음과 같이 수식화할 수 있습니다:

$$\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p_{data}} [\\log p_\\theta(x)] - \\beta D_{KL}(q_\\phi(z|x) \\parallel p(z))$$

#### 2. 향후 저술 및 집필을 위한 제안
- **챕터 배치**: 사용자가 집필하실 도서의 *'제 3장: 연속성과 변화율의 지적 구조'*에 이 논거를 배치하는 것을 추천합니다.
- **인용 전략**: 원서의 핵심 명제와 연결하여 독자에게 직관적인 다이어그램과 함께 제시하세요.

하단의 **[⭐ 내 책 집필 자료로 저장]** 버튼을 누르면 이 통찰이 책 하단 저술 참고자료함에 자동으로 기록됩니다!`;
  }
}
