/**
 * KaTeX & Markdown Math Renderer
 * 수학/공학 수식 ($...$, $$...$$) 및 마크다운 렌더링 헬퍼
 */

export class MathRenderer {
  /**
   * Render text with KaTeX formulas and Markdown
   * @param {string} text 
   * @returns {string} Safe HTML with rendered math and markdown
   */
  static renderMarkdownAndMath(text) {
    if (!text) return '';

    // Step 1: Protect LaTeX blocks before Markdown parsing
    const mathBlocks = [];
    const mathInlines = [];

    // Extract $$ ... $$ block math
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      mathBlocks.push(formula.trim());
      return `@@MATH_BLOCK_${mathBlocks.length - 1}@@`;
    });

    // Extract $ ... $ inline math (avoid matching standard currency if no latex)
    processed = processed.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (match, formula) => {
      mathInlines.push(formula.trim());
      return `@@MATH_INLINE_${mathInlines.length - 1}@@`;
    });

    // Step 2: Parse Markdown using Marked if available
    let html = '';
    if (window.marked) {
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      html = marked.parse(processed);
    } else {
      // Basic fallback
      html = processed
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/\n/g, '<br/>');
    }

    // Step 3: Replace placeholders with KaTeX rendered HTML
    html = html.replace(/@@MATH_BLOCK_(\d+)@@/g, (match, index) => {
      const formula = mathBlocks[parseInt(index, 10)];
      return this.renderKatex(formula, true);
    });

    html = html.replace(/@@MATH_INLINE_(\d+)@@/g, (match, index) => {
      const formula = mathInlines[parseInt(index, 10)];
      return this.renderKatex(formula, false);
    });

    return html;
  }

  /**
   * Render pure KaTeX string
   * @param {string} formula 
   * @param {boolean} displayMode 
   * @returns {string} HTML
   */
  static renderKatex(formula, displayMode = false) {
    if (window.katex) {
      try {
        return window.katex.renderToString(formula, {
          displayMode,
          throwOnError: false,
          output: 'htmlAndMathml'
        });
      } catch (e) {
        console.warn('KaTeX render error:', e);
        return `<span class="katex-error" title="${e.message}">${formula}</span>`;
      }
    }
    // Fallback if KaTeX is not loaded
    return displayMode ? `<div class="math-fallback">$$${formula}$$</div>` : `<span class="math-fallback">$${formula}$</span>`;
  }

  /**
   * Run KaTeX auto-render on a DOM element
   * @param {HTMLElement} element 
   */
  static renderInElement(element) {
    if (window.renderMathInElement && element) {
      try {
        window.renderMathInElement(element, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('renderMathInElement error:', e);
      }
    }
  }
}
