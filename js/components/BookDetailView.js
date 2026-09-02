/**
 * Book Detail View Component (Refactored - DIP)
 * 도서 상세 정보, 독서 진행률, 탭 네비게이션 및 하단 저술 참고자료함 총괄 렌더러
 */

import { MathRenderer } from '../utils/mathRenderer.js';
import { ReadingNotesView } from './ReadingNotesView.js';
import { AICopilotView } from './AICopilotView.js';
import { WritingWorkspaceView } from './WritingWorkspaceView.js';

export class BookDetailView {
  constructor({ container, onBackClick, onUpdateBook, onDeleteBook, onOpenQuoteCard, aiService }) {
    this.container = container;
    this.onBackClick = onBackClick;
    this.onUpdateBook = onUpdateBook;
    this.onDeleteBook = onDeleteBook;
    this.onOpenQuoteCard = onOpenQuoteCard;
    this.aiService = aiService; // Injected AIService (DIP)
    this.currentBook = null;
    this.activeTab = 'notes';
  }

  render(book) {
    this.currentBook = book;
    if (!book) return;

    const progress = book.totalPages ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
    const coverHtml = book.cover ? `
      <img src="${book.cover}" alt="${book.title}" class="detail-cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="card-cover-fallback" style="display:none; height:360px; border-radius:var(--radius-md); background: linear-gradient(135deg, ${book.spineColor || '#2c3e50'}, #1e293b);">
        <div class="fallback-title">${book.title}</div>
        <div class="fallback-author">${book.author}</div>
      </div>
    ` : `
      <div class="card-cover-fallback" style="height:360px; border-radius:var(--radius-md); background: linear-gradient(135deg, ${book.spineColor || '#2c3e50'}, #1e293b);">
        <div class="fallback-title">${book.title}</div>
        <div class="fallback-author">${book.author}</div>
      </div>
    `;

    const yes24Link = book.link || (book.isbn ? `https://www.yes24.com/Product/Search?domain=BOOK&query=${book.isbn}` : '');

    this.container.innerHTML = `
      <div class="book-detail-wrapper fade-in">
        
        <!-- Navigation Top Bar -->
        <div class="detail-nav-bar">
          <button id="btnBackToShelf" class="btn btn-outline">
            <i data-lucide="arrow-left"></i> 내 서재로 돌아가기
          </button>

          <div class="header-actions">
            <button id="btnDeleteBook" class="btn btn-danger-outline" title="서재에서 삭제">
              <i data-lucide="trash-2"></i> 삭제
            </button>
          </div>
        </div>

        <!-- Hero Overview Card -->
        <div class="detail-hero-card">
          <!-- Left Col: Cover & YES24 Link -->
          <div class="detail-cover-col">
            ${coverHtml}
            ${yes24Link ? `
              <a href="${yes24Link}" target="_blank" rel="noopener" class="yes24-link-badge">
                <i data-lucide="external-link"></i> YES24 공식 도서 정보 보기
              </a>
            ` : ''}
          </div>

          <!-- Right Col: Metadata & Progress Tracking -->
          <div class="detail-info-col">
            <div>
              <span class="detail-category-badge">${book.category || '기타'}</span>
              <h2 class="detail-title">${book.title}</h2>
              <div class="detail-author-pub">${book.author} · ${book.publisher || '출판사 미상'}</div>

              <!-- Metadata Grid -->
              <div class="detail-meta-grid">
                <div class="meta-item">
                  <span class="meta-label">ISBN-13</span>
                  <span class="meta-val" style="font-family:var(--font-mono);">${book.isbn || '미등록'}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">독서 상태</span>
                  <select id="detailStatusSelect" class="select-input" style="padding:4px 8px; font-size:0.85rem;">
                    <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>📖 읽고 있는 책</option>
                    <option value="completed" ${book.status === 'completed' ? 'selected' : ''}>✅ 완독한 책</option>
                    <option value="wishlist" ${book.status === 'wishlist' ? 'selected' : ''}>📌 읽고 싶은 책</option>
                    <option value="paused" ${book.status === 'paused' ? 'selected' : ''}>⏸️ 잠시 멈춤</option>
                  </select>
                </div>
                <div class="meta-item">
                  <span class="meta-label">별점 평가</span>
                  <div class="star-rating-widget" id="starRatingWidget">
                    ${[1, 2, 3, 4, 5].map(star => `
                      <i data-lucide="star" class="${(book.rating || 0) >= star ? 'active' : ''}" data-star="${star}"></i>
                    `).join('')}
                    <span style="font-weight:700; margin-left:6px; font-size:0.9rem;" id="ratingText">${book.rating || 0}점</span>
                  </div>
                </div>
                <div class="meta-item">
                  <span class="meta-label">독서 기간</span>
                  <div style="font-size:0.82rem; display:flex; gap:4px; align-items:center;">
                    <input type="date" id="inputStartDate" value="${book.startDate || ''}" style="padding:2px; font-size:0.75rem;" />
                    ~
                    <input type="date" id="inputFinishDate" value="${book.finishDate || ''}" style="padding:2px; font-size:0.75rem;" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Reading Progress Controller -->
            <div class="detail-progress-control">
              <div class="progress-header">
                <span style="font-weight:700; font-size:0.95rem; display:flex; align-items:center; gap:6px;">
                  <i data-lucide="bookmark-check" class="text-primary"></i> 독서 진도율 (Reading Progress)
                </span>
                <span class="progress-percentage" id="progressPercentageText">${progress}%</span>
              </div>
              <div class="progress-input-row">
                <input type="range" id="sliderCurrentPage" class="progress-slider" min="0" max="${book.totalPages || 500}" value="${book.currentPage || 0}" />
                <div style="display:flex; align-items:center; gap:4px;">
                  <input type="number" id="inputCurrentPage" class="page-input-box" min="0" max="${book.totalPages || 500}" value="${book.currentPage || 0}" />
                  <span>/</span>
                  <input type="number" id="inputTotalPages" class="page-input-box" min="1" value="${book.totalPages || 500}" />
                  <span>p</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Sub-Sections (Tabs) -->
        <div class="detail-sections-container">
          <div class="section-tabs-bar">
            <button class="section-tab-btn ${this.activeTab === 'notes' ? 'active' : ''}" data-section-tab="notes">
              <i data-lucide="highlighter"></i> 인상 깊은 문장 & 독서 일지
            </button>
            <button class="section-tab-btn ${this.activeTab === 'ai_copilot' ? 'active' : ''}" data-section-tab="ai_copilot">
              <i data-lucide="bot"></i> AI 심층 독서 토론 & 코파일럿
            </button>
            <button class="section-tab-btn ${this.activeTab === 'toc' ? 'active' : ''}" data-section-tab="toc">
              <i data-lucide="list-ordered"></i> 목차 (TOC)
            </button>
            <button class="section-tab-btn ${this.activeTab === 'description' ? 'active' : ''}" data-section-tab="description">
              <i data-lucide="info"></i> 책 소개
            </button>
          </div>

          <!-- Section 1: Notes & Quotes -->
          <div id="sectionNotes" class="section-panel ${this.activeTab === 'notes' ? 'active' : ''}"></div>

          <!-- Section 2: AI Copilot Chat -->
          <div id="sectionAICopilot" class="section-panel ${this.activeTab === 'ai_copilot' ? 'active' : ''}"></div>

          <!-- Section 3: TOC -->
          <div id="sectionTOC" class="section-panel ${this.activeTab === 'toc' ? 'active' : ''}">
            <div style="line-height:1.8; font-family:var(--font-sans); white-space:pre-wrap;">${book.toc ? MathRenderer.renderMarkdownAndMath(book.toc) : '<p style="color:var(--text-muted);">등록된 목차 정보가 없습니다.</p>'}</div>
          </div>

          <!-- Section 4: Description -->
          <div id="sectionDescription" class="section-panel ${this.activeTab === 'description' ? 'active' : ''}">
            <div style="line-height:1.8; font-size:0.95rem;">${book.description ? MathRenderer.renderMarkdownAndMath(book.description) : '<p style="color:var(--text-muted);">등록된 도서 소개가 없습니다.</p>'}</div>
          </div>
        </div>

        <!-- Bottom Feature: Author's Research & Writing Workspace -->
        <div id="sectionWritingWorkspace" class="writing-workspace-section"></div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    this.attachHeaderEvents();
    this.renderSubComponents();
  }

  attachHeaderEvents() {
    this.container.querySelector('#btnBackToShelf').addEventListener('click', () => {
      if (this.onBackClick) this.onBackClick();
    });

    this.container.querySelector('#btnDeleteBook').addEventListener('click', () => {
      if (confirm(`'${this.currentBook.title}' 도서를 서재에서 삭제하시겠습니까?`)) {
        if (this.onDeleteBook) this.onDeleteBook(this.currentBook.id);
      }
    });

    const statusSelect = this.container.querySelector('#detailStatusSelect');
    statusSelect.addEventListener('change', (e) => {
      const newStatus = e.target.value;
      const updates = { status: newStatus };
      if (newStatus === 'completed' && !this.currentBook.finishDate) {
        updates.finishDate = new Date().toISOString().split('T')[0];
        updates.currentPage = this.currentBook.totalPages;
      }
      this.triggerUpdate(updates);
    });

    const stars = this.container.querySelectorAll('#starRatingWidget i');
    stars.forEach(starEl => {
      starEl.addEventListener('click', () => {
        const starVal = parseFloat(starEl.getAttribute('data-star'));
        this.triggerUpdate({ rating: starVal });
      });
    });

    const startDate = this.container.querySelector('#inputStartDate');
    const finishDate = this.container.querySelector('#inputFinishDate');
    startDate.addEventListener('change', (e) => this.triggerUpdate({ startDate: e.target.value }));
    finishDate.addEventListener('change', (e) => this.triggerUpdate({ finishDate: e.target.value }));

    const slider = this.container.querySelector('#sliderCurrentPage');
    const inputCurr = this.container.querySelector('#inputCurrentPage');
    const inputTot = this.container.querySelector('#inputTotalPages');

    const updateProgress = (curr, tot) => {
      const c = Math.max(0, Math.min(tot, parseInt(curr, 10) || 0));
      const t = Math.max(1, parseInt(tot, 10) || 100);
      slider.max = t;
      inputCurr.max = t;
      slider.value = c;
      inputCurr.value = c;
      inputTot.value = t;

      const pct = Math.min(100, Math.round((c / t) * 100));
      this.container.querySelector('#progressPercentageText').textContent = `${pct}%`;

      const updates = { currentPage: c, totalPages: t };
      if (c >= t && this.currentBook.status === 'reading') {
        updates.status = 'completed';
        updates.finishDate = updates.finishDate || new Date().toISOString().split('T')[0];
      }
      this.triggerUpdate(updates);
    };

    slider.addEventListener('input', (e) => updateProgress(e.target.value, inputTot.value));
    inputCurr.addEventListener('change', (e) => updateProgress(e.target.value, inputTot.value));
    inputTot.addEventListener('change', (e) => updateProgress(inputCurr.value, e.target.value));

    const tabBtns = this.container.querySelectorAll('.section-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabKey = btn.getAttribute('data-section-tab');
        this.activeTab = tabKey;

        this.container.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
        if (tabKey === 'notes') this.container.querySelector('#sectionNotes').classList.add('active');
        if (tabKey === 'ai_copilot') this.container.querySelector('#sectionAICopilot').classList.add('active');
        if (tabKey === 'toc') this.container.querySelector('#sectionTOC').classList.add('active');
        if (tabKey === 'description') this.container.querySelector('#sectionDescription').classList.add('active');
      });
    });
  }

  renderSubComponents() {
    const notesContainer = this.container.querySelector('#sectionNotes');
    this.notesView = new ReadingNotesView({
      container: notesContainer,
      book: this.currentBook,
      onSaveQuotes: (newQuotes) => this.triggerUpdate({ quotes: newQuotes }),
      onSaveReview: (newReview) => this.triggerUpdate({ review: newReview }),
      onOpenQuoteCard: this.onOpenQuoteCard
    });
    this.notesView.render();

    // Injected AIService passed to AICopilotView
    const aiContainer = this.container.querySelector('#sectionAICopilot');
    this.aiView = new AICopilotView({
      container: aiContainer,
      book: this.currentBook,
      aiService: this.aiService,
      onSaveToWritingDrafts: (draftItem) => {
        const drafts = [...(this.currentBook.writingDrafts || [])];
        drafts.unshift(draftItem);
        this.triggerUpdate({ writingDrafts: drafts });
        if (this.writingWorkspaceView) {
          this.writingWorkspaceView.render(drafts);
        }
      }
    });
    this.aiView.render();

    const writingContainer = this.container.querySelector('#sectionWritingWorkspace');
    this.writingWorkspaceView = new WritingWorkspaceView({
      container: writingContainer,
      book: this.currentBook,
      onUpdateDrafts: (newDrafts) => this.triggerUpdate({ writingDrafts: newDrafts })
    });
    this.writingWorkspaceView.render(this.currentBook.writingDrafts || []);
  }

  triggerUpdate(updates) {
    if (this.onUpdateBook && this.currentBook) {
      const updated = this.onUpdateBook(this.currentBook.id, updates);
      if (updated) {
        this.currentBook = updated;
      }
    }
  }
}
