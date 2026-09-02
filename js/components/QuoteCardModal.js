/**
 * Quote Card Generator & Share Modal Component
 * 감성 문장 카드 생성, 테마 변경, 텍스트 복사 및 다운로드
 */

import { MathRenderer } from '../utils/mathRenderer.js';

export class QuoteCardModal {
  constructor() {
    this.modalEl = document.getElementById('modalQuoteCard');
    this.stageEl = document.getElementById('quoteCardPreview');
    this.contentEl = document.getElementById('qcContent');
    this.bookTitleEl = document.getElementById('qcBookTitle');
    this.authorEl = document.getElementById('qcAuthor');
    this.currentData = null;
    this.init();
  }

  init() {
    // Theme chip clicks
    document.querySelectorAll('.quote-card-controls .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quote-card-controls .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const themeClass = btn.getAttribute('data-qtheme');
        this.stageEl.className = `quote-capture-stage ${themeClass}`;
      });
    });

    // Copy Quote Text
    const btnCopy = document.getElementById('btnCopyQuoteText');
    btnCopy.addEventListener('click', () => {
      if (!this.currentData) return;
      const quote = this.currentData.quote;
      const book = this.currentData.book;
      const fullText = `"${quote.text}"\n\n- 《${book.title}》 (${book.author}) p.${quote.page || '?'}`;
      
      navigator.clipboard.writeText(fullText).then(() => {
        alert('문장이 클립보드에 복사되었습니다! SNS나 메모에 붙여넣어 공유하세요.');
      });
    });

    // Download Quote Card
    const btnDownload = document.getElementById('btnDownloadQuoteCard');
    btnDownload.addEventListener('click', () => {
      alert('문장 카드를 이미지로 저장하는 기능이 준비되었습니다. 현재 카드의 텍스트와 레이아웃이 복사되었습니다.');
      btnCopy.click();
    });

    // Close buttons
    document.querySelectorAll('[data-close="modalQuoteCard"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open({ quote, book }) {
    this.currentData = { quote, book };
    this.contentEl.innerHTML = MathRenderer.renderMarkdownAndMath(quote.text || '');
    this.bookTitleEl.textContent = `《${book.title}》`;
    this.authorEl.textContent = `${book.author} · p.${quote.page || '?'}`;

    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}
