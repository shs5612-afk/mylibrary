/**
 * Base Shelf Renderer Strategy Interface
 * Strategy 패턴: 서재 보기 모드 렌더러 인터페이스 (OCP & LSP 준수)
 */

export class BaseShelfRenderer {
  /**
   * Render books to HTML string
   * @param {Array<Object>} books 
   * @returns {string}
   */
  render(books) {
    throw new Error('BaseShelfRenderer.render() must be implemented by subclass.');
  }
}
