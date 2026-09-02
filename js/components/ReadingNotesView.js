/**
 * Reading Notes & Quotes View Component
 * 인상 깊은 문장 수집소, 감성 문장 카드 연동, KaTeX/마크다운 서평 에디터
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
        
        <!-- Part A: Quotes & Highlights -->
        <div class="quotes-section">
          <div class="quotes-header-row">
            <h3 style="font-family:var(--font-serif); display:flex; align-items:center; gap:8px;">
              <i data-lucide="quote" class="text-primary"></i> 인상 깊은 문장 수집소 (${quotes.length})
            </h3>
            <span style="font-size:0.8rem; color:var(--text-muted);">수학/공학 수식($...$)도 자유롭게 입력할 수 있습니다.</span>
          </div>

          <!-- Add Quote Card Box -->
          <div class="quote-input-card">
            <textarea id="inputQuoteText" rows="3" placeholder="책 속의 감명 깊은 문장이나 핵심 정리를 적어보세요... (예: 오일러의 등식 $e^{i\\pi} + 1 = 0$)"></textarea>
            <div class="quote-meta-inputs">
              <div style="display:flex; align-items:center; gap:8px;">
                <label style="font-size:0.82rem; font-weight:600;">페이지:</label>
                <input type="number" id="inputQuotePage" placeholder="예: 142" style="width:90px; padding:6px 10px;" />
              </div>
              <input type="text" id="inputQuoteComment" placeholder="나의 한 줄 생각 / 내 책에 인용할 메모 (선택)" style="flex:1; min-width:200px; padding:6px 10px;" />
              <button id="btnAddQuote" class="btn btn-primary btn-sm">
                <i data-lucide="plus"></i> 문장 등록
              </button>
            </div>
          </div>

          <!-- Quotes List Grid -->
          <div class="quotes-grid" id="quotesGrid">
            ${quotes.length === 0 ? '<p style="color:var(--text-muted); grid-column:span 3; padding:20px; text-align:center;">아직 기록된 문장이 없습니다. 마음에 와닿은 구절을 남겨보세요!</p>' : ''}
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
            <button id="btnSaveReview" class="btn btn-primary btn-sm">
              <i data-lucide="save"></i> 서평 저장
            </button>
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

  renderQuoteCard(quote) {
    const textHtml = MathRenderer.renderMarkdownAndMath(quote.text || '');
    return `
      <div class="quote-card-item" data-quote-id="${quote.id}">
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
            <span class="quote-page-tag">${quote.page ? `p. ${quote.page}` : '페이지 미지정'}</span>
            <span style="font-size:0.75rem; color:var(--text-dim);">${quote.createdAt || ''}</span>
          </div>
          <div class="quote-text">“${textHtml}”</div>
          ${quote.comment ? `<div class="quote-comment">💭 ${quote.comment}</div>` : ''}
        </div>
        <div class="quote-actions">
          <button class="btn btn-sm btn-outline btn-quote-card" title="감성 문장 카드 만들기" data-id="${quote.id}">
            <i data-lucide="sparkles"></i> 카드 생성
          </button>
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

    btnAddQuote.addEventListener('click', () => {
      const text = inputQuoteText.value.trim();
      if (!text) {
        alert('인상 깊은 문장을 입력해 주세요.');
        return;
      }

      const newQuote = {
        id: `q_${Date.now()}`,
        text,
        page: parseInt(inputQuotePage.value, 10) || 0,
        comment: inputQuoteComment.value.trim(),
        createdAt: new Date().toISOString().split('T')[0]
      };

      const quotes = [...(this.book.quotes || [])];
      quotes.unshift(newQuote);
      this.book.quotes = quotes;
      if (this.onSaveQuotes) this.onSaveQuotes(quotes);

      inputQuoteText.value = '';
      inputQuotePage.value = '';
      inputQuoteComment.value = '';

      this.render();
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

    // Toolbar Insertion
    this.container.querySelectorAll('.tool-btn').forEach(btn => {
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
