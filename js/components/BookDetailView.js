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
              <!-- Author & Publisher & Translator -->
              <div class="detail-author-pub">
                <span>${book.author}</span>
                ${book.translator ? `<span> · 🌐 옮긴이: ${book.translator}</span>` : ''}
                <span> · 🏛️ ${book.publisher || '출판사 미상'}</span>
              </div>

              <!-- Tags if any -->
              ${Array.isArray(book.tags) && book.tags.length > 0 ? `
                <div style="display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 12px 0;">
                  ${book.tags.map(t => `<span class="badge" style="font-size:0.75rem; background:var(--bg-surface); border:1px solid var(--border-medium); color:var(--text-muted);">#${t}</span>`).join('')}
                </div>
              ` : ''}

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
            <button class="section-tab-btn ${this.activeTab === 'sessions' ? 'active' : ''}" data-section-tab="sessions">
              <i data-lucide="repeat"></i> N회독 이력 (${(book.readingSessions || []).length}회)
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

          <!-- Section 1.5: Reading Sessions (N-th reading) -->
          <div id="sectionSessions" class="section-panel ${this.activeTab === 'sessions' ? 'active' : ''}"></div>

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
        if (tabKey === 'sessions') this.container.querySelector('#sectionSessions').classList.add('active');
        if (tabKey === 'ai_copilot') this.container.querySelector('#sectionAICopilot').classList.add('active');
        if (tabKey === 'toc') this.container.querySelector('#sectionTOC').classList.add('active');
        if (tabKey === 'description') this.container.querySelector('#sectionDescription').classList.add('active');
      });
    });
  }

  renderSubComponents() {
    // 1. Reading Notes View
    const notesContainer = this.container.querySelector('#sectionNotes');
    this.notesView = new ReadingNotesView({
      container: notesContainer,
      book: this.currentBook,
      onSaveQuotes: (newQuotes) => this.triggerUpdate({ quotes: newQuotes }),
      onSaveReview: (newReview) => this.triggerUpdate({ review: newReview }),
      onOpenQuoteCard: this.onOpenQuoteCard
    });
    this.notesView.render();

    // 2. Reading Sessions (N-th reading tracker)
    this.renderSessions();

    // 3. Injected AIService passed to AICopilotView
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
      },
      onSaveToNotes: (noteText) => {
        const newQuote = {
          id: `q_${Date.now()}`,
          text: noteText,
          type: 'idea',
          comment: 'AI 심층 토론에서 도출한 핵심 인사이트',
          createdAt: new Date().toISOString().split('T')[0]
        };
        const quotes = [newQuote, ...(this.currentBook.quotes || [])];
        this.triggerUpdate({ quotes });
        if (this.notesView) this.notesView.render();
      }
    });
    this.aiView.render();

    // 4. Writing Workspace View
    const writingContainer = this.container.querySelector('#sectionWritingWorkspace');
    this.writingWorkspaceView = new WritingWorkspaceView({
      container: writingContainer,
      book: this.currentBook,
      onUpdateDrafts: (newDrafts) => this.triggerUpdate({ writingDrafts: newDrafts })
    });
    this.writingWorkspaceView.render(this.currentBook.writingDrafts || []);
  }

  renderSessions() {
    const sessionsContainer = this.container.querySelector('#sectionSessions');
    if (!sessionsContainer) return;

    const sessions = this.currentBook.readingSessions || [];
    const nextRound = sessions.length + 1;
    const today = new Date().toISOString().split('T')[0];

    sessionsContainer.innerHTML = `
      <div style="max-width:860px; margin:0 auto; padding:10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 style="font-family:var(--font-serif); font-size:1.2rem; color:var(--text-main); display:flex; align-items:center; gap:8px;">
              <i data-lucide="repeat" class="text-primary"></i> N회독 누적 독서 이력 (${sessions.length}회독 기록됨)
            </h3>
            <p style="font-size:0.83rem; color:var(--text-muted); margin-top:4px;">
              고전과 명저는 시간이 지날 때마다 깊이가 달라집니다. 재독서할 때마다 깨달음의 변화를 기록해보세요.
            </p>
          </div>
        </div>

        <!-- Add New Session Card Form -->
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:20px; margin-bottom:24px; box-shadow:var(--shadow-sm);">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:12px; color:var(--accent-primary); display:flex; align-items:center; gap:6px;">
            <i data-lucide="plus-circle"></i> 제 ${nextRound}회독 독서 기록 추가하기
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:12px;">
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">회독 시작일</label>
              <input type="date" id="newSessionStart" value="${today}" style="width:100%; padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-medium); background:var(--bg-surface); color:var(--text-main);" />
            </div>
            <div>
              <label style="font-size:0.78rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">회독 완독일 (선택)</label>
              <input type="date" id="newSessionFinish" style="width:100%; padding:6px 10px; border-radius:var(--radius-sm); border:1px solid var(--border-medium); background:var(--bg-surface); color:var(--text-main);" />
            </div>
          </div>
          <div style="margin-bottom:12px;">
            <label style="font-size:0.78rem; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">이번 ${nextRound}회독에서의 새로운 통찰 / 시각의 변화</label>
            <textarea id="newSessionNote" rows="3" placeholder="예: 3년 전 처음 읽었을 때는 개념만 훑었는데, 이번에 다시 읽으니 저자의 5장 논증이 현실 문제와 정확히 맞닿아 있음을 깨달았다..." style="width:100%; padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border-medium); background:var(--bg-surface); color:var(--text-main); font-size:0.88rem; line-height:1.6;"></textarea>
          </div>
          <button id="btnSaveNewSession" class="btn btn-primary btn-sm" style="font-weight:700;">
            <i data-lucide="check"></i> 제 ${nextRound}회독 이력 저장
          </button>
        </div>

        <!-- Sessions Timeline List -->
        <div class="sessions-timeline-wrap">
          ${sessions.length === 0 ? '<p style="text-align:center; color:var(--text-muted); padding:30px;">아직 기록된 회독 이력이 없습니다. 위의 폼에서 첫 회독을 기록해보세요!</p>' : ''}
          ${[...sessions].reverse().map((s, idx) => `
            <div class="session-card">
              <div class="session-round-badge">
                <span style="font-size:0.7rem; font-weight:600; text-transform:uppercase;">ROUND</span>
                <span>${s.round || (sessions.length - idx)}</span>
              </div>
              <div class="session-content">
                <div class="session-dates">
                  📅 ${s.startDate || '시작일 미지정'} ~ ${s.finishDate ? s.finishDate : '📖 현재 다시 읽는 중'}
                </div>
                <div class="session-note">
                  ${escapeHtml(s.note || '별도 메모 없이 완독함')}
                </div>
              </div>
              <button class="btn btn-icon btn-xs btn-delete-session" data-idx="${sessions.length - 1 - idx}" title="이 회독 기록 삭제" style="align-self:flex-start; opacity:0.6;">
                <i data-lucide="trash"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Attach Session Events
    const btnSave = sessionsContainer.querySelector('#btnSaveNewSession');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const start = sessionsContainer.querySelector('#newSessionStart').value;
        const finish = sessionsContainer.querySelector('#newSessionFinish').value;
        const note = sessionsContainer.querySelector('#newSessionNote').value.trim();

        const newSession = {
          round: nextRound,
          startDate: start,
          finishDate: finish,
          note: note || `${nextRound}회독 완료`
        };

        const updatedSessions = [...(this.currentBook.readingSessions || []), newSession];
        this.triggerUpdate({ readingSessions: updatedSessions });
        this.renderSessions();
      });
    }

    sessionsContainer.querySelectorAll('.btn-delete-session').forEach(btn => {
      btn.addEventListener('click', () => {
        const delIdx = parseInt(btn.getAttribute('data-idx'), 10);
        const updated = (this.currentBook.readingSessions || []).filter((_, i) => i !== delIdx);
        this.triggerUpdate({ readingSessions: updated });
        this.renderSessions();
      });
    });
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
