/**
 * Table List Strategy Renderer
 * 목록 테이블 뷰 렌더러
 */

import { BaseShelfRenderer } from './BaseShelfRenderer.js';

export class ShelfRendererList extends BaseShelfRenderer {
  render(books) {
    let html = `
      <div class="shelf-list-view">
        <table class="book-table">
          <thead>
            <tr>
              <th style="width: 60px;">표지</th>
              <th>도서명 / 저자</th>
              <th>분야</th>
              <th>상태</th>
              <th>독서 진도</th>
              <th>별점</th>
              <th>ISBN-13</th>
              <th>YES24</th>
            </tr>
          </thead>
          <tbody>
    `;

    books.forEach(b => {
      const progress = b.totalPages ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100)) : 0;
      const statusLabel = {
        reading: '📖 읽는 중',
        completed: '✅ 완독',
        wishlist: '📌 읽고 싶음',
        paused: '⏸️ 잠시 멈춤'
      }[b.status] || '기록 중';

      const thumb = b.cover ? `<img src="${b.cover}" class="table-thumb" alt="${b.title}" />` : `<div class="table-thumb" style="background:${b.spineColor || '#333'};"></div>`;

      html += `
        <tr data-id="${b.id}">
          <td>${thumb}</td>
          <td>
            <div class="table-title-cell">
              <div>
                <div class="table-title-text">${b.title}</div>
                <div class="card-author" style="margin-bottom:0;">${b.author} · ${b.publisher || ''}</div>
              </div>
            </div>
          </td>
          <td><span class="badge-research">${b.category || '기타'}</span></td>
          <td>${statusLabel}</td>
          <td>
            <div style="width: 110px;">
              <div style="font-size:0.78rem; margin-bottom:2px;">${b.currentPage}/${b.totalPages}p (${progress}%)</div>
              <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${progress}%;"></div></div>
            </div>
          </td>
          <td><span class="star-gold">★ ${b.rating || 0}</span></td>
          <td><code style="font-family:var(--font-mono); font-size:0.8rem;">${b.isbn || '-'}</code></td>
          <td>
            ${b.link ? `<a href="${b.link}" target="_blank" rel="noopener" class="btn btn-sm btn-outline" onclick="event.stopPropagation();">YES24</a>` : '-'}
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }
}
