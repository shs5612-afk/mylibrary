/**
 * Gallery Card Grid Strategy Renderer
 * 갤러리 카드 뷰 렌더러
 */

import { BaseShelfRenderer } from './BaseShelfRenderer.js';

export class ShelfRendererGrid extends BaseShelfRenderer {
  render(books) {
    let html = '<div class="shelf-grid-view">';
    books.forEach(b => {
      const progress = b.totalPages ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100)) : 0;
      const statusClass = b.status || 'reading';
      const statusLabel = {
        reading: '📖 읽는 중',
        completed: '✅ 완독',
        wishlist: '📌 위시',
        paused: '⏸️ 멈춤'
      }[b.status] || '기록 중';

      const coverHtml = b.cover ? `
        <img src="${b.cover}" alt="${b.title}" class="card-cover-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="card-cover-fallback" style="display:none; background: linear-gradient(135deg, ${b.spineColor || '#2c3e50'}, #1e293b);">
          <div class="fallback-title">${b.title}</div>
          <div class="fallback-author">${b.author}</div>
        </div>
      ` : `
        <div class="card-cover-fallback" style="background: linear-gradient(135deg, ${b.spineColor || '#2c3e50'}, #1e293b);">
          <div class="fallback-title">${b.title}</div>
          <div class="fallback-author">${b.author}</div>
        </div>
      `;

      html += `
        <div class="book-card" data-id="${b.id}">
          <div class="card-cover-wrap">
            ${coverHtml}
            <span class="card-badge-status ${statusClass}">${statusLabel}</span>
          </div>
          <div class="card-body">
            <div class="card-category">${b.category || '기타'}</div>
            <h4 class="card-title">${b.title}</h4>
            <div class="card-author">${b.author}</div>
            
            <div class="card-meta-footer">
              <div class="card-rating-wrap">
                <span class="star-gold">★ ${b.rating ? b.rating.toFixed(1) : '0.0'}</span>
                <span>${b.currentPage} / ${b.totalPages}p</span>
              </div>
              <div class="card-progress-bar-wrap">
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                </div>
                <span>${progress}%</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    return html;
  }
}
