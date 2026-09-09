/**
 * LocalStorage Implementation of Book Repository
 * 로컬스토리지 기반 도서 리포지토리 구현체
 */

import { IBookRepository } from './IBookRepository.js';
import { INITIAL_SAMPLE_BOOKS } from '../utils/seedData.js';

export class LocalStorageBookRepository extends IBookRepository {
  constructor(storageKey = 'my_library_books_v1') {
    super();
    this.storageKey = storageKey;
  }

  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        this.saveAll(INITIAL_SAMPLE_BOOKS);
        return INITIAL_SAMPLE_BOOKS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read books from localStorage:', e);
      return INITIAL_SAMPLE_BOOKS;
    }
  }

  getById(id) {
    const books = this.getAll();
    return books.find(b => b.id === id) || null;
  }

  add(book) {
    const books = this.getAll();
    const today = new Date().toISOString().split('T')[0];
    const initialSessions = Array.isArray(book.readingSessions) && book.readingSessions.length > 0
      ? book.readingSessions
      : [{ round: 1, startDate: book.startDate || today, finishDate: book.finishDate || '', note: '초판 1회독 시작' }];

    const normalizedQuotes = (book.quotes || []).map((q, idx) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      text: q.text || '',
      page: parseInt(q.page, 10) || 0,
      comment: q.comment || '',
      type: q.type || 'quote', // 'quote' | 'proof' | 'concept' | 'idea'
      myApplication: q.myApplication || '',
      chapter: q.chapter || '',
      createdAt: q.createdAt || today
    }));

    const newBook = {
      id: book.id || `book_${Date.now()}`,
      goodsNo: book.goodsNo || '',
      title: book.title || '제목 없음',
      author: book.author || '저자 미상',
      translator: book.translator || '',
      publisher: book.publisher || '',
      pubDate: book.pubDate || '',
      isbn: book.isbn || '',
      price: book.price || '',
      category: book.category || '기타',
      tags: Array.isArray(book.tags) ? book.tags : [],
      status: book.status || 'reading',
      totalPages: parseInt(book.totalPages, 10) || 100,
      currentPage: parseInt(book.currentPage, 10) || 0,
      rating: parseFloat(book.rating) || 0,
      startDate: book.startDate || today,
      finishDate: book.finishDate || '',
      cover: book.cover || '',
      spineColor: book.spineColor || '#2c3e50',
      link: book.link || (book.isbn ? `https://www.yes24.com/Product/Search?domain=BOOK&query=${book.isbn}` : ''),
      description: book.description || '',
      toc: book.toc || '',
      readingSessions: initialSessions,
      quotes: normalizedQuotes,
      review: book.review || '',
      writingDrafts: book.writingDrafts || [],
      draftChapters: book.draftChapters || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    books.unshift(newBook);
    this.saveAll(books);
    return newBook;
  }

  update(id, updates) {
    const books = this.getAll();
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx] = {
        ...books[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveAll(books);
      return books[idx];
    }
    return null;
  }

  delete(id) {
    const books = this.getAll();
    const filtered = books.filter(b => b.id !== id);
    this.saveAll(filtered);
    return filtered;
  }

  saveAll(books) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to localStorage:', e);
    }
  }

  resetToSample() {
    this.saveAll(INITIAL_SAMPLE_BOOKS);
    return INITIAL_SAMPLE_BOOKS;
  }
}
