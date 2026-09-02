/**
 * AI Deep Reading Copilot Component (Refactored - DIP)
 * 의존성 역전 원칙: AIService 인스턴스를 주입받아 동작
 */

import { AI_PERSONAS } from '../services/ai/AIService.js';
import { MathRenderer } from '../utils/mathRenderer.js';

export class AICopilotView {
  /**
   * @param {Object} params
   * @param {HTMLElement} params.container
   * @param {Object} params.book
   * @param {import('../services/ai/AIService.js').AIService} params.aiService (DIP)
   * @param {Function} params.onSaveToWritingDrafts
   */
  constructor({ container, book, aiService, onSaveToWritingDrafts }) {
    this.container = container;
    this.book = book;
    this.aiService = aiService;
    this.onSaveToWritingDrafts = onSaveToWritingDrafts;
    this.messages = [];
    this.selectedPersona = 'scholar';
    this.isLoading = false;
  }

  render() {
    this.container.innerHTML = `
      <div class="ai-copilot-container">
        <!-- Header: Persona Selector -->
        <div class="ai-copilot-header">
          <div class="ai-persona-selector">
            <label style="font-size:0.85rem; font-weight:700; color:var(--text-main);">토론 페르소나:</label>
            <select id="selectAiPersona" class="select-input" style="padding:4px 10px;">
              <option value="scholar">🎓 학술 & 공학 연구자 (LaTeX 수식 증명)</option>
              <option value="coauthor">✍️ 공동 저술 파트너 (내 책 집필 아이디어)</option>
              <option value="socratic">🏛️ 소크라테스 비평가 (비판적 질문)</option>
              <option value="synthesizer">💡 지식 융합 및 통찰 요약가</option>
            </select>
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted);" id="personaDesc">
            ${AI_PERSONAS[this.selectedPersona].desc}
          </div>
        </div>

        <!-- Quick Question Starters -->
        <div style="padding: 10px 20px; background: var(--bg-surface); border-bottom: 1px solid var(--border-light); display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-dim);">추천 질문:</span>
          <button class="chip-btn quick-prompt-btn" data-prompt="이 책에서 다루는 가장 중요한 수학/공학적 모델과 수식을 엄밀하게 유도하고 설명해줘.">📐 핵심 수식 유도</button>
          <button class="chip-btn quick-prompt-btn" data-prompt="이 책의 핵심 통찰을 내가 쓸 다음 책의 챕터 구성과 주제 논거로 발전시키는 방안을 제안해줘.">✍️ 내 책 집필 아이디어</button>
          <button class="chip-btn quick-prompt-btn" data-prompt="저자가 제시한 중심 주장의 한계점이나 숨은 전제에 대해 비판적 반례를 들어 토론해줘.">🏛️ 비판적 고찰 및 반론</button>
        </div>

        <!-- Messages Body -->
        <div class="ai-chat-messages" id="chatMessagesBox">
          <div class="chat-bubble assistant">
            <div>
              안녕하세요! <strong>《${this.book.title}》</strong>을 함께 탐구하는 AI 독서 및 저술 파트너입니다.
              <br/><br/>
              책에서 읽으신 부분의 수식 전개, 난해한 개념, 또는 향후 <strong>선생님께서 직접 집필하실 책의 챕터 아이디어</strong>에 대해 무엇이든 편하게 질문해 주세요.
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div class="ai-chat-input-bar">
          <textarea id="inputAiMessage" rows="2" placeholder="책의 내용이나 수식, 인상 깊었던 부분에 대해 질문해 보세요... (Shift+Enter 줄바꿈, Enter 전송)"></textarea>
          <button id="btnSendAiMessage" class="btn btn-primary" style="height: auto; padding: 0 20px;">
            <i data-lucide="send"></i> 전송
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.attachEvents();
  }

  attachEvents() {
    const selectPersona = this.container.querySelector('#selectAiPersona');
    const personaDesc = this.container.querySelector('#personaDesc');
    const inputMsg = this.container.querySelector('#inputAiMessage');
    const btnSend = this.container.querySelector('#btnSendAiMessage');

    selectPersona.addEventListener('change', (e) => {
      this.selectedPersona = e.target.value;
      personaDesc.textContent = AI_PERSONAS[this.selectedPersona].desc;
    });

    this.container.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        inputMsg.value = prompt;
        this.sendMessage();
      });
    });

    inputMsg.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    btnSend.addEventListener('click', () => this.sendMessage());
  }

  async sendMessage() {
    const inputMsg = this.container.querySelector('#inputAiMessage');
    const messagesBox = this.container.querySelector('#chatMessagesBox');
    const text = inputMsg.value.trim();

    if (!text || this.isLoading) return;

    this.messages.push({ role: 'user', content: text });
    inputMsg.value = '';

    this.appendMessageToDOM('user', text);
    this.isLoading = true;

    const loadingId = `loading_${Date.now()}`;
    const loadingEl = document.createElement('div');
    loadingEl.id = loadingId;
    loadingEl.className = 'chat-bubble assistant';
    loadingEl.innerHTML = '<span style="color:var(--text-muted);"><i data-lucide="loader-2" class="spin"></i> AI 파트너가 책의 맥락과 LaTeX 수식을 분석하고 있습니다...</span>';
    messagesBox.appendChild(loadingEl);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    if (window.lucide) window.lucide.createIcons();

    try {
      const reply = await this.aiService.chat({
        personaKey: this.selectedPersona,
        messages: this.messages,
        bookContext: this.book
      });

      this.messages.push({ role: 'assistant', content: reply });

      const loadingDom = document.getElementById(loadingId);
      if (loadingDom) loadingDom.remove();

      this.appendMessageToDOM('assistant', reply);

    } catch (e) {
      console.error(e);
      const loadingDom = document.getElementById(loadingId);
      if (loadingDom) {
        loadingDom.innerHTML = `<span style="color:var(--accent-danger);">⚠️ 오류가 발생했습니다: ${e.message}</span>`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  appendMessageToDOM(role, content) {
    const messagesBox = this.container.querySelector('#chatMessagesBox');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    const parsedHtml = MathRenderer.renderMarkdownAndMath(content);

    if (role === 'assistant') {
      const msgId = `msg_${Date.now()}`;
      bubble.innerHTML = `
        <div class="chat-content">${parsedHtml}</div>
        <div class="chat-bubble-footer">
          <span style="font-size:0.75rem; color:var(--text-dim);">${AI_PERSONAS[this.selectedPersona].name}</span>
          <button class="btn-save-to-draft" data-msg-id="${msgId}">
            <i data-lucide="star"></i> ⭐ 내 책 집필 자료로 저장
          </button>
        </div>
      `;

      const saveBtn = bubble.querySelector('.btn-save-to-draft');
      saveBtn.addEventListener('click', () => {
        let category = 'core_insight';
        if (content.includes('$$') || content.includes('\\frac') || content.includes('\\int')) {
          category = 'latex_proof';
        } else if (content.includes('챕터') || content.includes('목차') || content.includes('집필')) {
          category = 'book_ideas';
        }

        const draftItem = {
          id: `wd_${Date.now()}`,
          category,
          title: `《${this.book.title}》 AI 심층 토론 통찰`,
          content,
          createdAt: new Date().toISOString().split('T')[0]
        };

        if (this.onSaveToWritingDrafts) {
          this.onSaveToWritingDrafts(draftItem);
          saveBtn.innerHTML = '<span>✅ 집필 자료함에 저장 완료!</span>';
          saveBtn.style.borderColor = 'var(--accent-success)';
          saveBtn.style.color = 'var(--accent-success)';
        }
      });

    } else {
      bubble.innerHTML = `<div>${parsedHtml}</div>`;
    }

    messagesBox.appendChild(bubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    if (window.lucide) window.lucide.createIcons();
  }
}
