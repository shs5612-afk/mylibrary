/**
 * Reading Notes & Quotes View Component
 * 인상 깊은 문장 수집소, 감성 문장 카드 연동, 지식 카드 4종 분류(증명/개념/아이디어/발췌),
 * 저술 적용 메모, 마크다운 원클릭 복사, KaTeX/마크다운 서평 및 4단계 지적 성찰 템플릿
 */

import { MathRenderer } from '../utils/mathRenderer.js';

export class ReadingNotesView {
  constructor({ container, book, onSaveQuotes, onSaveReview, onOpenQuoteCard }) {
    this.container = container;
    this.book = book;
    this.onSaveQuotes = onSaveQuotes;
    this.onSaveReview = onSaveReview;
    this.onOpenQuoteCard = onOpenQuoteCard;
  }

  render() {
    const quotes = this.book.quotes || [];
    const review = this.book.review || '';

    this.container.innerHTML = `
      <div class="reading-notes-wrapper">
        
        <!-- Part A: Knowledge & Quotes Vault -->
        <div class="quotes-section">
          <div class="quotes-header-row">
            <h3 style="font-family:var(--font-serif); display:flex; align-items:center; gap:8px;">
              <i data-lucide="quote" class="text-primary"></i> 지식 카드 & 인상 깊은 문장 수집소 (${quotes.length})
            </h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">수학/공학 수식($...$) 및 저술 적용 메모를 지원합니다.</span>
          </div>

          <!-- Add Quote Card Box -->
          <div class="quote-input-card">
            <!-- Knowledge Type Selector -->
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
              <span style="font-size:0.82rem; font-weight:600; color:var(--text-muted);">분류 유형:</span>
              <label class="type-radio-label" style="display:inline-flex; align-items:center; gap:4px; font-size:0.82rem; cursor:pointer;">
                <input type="radio" name="quoteType" value="proof"> 📐 증명/원리
              </label>
              <label class="type-radio-label" style="display:inline-flex; align-items:center; gap:4px; font-size:0.82rem; cursor:pointer;">
                <input type="radio" name="quoteType" value="concept" checked> 💡 핵심 개념
              </label>
              <label class="type-radio-label" style="display:inline-flex; align-items:center; gap:4px; font-size:0.82rem; cursor:pointer;">
                <input type="radio" name="quoteType" value="idea"> 🚀 적용/아이디어
              </label>
              <label class="type-radio-label" style="display:inline-flex; align-items:center; gap:4px; font-size:0.82rem; cursor:pointer;">
                <input type="radio" name="quoteType" value="quote"> 📝 단순 발췌
              </label>
            </div>

            <textarea id="inputQuoteText" rows="3" placeholder="책 속의 감명 깊은 문장이나 핵심 정리를 적어보세요... (예: 오일러의 등식 $e^{i\\pi} + 1 = 0$)"></textarea>
            
            <div class="quote-meta-inputs" style="margin-top:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <label style="font-size:0.82rem; font-weight:600;">페이지:</label>
                <input type="number" id="inputQuotePage" placeholder="예: 142" style="width:90px; padding:6px 10px;" />
              </div>
              <input type="text" id="inputQuoteComment" placeholder="나의 한 줄 생각 / 감상 (선택)" style="flex:1; min-width:180px; padding:6px 10px;" />
            </div>

            <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
              <input type="text" id="inputQuoteMyApp" placeholder="✍️ 내 책/원고 적용 메모 (예: 내 책 2장 '신경망 수학' 소제목 3에 인용할 증명)" style="flex:1; padding:6px 10px; background:var(--bg-card);" />
              <button id="btnAddQuote" class="btn btn-primary btn-sm" style="white-space:nowrap;">
                <i data-lucide="plus"></i> 지식 카드 등록
              </button>
            </div>
          </div>

          <!-- Quotes List Grid -->
          <div class="quotes-grid" id="quotesGrid">
            ${quotes.length === 0 ? '<p style="color:var(--text-muted); grid-column:span 3; padding:20px; text-align:center;">아직 기록된 지식 카드가 없습니다. 마음에 와닿은 구절을 남겨보세요!</p>' : ''}
            ${quotes.map(q => this.renderQuoteCard(q)).join('')}
          </div>
        </div>

        <hr class="divider" style="margin:40px 0;" />

        <!-- Part B: Markdown & LaTeX Book Review / Study Note Editor -->
        <div class="review-editor-section">
          <div class="quotes-header-row">
            <h3 style="font-family:var(--font-serif); display:flex; align-items:center; gap:8px;">
              <i data-lucide="file-text" class="text-primary"></i> 심층 서평 & 독서 일지 (Markdown + LaTeX)
            </h3>
            <div style="display:flex; align-items:center; gap:8px;">
              <button id="btnInsertTemplate" class="btn btn-secondary btn-sm" title="4단계 지적 성찰 템플릿(동기-공리-한계-저술적용)을 삽입합니다">
                <i data-lucide="sparkles"></i> ⚡ 지적 성찰 템플릿
              </button>
              <button id="btnSaveReview" class="btn btn-primary btn-sm">
                <i data-lucide="save"></i> 서평 저장
              </button>
            </div>
          </div>

          <!-- LaTeX / Markdown Quick Toolbar -->
          <div class="editor-toolbar">
            <button class="tool-btn" data-insert="**굵게**"><b>B</b></button>
            <button class="tool-btn" data-insert="*기울임*"><i>I</i></button>
            <button class="tool-btn" data-insert="### 소제목\n">H3</button>
            <button class="tool-btn" data-insert="- 항목\n">List</button>
            <button class="tool-btn" data-insert="> 인용문\n">Quote</button>
            <button class="tool-btn" data-insert="$E = mc^2$" title="인라인 수식">📐 $인라인 수식$</button>
            <button class="tool-btn" data-insert="\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\n" title="블록 적분 수식">$$\int 블록 적분$$</button>
            <button class="tool-btn" data-insert="\n$$\\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$\n" title="미분 정의 수식">$$\frac{df}{dx} 미분$$</button>
            <button class="tool-btn" data-insert="\n$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$\n" title="급수 수식">$$\sum 급수$$</button>
          </div>

          <div class="editor-layout">
            <div class="editor-pane">
              <textarea id="reviewTextarea" class="markdown-textarea" placeholder="이 책에서 얻은 지적 통찰과 생각을 마크다운 및 LaTeX 수식으로 자유롭게 기록하세요...">${review}</textarea>
            </div>
            <div class="preview-pane">
              <div class="markdown-preview-box" id="reviewPreview">
                ${MathRenderer.renderMarkdownAndMath(review || '*작성된 서평이 실시간으로 여기에 렌더링됩니다.*')}
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    this.attachEvents();
  }

  getTypeMeta(type) {
    switch(type) {
      case 'proof': return { label: '📐 증명/원리', class: 'badge-type-proof' };
      case 'concept': return { label: '💡 핵심 개념', class: 'badge-type-concept' };
      case 'idea': return { label: '🚀 적용/아이디어', class: 'badge-type-idea' };
      default: return { label: '📝 단순 발췌', class: 'badge-type-quote' };
    }
  }

  renderQuoteCard(quote) {
    const textHtml = MathRenderer.renderMarkdownAndMath(quote.text || '');
    const typeMeta = this.getTypeMeta(quote.type);

    return `
      <div class="quote-card-item" data-quote-id="${quote.id}">
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge-type ${typeMeta.class}">${typeMeta.label}</span>
              <span class="quote-page-tag">${quote.page ? `p. ${quote.page}` : '페이지 미지정'}</span>
            </div>
            <span style="font-size:0.75rem; color:var(--text-dim);">${quote.createdAt || ''}</span>
          </div>
          <div class="quote-text">“${textHtml}”</div>
          ${quote.comment ? `<div class="quote-comment">💭 ${quote.comment}</div>` : ''}
          ${quote.myApplication ? `
            <div class="quote-app-note">
              <strong>✍️ 저술 적용 메모:</strong> ${quote.myApplication}
            </div>
          ` : ''}
        </div>
        <div class="quote-actions" style="margin-top:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
          <div style="display:flex; gap:6px;">
            <button class="btn btn-sm btn-outline btn-copy-quote-md" title="논문/저술용 마크다운 형식으로 복사" data-id="${quote.id}">
              <i data-lucide="clipboard-copy"></i> 마크다운 복사
            </button>
            <button class="btn btn-sm btn-outline btn-quote-card" title="감성 문장 카드 만들기" data-id="${quote.id}">
              <i data-lucide="sparkles"></i> 카드 생성
            </button>
          </div>
          <button class="btn btn-sm btn-icon btn-delete-quote" title="문장 삭제" data-id="${quote.id}">
            <i data-lucide="trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  attachEvents() {
    // Add Quote
    const btnAddQuote = this.container.querySelector('#btnAddQuote');
    const inputQuoteText = this.container.querySelector('#inputQuoteText');
    const inputQuotePage = this.container.querySelector('#inputQuotePage');
    const inputQuoteComment = this.container.querySelector('#inputQuoteComment');
    const inputQuoteMyApp = this.container.querySelector('#inputQuoteMyApp');

    btnAddQuote.addEventListener('click', () => {
      const text = inputQuoteText.value.trim();
      if (!text) {
        alert('인상 깊은 문장이나 수식을 입력해 주세요.');
        return;
      }

      const selectedTypeEl = this.container.querySelector('input[name="quoteType"]:checked');
      const quoteType = selectedTypeEl ? selectedTypeEl.value : 'concept';

      const newQuote = {
        id: `q_${Date.now()}`,
        type: quoteType,
        text,
        page: parseInt(inputQuotePage.value, 10) || 0,
        comment: inputQuoteComment.value.trim(),
        myApplication: inputQuoteMyApp ? inputQuoteMyApp.value.trim() : '',
        createdAt: new Date().toISOString().split('T')[0]
      };

      const quotes = [...(this.book.quotes || [])];
      quotes.unshift(newQuote);
      this.book.quotes = quotes;
      if (this.onSaveQuotes) this.onSaveQuotes(quotes);

      inputQuoteText.value = '';
      inputQuotePage.value = '';
      inputQuoteComment.value = '';
      if (inputQuoteMyApp) inputQuoteMyApp.value = '';

      this.render();
    });

    // Copy Quote as Markdown
    this.container.querySelectorAll('.btn-copy-quote-md').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-id');
        const quote = (this.book.quotes || []).find(q => q.id === qid);
        if (!quote) return;

        const typeMeta = this.getTypeMeta(quote.type);
        const mdText = `> [!QUOTE] ${this.book.title} (p.${quote.page || '미지정'}) - ${this.book.author}\n> [${typeMeta.label}] ${quote.text}\n>\n> **[저술/연구 적용 메모]** ${quote.myApplication || quote.comment || '직접 인용'}\n`;
        
        navigator.clipboard.writeText(mdText).then(() => {
          alert('저술 및 논문 인용용 마크다운이 클립보드에 복사되었습니다!\n\n' + mdText);
        }).catch(() => {
          prompt('아래 마크다운을 복사하세요:', mdText);
        });
      });
    });

    // Delete Quote
    this.container.querySelectorAll('.btn-delete-quote').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-id');
        const quotes = (this.book.quotes || []).filter(q => q.id !== qid);
        this.book.quotes = quotes;
        if (this.onSaveQuotes) this.onSaveQuotes(quotes);
        this.render();
      });
    });

    // Open Quote Card Generator Modal
    this.container.querySelectorAll('.btn-quote-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-id');
        const targetQuote = (this.book.quotes || []).find(q => q.id === qid);
        if (targetQuote && this.onOpenQuoteCard) {
          this.onOpenQuoteCard({ quote: targetQuote, book: this.book });
        }
      });
    });

    // Review Realtime Preview
    const reviewTextarea = this.container.querySelector('#reviewTextarea');
    const reviewPreview = this.container.querySelector('#reviewPreview');
    const btnSaveReview = this.container.querySelector('#btnSaveReview');
    const btnInsertTemplate = this.container.querySelector('#btnInsertTemplate');

    let debounceTimer = null;
    reviewTextarea.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = reviewTextarea.value;
        reviewPreview.innerHTML = MathRenderer.renderMarkdownAndMath(text || '*작성된 내용이 여기에 실시간으로 표시됩니다.*');
        if (this.onSaveReview) this.onSaveReview(text);
      }, 250);
    });

    btnSaveReview.addEventListener('click', () => {
      const text = reviewTextarea.value;
      if (this.onSaveReview) this.onSaveReview(text);
      alert('독서 일지 및 서평이 안전하게 저장되었습니다.');
    });

    // 4-Step Reflection Template Insertion
    if (btnInsertTemplate) {
      btnInsertTemplate.addEventListener('click', () => {
        const template = `\n\n### 1. 지적 계기 및 탐구 동기 (Motivation)\n- 이 책을 읽게 된 학문적 문제의식이나 탐구 과제:\n\n### 2. 핵심 공리 및 모델 (Core Mathematical & Theoretical Models)\n- 저자가 전개하는 핵심 논증 및 수식 체계:\n$$\\text{핵심 수식이나 모델을 정의하세요}$$\n\n### 3. 비판적 논증 및 한계점 (Critical Evaluation & Counter-arguments)\n- 저자의 전제 중 비판할 점이나 실무/학문적 한계:\n\n### 4. 내 연구 및 저술에의 전이 적용 (Application to My Manuscript)\n- 내 책/논문/프로젝트의 특정 챕터에 어떻게 접목할 것인가:\n`;
        
        const currentVal = reviewTextarea.value;
        if (currentVal && !confirm('기존 작성 내용 뒤에 지적 성찰 템플릿을 추가하시겠습니까?')) {
          return;
        }
        reviewTextarea.value = currentVal ? currentVal + template : template.trim();
        reviewTextarea.dispatchEvent(new Event('input'));
        reviewTextarea.focus();
      });
    }

    // Toolbar Insertion
    this.container.querySelectorAll('.tool-btn:not(#btnInsertTemplate)').forEach(btn => {
      btn.addEventListener('click', () => {
        const insertText = btn.getAttribute('data-insert');
        if (!insertText) return;

        const start = reviewTextarea.selectionStart;
        const end = reviewTextarea.selectionEnd;
        const val = reviewTextarea.value;

        reviewTextarea.value = val.substring(0, start) + insertText + val.substring(end);
        reviewTextarea.focus();
        reviewTextarea.selectionStart = start + insertText.length;
        reviewTextarea.selectionEnd = start + insertText.length;

        // Trigger input
        reviewTextarea.dispatchEvent(new Event('input'));
      });
    });
  }
}
