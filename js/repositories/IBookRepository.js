/**
 * Abstract Book Repository Interface
 * 도서 데이터 영속성 계층 인터페이스 (DIP & LSP 준수)
 */

export class IBookRepository {
  /**
   * @returns {Array<Object>}
   */
  getAll() {
    throw new Error('IBookRepository.getAll() must be implemented.');
  }

  /**
   * @param {string} id 
   * @returns {Object|null}
   */
  getById(id) {
    throw new Error('IBookRepository.getById(id) must be implemented.');
  }

  /**
   * @param {Object} book 
   * @returns {Object}
   */
  add(book) {
    throw new Error('IBookRepository.add(book) must be implemented.');
  }

  /**
   * @param {string} id 
   * @param {Object} updates 
   * @returns {Object|null}
   */
  update(id, updates) {
    throw new Error('IBookRepository.update(id, updates) must be implemented.');
  }

  /**
   * @param {string} id 
   * @returns {Array<Object>}
   */
  delete(id) {
    throw new Error('IBookRepository.delete(id) must be implemented.');
  }

  /**
   * @param {Array<Object>} books 
   */
  saveAll(books) {
    throw new Error('IBookRepository.saveAll(books) must be implemented.');
  }
}
