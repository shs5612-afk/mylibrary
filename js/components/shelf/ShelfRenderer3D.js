/**
 * 3D Wooden Bookshelf Strategy Renderer
 * 3D 원목 책장 뷰 렌더러
 */

import { BaseShelfRenderer } from './BaseShelfRenderer.js';

export class ShelfRenderer3D extends BaseShelfRenderer {
  render(books) {
    const BOOKS_PER_SHELF = 8;
    const tiers = [];
    for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
      tiers.push(books.slice(i, i + BOOKS_PER_SHELF));
    }

    let html = '<div class="shelf-3d-view">';
    tiers.forEach((tierBooks) => {
      html += `
        <div class="shelf-tier">
          <div class="shelf-books-row">
            ${tierBooks.map(b => this.renderSpineItem(b)).join('')}
          </div>
          <div class="shelf-plank"></div>
        </div>
      `;
    });
    html += '</div>';

    return html;
  }

  renderSpineItem(book) {
    const progress = book.totalPages ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
    const spineBg = book.spineColor || '#2c3e50';
    const ribbonHtml = book.status === 'reading' ? '<div class="book-ribbon" title="현재 읽고 있는 책"></div>' : '';

    return `
      <div class="book-spine-item" data-id="${book.id}" style="background-color: ${spineBg};" title="${book.title} (${book.author})">
        ${ribbonHtml}
        <div class="spine-top-band"></div>
        <div class="spine-title-vertical">${book.title}</div>
        <div class="spine-bottom-info">
          <span class="spine-author">${book.author}</span>
          <div class="spine-progress-indicator">
            <div class="spine-progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
      </div>
    `;
  }
}
