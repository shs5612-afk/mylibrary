/**
 * Book Search & Add Modal Component
 * YES24.com 실시간 검색 및 ISBN 조회, 직접 등록 폼 제어
 */

import { Yes24Fetcher } from '../utils/yes24Fetcher.js';

export class BookSearchModal {
  constructor({ onBookAdded }) {
    this.modalEl = document.getElementById('modalAddBook');
    this.onBookAdded = onBookAdded;
    this.init();
  }

  init() {
    // Tab switching inside modal
    const tabYes24 = document.getElementById('tabYes24Search');
    const tabManual = document.getElementById('tabManualAdd');
    const panelYes24 = document.getElementById('yes24SearchPanel');
    const panelManual = document.getElementById('manualAddPanel');

    tabYes24.addEventListener('click', () => {
      tabYes24.classList.add('active');
      tabManual.classList.remove('active');
      panelYes24.classList.remove('hidden');
      panelManual.classList.add('hidden');
    });

    tabManual.addEventListener('click', () => {
      tabManual.classList.add('active');
      tabYes24.classList.remove('active');
      panelManual.classList.remove('hidden');
      panelYes24.classList.add('hidden');
    });

    // YES24 Search Execution
    const btnSearch = document.getElementById('btnExecuteYes24Search');
    const inputQuery = document.getElementById('yes24QueryInput');

    const doSearch = async (forcedQuery = null) => {
      const q = (forcedQuery || inputQuery.value).trim();
      if (!q) {
        alert('도서명, 저자, 또는 ISBN-13을 입력해 주세요.');
        return;
      }

      if (forcedQuery) {
        inputQuery.value = forcedQuery;
      }

      const resultsContainer = document.getElementById('yes24ResultsContainer');
      resultsContainer.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
          <div style="font-size:1.8rem; margin-bottom:12px; animation:spin 1s linear infinite; display:inline-block;">⏳</div>
          <div style="font-weight:600; font-size:1rem; color:var(--text-main); margin-bottom:6px;">'${escapeHtml(q)}' 도서 정보를 다각도로 검색하는 중입니다...</div>
          <div style="font-size:0.85rem;">YES24 공식 도서 및 ISBN 데이터베이스와 연동 중</div>
        </div>
      `;

      try {
        const books = await Yes24Fetcher.search(q);
        this.renderSearchResults(books, q);
      } catch (e) {
        resultsContainer.innerHTML = `
          <div style="text-align:center; padding:30px; color:var(--accent-danger);">
            <i data-lucide="alert-triangle"></i>
            <p style="margin-top:8px;">검색 중 오류가 발생했습니다: ${escapeHtml(e.message)}</p>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();
      }
    };

    btnSearch.addEventListener('click', () => doSearch());
    inputQuery.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });

    // Attach initial suggestion chips
    this.attachSuggestHandlers(document);

    // Manual Form Submit
    const formManual = document.getElementById('formManualBook');
    formManual.addEventListener('submit', (e) => {
      e.preventDefault();

      const newBook = {
        title: document.getElementById('mTitle').value.trim(),
        author: document.getElementById('mAuthor').value.trim(),
        publisher: document.getElementById('mPublisher').value.trim(),
        isbn: document.getElementById('mIsbn').value.trim(),
        category: document.getElementById('mCategory').value,
        totalPages: parseInt(document.getElementById('mTotalPages').value, 10) || 300,
        currentPage: 0,
        status: document.getElementById('mStatus').value,
        cover: document.getElementById('mCoverUrl').value.trim(),
        spineColor: document.getElementById('mSpineColor').value,
        toc: document.getElementById('mTableOfContents').value.trim(),
        description: document.getElementById('mDescription').value.trim(),
        link: document.getElementById('mIsbn').value.trim() ? `https://www.yes24.com/Product/Search?domain=BOOK&query=${document.getElementById('mIsbn').value.trim()}` : ''
      };

      if (this.onBookAdded) {
        this.onBookAdded(newBook);
      }

      formManual.reset();
      this.close();
    });

    // Close buttons
    document.querySelectorAll('[data-close="modalAddBook"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  renderSearchResults(books, query) {
    const resultsContainer = document.getElementById('yes24ResultsContainer');

    if (!books || books.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-results-placeholder" style="text-align:center; padding:35px 20px;">
          <div style="font-size:2rem; margin-bottom:10px;">🔍</div>
          <div style="font-weight:700; font-size:1rem; margin-bottom:6px;">검색 결과가 없습니다.</div>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
            도서명이나 키워드를 조금 더 짧게 입력하시거나, 직접 입력 탭에서 등록해 보세요.
          </p>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px;">
            <span style="font-size:0.8rem; color:var(--text-muted); align-self:center;">추천 검색어:</span>
            <button class="badge-chip btn-suggest-query" data-q="미적분학">미적분학</button>
            <button class="badge-chip btn-suggest-query" data-q="코스모스">코스모스</button>
            <button class="badge-chip btn-suggest-query" data-q="클린코드">클린코드</button>
            <button class="badge-chip btn-suggest-query" data-q="선형대수">선형대수</button>
            <button class="badge-chip btn-suggest-query" data-q="사피엔스">사피엔스</button>
          </div>
        </div>
      `;
      this.attachSuggestHandlers(resultsContainer);
      return;
    }

    const countHeader = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border-light);">
        <span style="font-weight:700; font-size:0.92rem; color:var(--text-main);">
          🔍 '${escapeHtml(query)}' 검색 결과 <span style="color:var(--accent-primary); font-weight:800;">(${books.length}권)</span>
        </span>
        <span style="font-size:0.8rem; color:var(--text-muted);">원하시는 도서의 [서재에 추가]를 클릭하세요</span>
      </div>
    `;

    const itemsHtml = books.map((b, idx) => `
      <div class="yes24-result-item" data-idx="${idx}">
        <div class="yes24-thumb-wrap">
          ${b.cover ? `<img src="${b.cover}" class="yes24-thumb" alt="${escapeHtml(b.title)}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&auto=format&fit=crop&q=80';" />` : `<div class="yes24-thumb-placeholder" style="background:${b.spineColor || '#2c3e50'};">📚</div>`}
        </div>
        <div class="yes24-item-info">
          <div class="yes24-item-title">${escapeHtml(b.title)}</div>
          <div class="yes24-item-meta">
            <span>✍️ ${escapeHtml(b.author)}</span>
            ${b.publisher ? `<span> · 🏛️ ${escapeHtml(b.publisher)}</span>` : ''}
            ${b.pubDate ? `<span> (${escapeHtml(b.pubDate)})</span>` : ''}
          </div>
          <div class="yes24-item-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
            <span class="badge badge-category" style="font-size:0.75rem; padding:2px 8px; border-radius:4px; background:var(--bg-accent-light); color:var(--accent-primary);">${escapeHtml(b.category || '일반')}</span>
            ${b.totalPages ? `<span class="badge" style="font-size:0.75rem; padding:2px 8px; border-radius:4px; background:var(--bg-surface); border:1px solid var(--border-light); color:var(--text-muted);">${b.totalPages}쪽</span>` : ''}
            ${b.isbn ? `<span class="badge" style="font-size:0.75rem; padding:2px 8px; border-radius:4px; background:var(--bg-surface); border:1px solid var(--border-light); font-family:var(--font-mono); color:var(--text-muted);">ISBN: ${escapeHtml(b.isbn)}</span>` : ''}
            ${b.price ? `<span class="badge" style="font-size:0.75rem; padding:2px 8px; border-radius:4px; color:var(--accent-primary); font-weight:700;">${escapeHtml(b.price)}</span>` : ''}
          </div>
          ${b.description ? `<div style="font-size:0.78rem; color:var(--text-muted); margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(b.description)}</div>` : ''}
        </div>
        <div class="yes24-item-actions" style="display:flex; flex-direction:column; gap:6px; align-self:center;">
          <button class="btn btn-primary btn-sm btn-select-yes24" data-idx="${idx}" style="white-space:nowrap; padding:8px 14px; font-weight:700;">
            <i data-lucide="plus"></i> 서재에 추가
          </button>
          ${b.link ? `<a href="${b.link}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-xs" style="text-align:center; font-size:0.75rem; color:var(--text-muted); text-decoration:none;">
            YES24 링크 ↗
          </a>` : ''}
        </div>
      </div>
    `).join('');

    resultsContainer.innerHTML = countHeader + `<div class="yes24-results-list" style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto; padding-right:4px;">` + itemsHtml + `</div>`;

    if (window.lucide) window.lucide.createIcons();

    // Attach Select Events
    resultsContainer.querySelectorAll('.btn-select-yes24').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const selected = { ...books[idx] };
        if (!selected) return;

        btn.disabled = true;
        btn.innerHTML = `<span>⏳ 목차 연동 중...</span>`;

        // If goodsNo exists, fetch detailed TOC & Description from YES24
        if (selected.goodsNo && (!selected.toc || !selected.description)) {
          try {
            const detailRes = await fetch(`/api/yes24?goodsNo=${encodeURIComponent(selected.goodsNo)}`);
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData.success) {
                if (detailData.toc) selected.toc = detailData.toc;
                if (detailData.description && !selected.description) selected.description = detailData.description;
              }
            }
          } catch (err) {
            console.warn('Auto TOC fetch failed, proceeding with basic info:', err);
          }
        }

        if (this.onBookAdded) {
          this.onBookAdded(selected);
          this.close();
        }
      });
    });
  }

  attachSuggestHandlers(container) {
    container.querySelectorAll('.btn-suggest-query').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-q');
        const input = document.getElementById('yes24QueryInput');
        if (input) input.value = q;
        document.getElementById('btnExecuteYes24Search').click();
      });
    });
  }

  open() {
    this.modalEl.classList.remove('hidden');
    const input = document.getElementById('yes24QueryInput');
    if (input) {
      input.focus();
      input.select();
    }
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
