/**
 * Stats Dashboard Modal Component (Refactored - DIP)
 * 리포지토리를 주입받아 통계 지표 및 차트 렌더링
 */

export class StatsModal {
  /**
   * @param {Object} params
   * @param {import('../repositories/IBookRepository.js').IBookRepository} params.bookRepo
   * @param {import('../repositories/SettingsRepository.js').SettingsRepository} params.settingsRepo
   */
  constructor({ bookRepo, settingsRepo }) {
    this.modalEl = document.getElementById('modalStats');
    this.bodyEl = document.getElementById('statsModalBody');
    this.bookRepo = bookRepo;
    this.settingsRepo = settingsRepo;
    this.init();
  }

  init() {
    document.querySelectorAll('[data-close="modalStats"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open() {
    this.render();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  render() {
    const books = this.bookRepo.getAll();
    const settings = this.settingsRepo.getSettings();
    const yearlyGoal = settings.yearlyGoal || 30;

    const totalBooks = books.length;
    const completedBooks = books.filter(b => b.status === 'completed').length;
    const totalPagesRead = books.reduce((acc, b) => acc + (b.currentPage || 0), 0);
    const totalQuotes = books.reduce((acc, b) => acc + ((b.quotes || []).length), 0);
    const totalDrafts = books.reduce((acc, b) => acc + ((b.writingDrafts || []).length), 0);

    const goalPercent = Math.min(100, Math.round((completedBooks / yearlyGoal) * 100));

    const catCounts = {};
    books.forEach(b => {
      const c = b.category || '기타';
      catCounts[c] = (catCounts[c] || 0) + 1;
    });

    this.bodyEl.innerHTML = `
      <div class="stats-dashboard-wrap" style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- Top Stats Cards -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:16px;">
          <div class="meta-item" style="background:var(--bg-sidebar); padding:16px; border-radius:var(--radius-md); text-align:center;">
            <span class="meta-label">총 소장 도서</span>
            <span style="font-size:1.6rem; font-weight:800; font-family:var(--font-mono); color:var(--text-main);">${totalBooks}권</span>
          </div>
          <div class="meta-item" style="background:var(--bg-sidebar); padding:16px; border-radius:var(--radius-md); text-align:center;">
            <span class="meta-label">완독 도서</span>
            <span style="font-size:1.6rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-success);">${completedBooks}권</span>
          </div>
          <div class="meta-item" style="background:var(--bg-sidebar); padding:16px; border-radius:var(--radius-md); text-align:center;">
            <span class="meta-label">누적 독서 페이지</span>
            <span style="font-size:1.6rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-secondary);">${totalPagesRead.toLocaleString()}p</span>
          </div>
          <div class="meta-item" style="background:var(--bg-sidebar); padding:16px; border-radius:var(--radius-md); text-align:center;">
            <span class="meta-label">수집된 명문장 & 저술자료</span>
            <span style="font-size:1.6rem; font-weight:800; font-family:var(--font-mono); color:var(--accent-primary);">${totalQuotes + totalDrafts}개</span>
          </div>
        </div>

        <!-- Yearly Goal Progress Bar -->
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:700; font-size:0.95rem;">🎯 올해 독서 목표 달성 현황</span>
            <span style="font-family:var(--font-mono); font-weight:800; color:var(--accent-primary);">${completedBooks} / ${yearlyGoal}권 (${goalPercent}%)</span>
          </div>
          <div class="progress-bar-track" style="height:12px;">
            <div class="progress-bar-fill" style="width:${goalPercent}%;"></div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div style="background:var(--bg-sidebar); border-radius:var(--radius-md); padding:20px;">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:14px;">📚 분야별 독서 분포</h4>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${Object.entries(catCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalBooks) * 100);
              return `
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:4px;">
                    <span style="font-weight:600;">${cat}</span>
                    <span>${count}권 (${pct}%)</span>
                  </div>
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill" style="width:${pct}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
}
