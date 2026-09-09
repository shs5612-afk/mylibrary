/**
 * Split-Screen Draft Studio Modal Component (집필 스튜디오)
 * 좌측: 서재 전체 지식 카드/인용문 저장소 (Vault) 실시간 검색 및 원고 즉시 삽입
 * 우측: LaTeX & KaTeX 실시간 수식 에디터 + 분할 미리보기 + .tex 및 .md 내보내기
 */

import { MathRenderer } from '../utils/mathRenderer.js';

export class DraftStudioModal {
  /**
   * @param {Object} params
   * @param {import('../repositories/LocalStorageBookRepository.js').LocalStorageBookRepository} params.bookRepo
   */
  constructor({ bookRepo }) {
    this.bookRepo = bookRepo;
    this.modalEl = document.getElementById('modalDraftStudio');
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.isPreviewVisible = true;
    this.draftStorageKey = 'library_draft_studio_chapter';

    this.init();
  }

  init() {
    if (!this.modalEl) return;

    // Close buttons
    this.modalEl.querySelectorAll('[data-close="modalDraftStudio"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Vault search
    const searchInput = this.modalEl.querySelector('#draftVaultSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderVault();
      });
    }

    // Vault type chips
    this.modalEl.querySelectorAll('.draft-vault-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.modalEl.querySelectorAll('.draft-vault-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.getAttribute('data-type') || 'all';
        this.renderVault();
      });
    });

    // Editor live preview
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');
    const preview = this.modalEl.querySelector('#draftEditorPreview');

    let debounceTimer = null;
    if (textarea && preview) {
      textarea.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.updatePreview();
          this.autoSave();
        }, 200);
      });
    }

    // Toggle Preview
    const btnTogglePreview = this.modalEl.querySelector('#btnDraftTogglePreview');
    if (btnTogglePreview && preview) {
      btnTogglePreview.addEventListener('click', () => {
        this.isPreviewVisible = !this.isPreviewVisible;
        preview.style.display = this.isPreviewVisible ? 'block' : 'none';
        btnTogglePreview.classList.toggle('active', this.isPreviewVisible);
      });
    }

    // LaTeX / Markdown Quick Toolbar
    this.modalEl.querySelectorAll('.draft-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const insertText = btn.getAttribute('data-insert');
        if (!insertText || !textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;

        textarea.value = val.substring(0, start) + insertText + val.substring(end);
        textarea.focus();
        textarea.selectionStart = start + insertText.length;
        textarea.selectionEnd = start + insertText.length;

        textarea.dispatchEvent(new Event('input'));
      });
    });

    // Save Draft
    const btnSaveDraft = this.modalEl.querySelector('#btnDraftSave');
    if (btnSaveDraft) {
      btnSaveDraft.addEventListener('click', () => {
        this.saveDraft();
        alert('집필 중인 원고가 로컬 스토리지에 안전하게 저장되었습니다.');
      });
    }

    // Export .tex (LaTeX)
    const btnExportTex = this.modalEl.querySelector('#btnDraftExportTex');
    if (btnExportTex) {
      btnExportTex.addEventListener('click', () => this.exportLaTeX());
    }

    // Export .md (Markdown)
    const btnExportMd = this.modalEl.querySelector('#btnDraftExportMd');
    if (btnExportMd) {
      btnExportMd.addEventListener('click', () => this.exportMarkdown());
    }
  }

  open() {
    if (!this.modalEl) return;
    this.loadDraft();
    this.renderVault();
    this.updatePreview();
    this.modalEl.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  }

  close() {
    if (!this.modalEl) return;
    this.modalEl.classList.remove('active');
  }

  loadDraft() {
    const chapterInput = this.modalEl.querySelector('#draftChapterTitle');
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');

    try {
      const saved = localStorage.getItem(this.draftStorageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (chapterInput) chapterInput.value = data.title || '제1장. 새로운 이론의 정립';
        if (textarea) textarea.value = data.content || '';
        return;
      }
    } catch (e) {
      console.warn('Failed to load saved draft', e);
    }

    if (chapterInput && !chapterInput.value) {
      chapterInput.value = '제1장. 새로운 이론의 정립';
    }
    if (textarea && !textarea.value) {
      textarea.value = `# 제1장. 새로운 이론의 정립\n\n## 1.1 서론 및 문제 제기\n여기에 책의 서론을 작성합니다. 좌측 지식 저장소에서 수집된 인용문과 정리를 [원고에 삽입]하여 논거로 활용하세요.\n\n## 1.2 핵심 수학적 모델\n$$\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim p_{data}} [\\log D(x)] + \\mathbb{E}_{z \\sim p_z} [\\log(1 - D(G(z)))]$$\n`;
    }
  }

  saveDraft() {
    const chapterInput = this.modalEl.querySelector('#draftChapterTitle');
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');

    const draftData = {
      title: chapterInput ? chapterInput.value.trim() : '무제',
      content: textarea ? textarea.value : '',
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.draftStorageKey, JSON.stringify(draftData));
  }

  autoSave() {
    this.saveDraft();
  }

  updatePreview() {
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');
    const preview = this.modalEl.querySelector('#draftEditorPreview');
    if (!textarea || !preview) return;

    const content = textarea.value;
    preview.innerHTML = MathRenderer.renderMarkdownAndMath(content || '*원고 내용이 실시간으로 미리보기됩니다.*');
  }

  renderVault() {
    const vaultList = this.modalEl.querySelector('#draftVaultList');
    if (!vaultList) return;

    const books = this.bookRepo.getAllBooks();
    const allQuotes = [];

    books.forEach(b => {
      (b.quotes || []).forEach(q => {
        allQuotes.push({
          bookId: b.id,
          bookTitle: b.title,
          bookAuthor: b.author,
          quote: q
        });
      });
    });

    const filtered = allQuotes.filter(item => {
      const q = item.quote;
      // Filter by type
      if (this.activeFilter !== 'all' && q.type !== this.activeFilter) {
        return false;
      }
      // Search query
      if (this.searchQuery) {
        const targetStr = `${item.bookTitle} ${item.bookAuthor} ${q.text || ''} ${q.comment || ''} ${q.myApplication || ''}`.toLowerCase();
        if (!targetStr.includes(this.searchQuery)) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length === 0) {
      vaultList.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:0.85rem;">
          검색 조건에 맞는 지식 카드나 인용문이 없습니다.
        </div>
      `;
      return;
    }

    vaultList.innerHTML = filtered.map(item => {
      const q = item.quote;
      const typeLabel = this.getTypeLabel(q.type);
      const textSnippet = MathRenderer.renderMarkdownAndMath(q.text || '');

      return `
        <div class="draft-vault-card" data-quote-id="${q.id}">
          <div class="draft-vault-card-header">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:200px;">
              《${item.bookTitle}》
            </span>
            <span class="badge-type badge-type-${q.type || 'quote'}">${typeLabel}</span>
          </div>
          <div class="draft-vault-card-text">
            ${textSnippet}
          </div>
          ${q.myApplication ? `
            <div style="font-size:0.78rem; color:var(--accent-primary); background:var(--accent-primary-light); padding:4px 8px; border-radius:4px;">
              ✍️ ${q.myApplication}
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <span style="font-size:0.72rem; color:var(--text-dim);">${q.page ? `p.${q.page}` : ''}</span>
            <button class="draft-vault-card-btn btn-insert-to-draft" data-quote-id="${q.id}" data-book-title="${item.bookTitle.replace(/"/g, '&quot;')}" data-book-author="${item.bookAuthor.replace(/"/g, '&quot;')}">
              <i data-lucide="corner-down-left" style="width:12px; height:12px;"></i> 원고에 삽입 ↵
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach insert event
    vaultList.querySelectorAll('.btn-insert-to-draft').forEach(btn => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-quote-id');
        const target = allQuotes.find(it => it.quote.id === qid);
        if (!target) return;

        this.insertQuoteIntoDraft(target);
      });
    });
  }

  insertQuoteIntoDraft(item) {
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');
    if (!textarea) return;

    const q = item.quote;
    const typeLabel = this.getTypeLabel(q.type);
    
    // Format quote markdown block
    const insertBlock = `\n\n> [!QUOTE] 《${item.bookTitle}》 (p.${q.page || '?'}) - ${item.bookAuthor}\n> [${typeLabel}] ${q.text}\n>\n> **[인용 및 적용점]** ${q.myApplication || q.comment || '원고 본문 전개'}\n\n`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;

    textarea.value = val.substring(0, start) + insertBlock + val.substring(end);
    textarea.focus();
    textarea.selectionStart = start + insertBlock.length;
    textarea.selectionEnd = start + insertBlock.length;

    textarea.dispatchEvent(new Event('input'));
  }

  getTypeLabel(type) {
    switch (type) {
      case 'proof': return '📐 증명/원리';
      case 'concept': return '💡 핵심 개념';
      case 'idea': return '🚀 적용/아이디어';
      default: return '📝 단순 발췌';
    }
  }

  exportMarkdown() {
    const chapterInput = this.modalEl.querySelector('#draftChapterTitle');
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');

    const title = chapterInput ? chapterInput.value.trim() : 'Manuscript';
    const content = textarea ? textarea.value : '';

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[\/\\?%*:|"<>]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportLaTeX() {
    const chapterInput = this.modalEl.querySelector('#draftChapterTitle');
    const textarea = this.modalEl.querySelector('#draftEditorTextarea');

    const title = chapterInput ? chapterInput.value.trim() : 'Academic Manuscript';
    let mdContent = textarea ? textarea.value : '';

    // Convert markdown headings to LaTeX sections
    let latexBody = mdContent
      .replace(/^# (.*$)/gm, '\\section{$1}')
      .replace(/^## (.*$)/gm, '\\subsection{$1}')
      .replace(/^### (.*$)/gm, '\\subsubsection{$1}')
      .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
      .replace(/\*([^*]+)\*/g, '\\textit{$1}')
      .replace(/^> (.*$)/gm, '\\begin{quote}\n$1\n\\end{quote}');

    const latexTemplate = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{kotex}
\\usepackage{amsmath,amssymb,amsfonts,amsthm}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
\\usepackage{hyperref}
\\usepackage{color}

\\newtheorem{theorem}{정리}[section]
\\newtheorem{definition}{정의}[section]
\\newtheorem{lemma}{보조정리}[section]

\\title{${title}}
\\author{집필 연구자}
\\date{\\today}

\\begin{document}
\\maketitle

${latexBody}

\\end{document}
`;

    const blob = new Blob([latexTemplate], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[\/\\?%*:|"<>]/g, '_')}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
