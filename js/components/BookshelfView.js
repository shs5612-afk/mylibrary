/**
 * Bookshelf View Component (Refactored - OCP & Strategy Pattern)
 * 서재 뷰 매니저: 전략 렌더러(ShelfRenderer3D, ShelfRendererGrid, ShelfRendererList)를 등록받아 위임
 */

import { ShelfRenderer3D } from './shelf/ShelfRenderer3D.js';
import { ShelfRendererGrid } from './shelf/ShelfRendererGrid.js';
import { ShelfRendererList } from './shelf/ShelfRendererList.js';

export class BookshelfView {
  constructor({ container, onBookClick, onAddBookClick }) {
    this.container = container;
    this.onBookClick = onBookClick;
    this.onAddBookClick = onAddBookClick;

    // Strategy Pattern: View renderers registry (OCP 준수)
    this.renderers = {
      shelf: new ShelfRenderer3D(),
      grid: new ShelfRendererGrid(),
      list: new ShelfRendererList()
    };
  }

  /**
   * Register a new shelf renderer strategy dynamically (OCP)
   * @param {string} modeKey 
   * @param {import('./shelf/BaseShelfRenderer.js').BaseShelfRenderer} rendererInstance 
   */
  registerRenderer(modeKey, rendererInstance) {
    this.renderers[modeKey] = rendererInstance;
  }

  render({ books, filterStatus = 'all', filterCategory = 'all', sortBy = 'updatedAt', searchQuery = '', viewMode = 'shelf' }) {
    // 1. Filter Books
    let filtered = [...books];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(b => b.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(b => 
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.isbn || '').includes(q) ||
        (b.review || '').toLowerCase().includes(q) ||
        (b.quotes || []).some(quote => (quote.text || '').toLowerCase().includes(q) || (quote.comment || '').toLowerCase().includes(q))
      );
    }

    // 2. Sort Books
    filtered.sort((a, b) => {
      if (sortBy === 'updatedAt') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      if (sortBy === 'createdAt') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'progress') {
        const progA = a.totalPages ? (a.currentPage / a.totalPages) : 0;
        const progB = b.totalPages ? (b.currentPage / b.totalPages) : 0;
        return progB - progA;
      }
      return 0;
    });

    // 3. Render Empty State or Strategy Output
    if (filtered.length === 0) {
      this.renderEmptyState(searchQuery);
      return;
    }

    const renderer = this.renderers[viewMode] || this.renderers.shelf;
    this.container.innerHTML = renderer.render(filtered);
    this.attachBookClickEvents();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderEmptyState(query) {
    this.container.innerHTML = `
      <div class="empty-shelf-state">
        <div class="empty-icon-box">
          <i data-lucide="book-plus"></i>
        </div>
        <h3>${query ? '검색된 도서가 없습니다' : '서재에 등록된 도서가 없습니다'}</h3>
        <p>${query ? `"${query}"와 일치하는 책이 없습니다. 다른 키워드로 검색하거나 새로운 책을 등록해보세요.` : 'YES24 검색 또는 직접 입력을 통해 읽은 책과 읽고 싶은 책을 서재에 추가해보세요.'}</p>
        <button id="btnEmptyAddBook" class="btn btn-primary">
          <i data-lucide="plus-circle"></i> 첫 번째 도서 등록하기
        </button>
      </div>
    `;

    const btn = this.container.querySelector('#btnEmptyAddBook');
    if (btn && this.onAddBookClick) {
      btn.addEventListener('click', this.onAddBookClick);
    }
  }

  attachBookClickEvents() {
    const items = this.container.querySelectorAll('[data-id]');
    items.forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        if (id && this.onBookClick) {
          this.onBookClick(id);
        }
      });
    });
  }
}
