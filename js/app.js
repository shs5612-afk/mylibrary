/**
 * Application Main Controller (Refactored - Clean Architecture & SOLID)
 * Composition Root & Dependency Injection Container
 */

// 1. Repositories
import { LocalStorageBookRepository } from './repositories/LocalStorageBookRepository.js';
import { SettingsRepository } from './repositories/SettingsRepository.js';

// 2. Services
import { AIService } from './services/ai/AIService.js';
import { GeminiProvider } from './services/ai/GeminiProvider.js';
import { OpenAIProvider } from './services/ai/OpenAIProvider.js';
import { DemoMockProvider } from './services/ai/DemoMockProvider.js';
import { GoogleDriveService } from './services/cloud/GoogleDriveService.js';
import { LocalFileBackupService } from './services/cloud/LocalFileBackupService.js';
import { BackupSerializer } from './utils/backupSerializer.js';

// 3. UI Components & Modals
import { BookshelfView } from './components/BookshelfView.js';
import { BookDetailView } from './components/BookDetailView.js';
import { BookSearchModal } from './components/BookSearchModal.js';
import { StatsModal } from './components/StatsModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { QuoteCardModal } from './components/QuoteCardModal.js';
import { GDriveBackupModal } from './components/GDriveBackupModal.js';

class App {
  constructor() {
    // ------------------------------------------------------------------------
    // Step 1: Initialize Core Infrastructure & Repositories (DIP)
    // ------------------------------------------------------------------------
    this.bookRepo = new LocalStorageBookRepository();
    this.settingsRepo = new SettingsRepository();
    this.settings = this.settingsRepo.getSettings();

    // ------------------------------------------------------------------------
    // Step 2: Initialize Domain Services (Strategy Pattern for AI & Cloud)
    // ------------------------------------------------------------------------
    this.aiService = new AIService();
    this.configureAIProvider();

    this.gdriveService = new GoogleDriveService(this.settings.gdriveClientId);

    // Filter & Navigation State
    this.activeBookId = null;
    this.currentFilter = 'all';
    this.currentCategory = 'all';
    this.currentSort = 'updatedAt';
    this.searchQuery = '';
    this.viewMode = 'shelf';

    this.init();
  }

  /**
   * Factory method for creating active AI Provider (OCP & Strategy)
   */
  configureAIProvider() {
    const { aiProvider, geminiApiKey, geminiModel, openAiApiKey, openAiModel } = this.settings;
    if (aiProvider === 'gemini' && geminiApiKey) {
      this.aiService.setProvider(new GeminiProvider(geminiApiKey, geminiModel || 'gemini-3.7-flash'));
    } else if (aiProvider === 'openai' && openAiApiKey) {
      this.aiService.setProvider(new OpenAIProvider(openAiApiKey, openAiModel || 'gpt-4o-mini'));
    } else {
      this.aiService.setProvider(new DemoMockProvider());
    }
  }

  init() {
    // 1. Apply Theme
    if (this.settings.appTheme) {
      document.body.setAttribute('data-theme', this.settings.appTheme);
    }

    // 2. Initialize Modals with Injected Dependencies
    this.initModals();

    // 3. Initialize Views with Injected Dependencies
    this.initViews();

    // 4. Global UI Event Listeners
    this.initGlobalEvents();

    // 5. Initial Render
    this.updateTabCounts();
    this.renderBookshelf();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  initModals() {
    // A. Add Book Modal
    this.bookSearchModal = new BookSearchModal({
      onBookAdded: (bookData) => {
        const added = this.bookRepo.add(bookData);
        this.showToast(`'${added.title}' 도서가 서재에 추가되었습니다.`, 'success');
        this.renderBookshelf();
        this.updateTabCounts();
        this.openBookDetail(added.id);
      }
    });

    // B. Stats Modal (DIP)
    this.statsModal = new StatsModal({
      bookRepo: this.bookRepo,
      settingsRepo: this.settingsRepo
    });

    // C. Settings Modal (DIP)
    this.settingsModal = new SettingsModal({
      settingsRepo: this.settingsRepo,
      onSettingsUpdated: (newSettings) => {
        this.settings = newSettings;
        this.configureAIProvider();
        this.gdriveService.setClientId(newSettings.gdriveClientId);
        this.showToast('환경 설정이 업데이트되었습니다.', 'info');
      },
      onResetSampleData: () => {
        this.bookRepo.resetToSample();
        this.renderBookshelf();
        this.updateTabCounts();
        this.showToast('기본 서재 샘플 데이터로 복원되었습니다.', 'success');
      }
    });

    // D. Quote Card Modal
    this.quoteCardModal = new QuoteCardModal();

    // E. Google Drive Backup Modal (ISP & DIP)
    this.gdriveModal = new GDriveBackupModal({
      gdriveService: this.gdriveService,
      localBackupService: LocalFileBackupService,
      serializer: BackupSerializer,
      getDataToBackup: () => ({
        books: this.bookRepo.getAll(),
        settings: this.settingsRepo.getSettings()
      }),
      onRestoreData: (parsed) => {
        this.bookRepo.saveAll(parsed.books);
        if (parsed.settings) {
          this.settingsRepo.saveSettings(parsed.settings);
          this.settings = parsed.settings;
          this.configureAIProvider();
        }
        this.renderBookshelf();
        this.updateTabCounts();
        this.showToast('서재 데이터가 성공적으로 복원되었습니다.', 'success');
      }
    });
  }

  initViews() {
    // 1. Bookshelf View (Strategy Pattern for rendering modes)
    const shelfContainer = document.getElementById('shelfContainer');
    this.bookshelfView = new BookshelfView({
      container: shelfContainer,
      onBookClick: (bookId) => this.openBookDetail(bookId),
      onAddBookClick: () => this.bookSearchModal.open()
    });

    // 2. Book Detail View (DIP)
    const detailContainer = document.getElementById('bookDetailView');
    this.bookDetailView = new BookDetailView({
      container: detailContainer,
      aiService: this.aiService,
      onBackClick: () => this.closeBookDetail(),
      onUpdateBook: (bookId, updates) => {
        const updated = this.bookRepo.update(bookId, updates);
        this.updateTabCounts();
        return updated;
      },
      onDeleteBook: (bookId) => {
        this.bookRepo.delete(bookId);
        this.closeBookDetail();
        this.updateTabCounts();
        this.showToast('도서가 서재에서 삭제되었습니다.', 'info');
      },
      onOpenQuoteCard: (data) => this.quoteCardModal.open(data)
    });
  }

  initGlobalEvents() {
    document.getElementById('btnGoHome').addEventListener('click', () => {
      this.closeBookDetail();
    });

    document.getElementById('btnOpenAddBook').addEventListener('click', () => this.bookSearchModal.open());
    document.getElementById('btnOpenStats').addEventListener('click', () => this.statsModal.open());
    document.getElementById('btnOpenGDrive').addEventListener('click', () => this.gdriveModal.open());
    document.getElementById('btnOpenSettings').addEventListener('click', () => this.settingsModal.open());

    const searchInput = document.getElementById('libSearchInput');
    const btnClearSearch = document.getElementById('btnClearSearch');

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      if (this.searchQuery) {
        btnClearSearch.classList.remove('hidden');
      } else {
        btnClearSearch.classList.add('hidden');
      }
      this.renderBookshelf();
    });

    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      this.searchQuery = '';
      btnClearSearch.classList.add('hidden');
      this.renderBookshelf();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-status');
        this.renderBookshelf();
      });
    });

    const catSelect = document.getElementById('categoryFilter');
    catSelect.addEventListener('change', (e) => {
      this.currentCategory = e.target.value;
      this.renderBookshelf();
    });

    const sortSelect = document.getElementById('sortBySelect');
    sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.renderBookshelf();
    });

    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.getAttribute('data-mode');
        this.renderBookshelf();
      });
    });
  }

  renderBookshelf() {
    const books = this.bookRepo.getAll();
    this.bookshelfView.render({
      books,
      filterStatus: this.currentFilter,
      filterCategory: this.currentCategory,
      sortBy: this.currentSort,
      searchQuery: this.searchQuery,
      viewMode: this.viewMode
    });
  }

  updateTabCounts() {
    const books = this.bookRepo.getAll();
    const all = books.length;
    const reading = books.filter(b => b.status === 'reading').length;
    const completed = books.filter(b => b.status === 'completed').length;
    const wishlist = books.filter(b => b.status === 'wishlist').length;
    const paused = books.filter(b => b.status === 'paused').length;

    document.getElementById('countAll').textContent = all;
    document.getElementById('countReading').textContent = reading;
    document.getElementById('countCompleted').textContent = completed;
    document.getElementById('countWishlist').textContent = wishlist;
    document.getElementById('countPaused').textContent = paused;
  }

  openBookDetail(bookId) {
    const book = this.bookRepo.getById(bookId);
    if (!book) return;

    this.activeBookId = bookId;
    document.getElementById('bookshelfView').classList.remove('active');
    document.getElementById('bookshelfView').classList.add('hidden');

    const detailSection = document.getElementById('bookDetailView');
    detailSection.classList.remove('hidden');
    detailSection.classList.add('active');

    this.bookDetailView.render(book);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeBookDetail() {
    this.activeBookId = null;
    document.getElementById('bookDetailView').classList.remove('active');
    document.getElementById('bookDetailView').classList.add('hidden');

    const shelfSection = document.getElementById('bookshelfView');
    shelfSection.classList.remove('hidden');
    shelfSection.classList.add('active');

    this.renderBookshelf();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : type === 'warning' ? 'alert-triangle' : 'info'}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
