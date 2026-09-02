/**
 * Author's Research & Writing Workspace Component
 * 책 하단 [나의 저술 & 집필 참고자료함] 자동 정리 및 Markdown / LaTeX 문서 내보내기
 */

import { MathRenderer } from '../utils/mathRenderer.js';

export class WritingWorkspaceView {
  constructor({ container, book, onUpdateDrafts }) {
    this.container = container;
    this.book = book;
    this.onUpdateDrafts = onUpdateDrafts;
  }

  render(drafts = []) {
    const coreInsights = drafts.filter(d => d.category === 'core_insight');
    const latexProofs = drafts.filter(d => d.category === 'latex_proof');
    const quotesArgs = drafts.filter(d => d.category === 'quotes_args');
    const bookIdeas = drafts.filter(d => d.category === 'book_ideas');

    this.container.innerHTML = `
      <div class="writing-workspace-inner">
        <!-- Header -->
        <div class="writing-workspace-header">
          <div class="workspace-title-group">
            <h3>
              <i data-lucide="feather" class="text-primary"></i> 나의 도서 저술 & 집필 참고자료함 (${drafts.length})
            </h3>
            <p>이 책을 읽으며 축적한 핵심 통찰, LaTeX 수식 유도, 그리고 AI 독서 토론 내용이 자동으로 정리되어 향후 책을 집필할 때 바로 활용할 수 있습니다.</p>
          </div>

          <!-- Export Actions -->
          <div class="export-btn-group">
            <button id="btnExportMarkdown" class="btn btn-outline" title="Obsidian / Notion 호환 마크다운 파일로 다운로드">
              <i data-lucide="file-down"></i> Markdown (.md) 내보내기
            </button>
            <button id="btnExportLatex" class="btn btn-primary" title="학술/출판용 LaTeX 원고 문서로 다운로드">
              <i data-lucide="file-code-2"></i> LaTeX (.tex) 내보내기
            </button>
          </div>
        </div>

        <!-- Add Custom Draft Note Quick Bar -->
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-medium); border-radius:var(--radius-md); padding:16px; margin-bottom:24px;">
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <select id="selectNewDraftCat" class="select-input">
              <option value="core_insight">💡 핵심 개념 & 통찰</option>
              <option value="latex_proof">📐 수식 & 공학 증명 (LaTeX)</option>
              <option value="quotes_args">🏛️ 인용 및 논거</option>
              <option value="book_ideas">✍️ 나의 집필 아이디어 & 챕터</option>
            </select>
            <input type="text" id="inputNewDraftTitle" placeholder="자료 소제목 (예: 3장 시스템 동역학 수식 유도)" style="flex:1; min-width:200px;" />
            <button id="btnAddNewDraft" class="btn btn-secondary btn-sm">
              <i data-lucide="plus"></i> 집필 메모 추가
            </button>
          </div>
          <textarea id="inputNewDraftContent" rows="2" placeholder="집필에 인용할 내용이나 수식($...$, $$...$$)을 적어보세요..." style="width:100%; margin-top:10px; padding:10px;"></textarea>
        </div>

        <!-- 4-Column Categories Grid -->
        <div class="writing-categories-grid">
          
          <!-- Col 1: Core Insights -->
          <div class="category-column">
            <div class="category-col-header">
              <span>💡 핵심 개념 & 통찰</span>
              <span class="count-badge">${coreInsights.length}</span>
            </div>
            <div class="category-cards-list">
              ${coreInsights.length === 0 ? '<p style="color:var(--text-dim); font-size:0.8rem; text-align:center; padding:14px;">저장된 개념이 없습니다.</p>' : ''}
              ${coreInsights.map(d => this.renderDraftCard(d)).join('')}
            </div>
          </div>

          <!-- Col 2: LaTeX Proofs & Formulas -->
          <div class="category-column">
            <div class="category-col-header">
              <span>📐 수식 & 공학 증명</span>
              <span class="count-badge">${latexProofs.length}</span>
            </div>
            <div class="category-cards-list">
              ${latexProofs.length === 0 ? '<p style="color:var(--text-dim); font-size:0.8rem; text-align:center; padding:14px;">저장된 수식이 없습니다.</p>' : ''}
              ${latexProofs.map(d => this.renderDraftCard(d)).join('')}
            </div>
          </div>

          <!-- Col 3: Citations & Arguments -->
          <div class="category-column">
            <div class="category-col-header">
              <span>🏛️ 인용 및 논거</span>
              <span class="count-badge">${quotesArgs.length}</span>
            </div>
            <div class="category-cards-list">
              ${quotesArgs.length === 0 ? '<p style="color:var(--text-dim); font-size:0.8rem; text-align:center; padding:14px;">저장된 논거가 없습니다.</p>' : ''}
              ${quotesArgs.map(d => this.renderDraftCard(d)).join('')}
            </div>
          </div>

          <!-- Col 4: Book Ideas -->
          <div class="category-column">
            <div class="category-col-header">
              <span>✍️ 나의 집필 아이디어</span>
              <span class="count-badge">${bookIdeas.length}</span>
            </div>
            <div class="category-cards-list">
              ${bookIdeas.length === 0 ? '<p style="color:var(--text-dim); font-size:0.8rem; text-align:center; padding:14px;">저장된 아이디어가 없습니다.</p>' : ''}
              ${bookIdeas.map(d => this.renderDraftCard(d)).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    this.attachEvents(drafts);
  }

  renderDraftCard(draft) {
    const contentHtml = MathRenderer.renderMarkdownAndMath(draft.content || '');
    return `
      <div class="writing-draft-card" data-draft-id="${draft.id}">
        <button class="draft-delete-btn" data-id="${draft.id}" title="자료 삭제">
          <i data-lucide="x" style="width:14px; height:14px;"></i>
        </button>
        <div class="draft-title">${draft.title || '무제'}</div>
        <div class="draft-body">${contentHtml}</div>
        <div style="font-size:0.72rem; color:var(--text-dim); margin-top:8px; text-align:right;">${draft.createdAt || ''}</div>
      </div>
    `;
  }

  attachEvents(drafts) {
    // Add manual draft
    const btnAdd = this.container.querySelector('#btnAddNewDraft');
    const selectCat = this.container.querySelector('#selectNewDraftCat');
    const inputTitle = this.container.querySelector('#inputNewDraftTitle');
    const inputContent = this.container.querySelector('#inputNewDraftContent');

    btnAdd.addEventListener('click', () => {
      const content = inputContent.value.trim();
      if (!content) {
        alert('내용을 입력해 주세요.');
        return;
      }

      const newDraft = {
        id: `wd_${Date.now()}`,
        category: selectCat.value,
        title: inputTitle.value.trim() || '연구 메모',
        content,
        createdAt: new Date().toISOString().split('T')[0]
      };

      const updated = [newDraft, ...drafts];
      if (this.onUpdateDrafts) this.onUpdateDrafts(updated);

      inputTitle.value = '';
      inputContent.value = '';
      this.render(updated);
    });

    // Delete draft
    this.container.querySelectorAll('.draft-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const did = btn.getAttribute('data-id');
        const updated = drafts.filter(d => d.id !== did);
        if (this.onUpdateDrafts) this.onUpdateDrafts(updated);
        this.render(updated);
      });
    });

    // Export Markdown
    const btnMd = this.container.querySelector('#btnExportMarkdown');
    btnMd.addEventListener('click', () => this.exportMarkdown(drafts));

    // Export LaTeX
    const btnLatex = this.container.querySelector('#btnExportLatex');
    btnLatex.addEventListener('click', () => this.exportLatex(drafts));
  }

  exportMarkdown(drafts) {
    let md = `# 📖 《${this.book.title}》 기반 저술 및 집필 연구 자료\n\n`;
    md += `- **원서 저자**: ${this.book.author}\n`;
    md += `- **출판사**: ${this.book.publisher}\n`;
    md += `- **ISBN-13**: ${this.book.isbn}\n`;
    md += `- **정리 일자**: ${new Date().toLocaleDateString('ko-KR')}\n\n`;
    md += `---\n\n`;

    md += `## 1. 💡 핵심 개념 & 통찰\n`;
    const c1 = drafts.filter(d => d.category === 'core_insight');
    if (c1.length === 0) md += `*기록된 내용 없음*\n`;
    c1.forEach(d => { md += `### ${d.title}\n${d.content}\n\n`; });

    md += `\n## 2. 📐 수식 및 공학 모델 (LaTeX)\n`;
    const c2 = drafts.filter(d => d.category === 'latex_proof');
    if (c2.length === 0) md += `*기록된 내용 없음*\n`;
    c2.forEach(d => { md += `### ${d.title}\n${d.content}\n\n`; });

    md += `\n## 3. 🏛️ 인용 및 논거\n`;
    const c3 = drafts.filter(d => d.category === 'quotes_args');
    if (c3.length === 0) md += `*기록된 내용 없음*\n`;
    c3.forEach(d => { md += `### ${d.title}\n${d.content}\n\n`; });

    md += `\n## 4. ✍️ 나의 도서 집필 아이디어 & 챕터 구성\n`;
    const c4 = drafts.filter(d => d.category === 'book_ideas');
    if (c4.length === 0) md += `*기록된 내용 없음*\n`;
    c4.forEach(d => { md += `### ${d.title}\n${d.content}\n\n`; });

    this.downloadFile(md, `${this.book.title.replace(/[\\/:*?"<>|]/g, '_')}_저술자료.md`, 'text/markdown');
  }

  exportLatex(drafts) {
    let tex = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{kotex}
\\usepackage{amsmath, amssymb, amsfonts}
\\usepackage{geometry}
\\geometry{margin=1in}
\\usepackage{hyperref}

\\title{\\textbf{《${this.book.title}》 기반 저술 및 학술 연구 노트}}
\\author{저술 연구자 (My Literary Haven)}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{도서 정보 및 메타데이터}
\\begin{itemize}
  \\item \\textbf{도서명}: ${this.book.title}
  \\item \\textbf{원저자}: ${this.book.author}
  \\item \\textbf{출판사}: ${this.book.publisher}
  \\item \\textbf{ISBN-13}: ${this.book.isbn}
\\end{itemize}

\\section{핵심 개념 및 통찰 (Core Insights)}
`;

    drafts.filter(d => d.category === 'core_insight').forEach(d => {
      tex += `\\subsection{${d.title}}\n${d.content}\n\n`;
    });

    tex += `\\section{수학 및 공학 수식 유도 (Mathematical Proofs)}\n`;
    drafts.filter(d => d.category === 'latex_proof').forEach(d => {
      tex += `\\subsection{${d.title}}\n${d.content}\n\n`;
    });

    tex += `\\section{인용 및 논거 (Citations and Arguments)}\n`;
    drafts.filter(d => d.category === 'quotes_args').forEach(d => {
      tex += `\\subsection{${d.title}}\n${d.content}\n\n`;
    });

    tex += `\\section{향후 도서 집필 아이디어 (Book Writing Plan)}\n`;
    drafts.filter(d => d.category === 'book_ideas').forEach(d => {
      tex += `\\subsection{${d.title}}\n${d.content}\n\n`;
    });

    tex += `\\end{document}\n`;

    this.downloadFile(tex, `${this.book.title.replace(/[\\/:*?"<>|]/g, '_')}_집필원고.tex`, 'application/x-tex');
  }

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
