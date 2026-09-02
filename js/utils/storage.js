/**
 * Storage & State Management
 * LocalStorage / IndexedDB 기반 서재 데이터 영구 저장 및 백업/복원
 */

const STORAGE_KEYS = {
  BOOKS: 'my_library_books_v1',
  SETTINGS: 'my_library_settings_v1'
};

// 기본 샘플 도서 데이터 (수학/공학 LaTeX 수식, 인상 깊은 구절, YES24 정보, 저술자료 완비)
const INITIAL_SAMPLE_BOOKS = [
  {
    id: 'book_infinite_powers',
    title: '미적분학의 힘 (Infinite Powers)',
    author: '스티븐 스트로가츠 지음 / 이충호 옮김',
    publisher: '웅진지식하우스',
    pubDate: '2020-04-20',
    isbn: '9788934985976',
    price: '22,000원',
    category: '수학/공학',
    status: 'reading', // reading, completed, wishlist, paused
    totalPages: 432,
    currentPage: 218,
    rating: 5.0,
    startDate: '2026-08-15',
    finishDate: '',
    cover: 'https://image.yes24.com/goods/89947933/XL',
    spineColor: '#1e3a8a',
    link: 'https://www.yes24.com/Product/Goods/89947933',
    description: '현대 문명을 만든 가장 위대한 수학적 도구, 미적분학의 역사와 원리를 직관적인 비유와 통찰로 풀어낸 교양 수학의 명작.',
    toc: `프롤로그: 무한의 매혹
1장. 무한과 곡선 (원과 파이의 비밀)
2장. 미분: 순간의 속도를 포착하는 법
3장. 적분: 쪼개서 더하는 궁극의 기술
4장. 미분방정식: 세상을 움직이는 법칙
5장. 푸리에 변환과 파동 (양자역학에서 스마트폰까지)
6장. 미래를 예측하는 비선형 동역학`,
    quotes: [
      {
        id: 'q_1',
        text: '미적분학의 핵심 통찰은 연속적인 세계를 무한히 잘게 쪼갠 뒤(미분), 다시 정밀하게 결합하는 것(적분)이다.',
        page: 42,
        comment: '복잡한 공학 시스템을 모듈화하여 해결하는 사고방식의 근본 원리.',
        createdAt: '2026-08-16'
      },
      {
        id: 'q_2',
        text: '오일러의 등식 $e^{i\\pi} + 1 = 0$ 은 수학에서 가장 아름다운 다섯 개의 상수($e, i, \\pi, 1, 0$)가 완벽한 조화를 이루는 결정체다.',
        page: 154,
        comment: '내 집필 3장에서 수학적 우아함과 공학적 모델링의 조화를 설명할 때 핵심 인용구로 사용할 것.',
        createdAt: '2026-08-20'
      }
    ],
    review: `### 📐 《미적분학의 힘》 독서 노트 및 고찰

미적분학은 단순한 계산 기술이 아니라 **세상의 변화율을 다루는 사고의 언어**이다.

#### 1. 미분의 본질: 극한과 순간 변화율
함수 $f(x)$에 대해 순간적인 기울기는 다음 극한으로 정의된다:
$$\\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

이 간단한 수식이 뉴턴의 운동 방정식 $F = m\\frac{d^2 x}{dt^2}$ 으로 이어져 근대 물리학과 우주 공학의 기초를 놓았다.

#### 2. 적분과 연속 체계
연속적인 물리량을 합산할 때 리만 적분(Riemann Integral)은 다음과 같은 극한 합으로 표현된다:
$$\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i^*) \\Delta x$$

공학 문제를 마주할 때 "어떻게 무한소로 분해하고 재합성할 것인가"를 항상 상기하자.`,
    writingDrafts: [
      {
        id: 'wd_1',
        category: 'core_insight', // core_insight, latex_proof, quotes_args, book_ideas
        title: '미적분적 사고 모델 (Calculus Thinking in System Design)',
        content: '복잡한 대규모 소프트웨어 및 시스템을 설계할 때, 연속적인 비즈니스 흐름을 미소 상태(Micro-state)로 쪼개고 이를 다시 집계(Aggregation)하는 파이프라인 아키텍처는 미분과 적분의 철학과 완벽히 일치한다.',
        createdAt: '2026-08-25'
      },
      {
        id: 'wd_2',
        category: 'latex_proof',
        title: '동역학계의 감쇠 진동 모델 수식 유도',
        content: '2계 제차 선형 미분방정식: $$\\frac{d^2 y}{dt^2} + 2\\zeta \\omega_n \\frac{dy}{dt} + \\omega_n^2 y = 0$$ 이를 통하여 시스템 안정성(Stability)을 해석하는 챕터의 기초 수식으로 배치할 것.',
        createdAt: '2026-08-28'
      }
    ],
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-28T14:30:00.000Z'
  },
  {
    id: 'book_cosmos',
    title: '코스모스 (Cosmos)',
    author: '칼 세이건 지음 / 홍승수 옮김',
    publisher: '사이언스북스',
    pubDate: '2006-12-20',
    isbn: '9788983711892',
    price: '19,500원',
    category: '자연과학',
    status: 'completed',
    totalPages: 710,
    currentPage: 710,
    rating: 5.0,
    startDate: '2026-07-01',
    finishDate: '2026-07-28',
    cover: 'https://image.yes24.com/goods/2312211/XL',
    spineColor: '#0f172a',
    link: 'https://www.yes24.com/Product/Goods/2312211',
    description: '인류가 우주라는 거대한 바다에서 자아를 찾아온 위대한 여정을 시적이고 철학적인 문체로 서술한 불멸의 과학 고전.',
    toc: `1장. 코스모스의 바닷가에서
2장. 우주 생명의 푸가
3장. 지상과 천상의 하모니
4장. 천국과 지옥
5장. 붉은 행성을 위한 블루스
6장. 여행자가 들려준 이야기
7장. 밤하늘의 등뼈
8장. 시간과 공간을 가르는 여행`,
    quotes: [
      {
        id: 'q_c1',
        text: '우리는 코스모스의 일부이다. 우리는 별에서 나온 물질로 만들어졌으며, 코스모스가 스스로를 알게 하는 수단이다.',
        page: 35,
        comment: '인간의 지적 탐구와 저술 활동의 궁극적 존재 이유를 밝히는 문장.',
        createdAt: '2026-07-05'
      }
    ],
    review: `### 🌌 인류와 우주, 그리고 지적 기록에 대한 성찰

칼 세이건은 과학적 사실에 감성과 철학을 부여하는 독보적인 문장력을 보여준다. 내가 책을 집필할 때도 딱딱한 기술적 나열에 그치지 않고, 독자에게 거시적인 맥락과 인간적인 온기를 전달해야 함을 배운다.`,
    writingDrafts: [
      {
        id: 'wd_c1',
        category: 'book_ideas',
        title: '내 책 1장 도입부: 경외감에서 출발하는 공학적 탐구',
        content: '기술과 수식을 배우기 전에 "왜 우리는 이 문제를 풀어야 하는가?"에 대한 존재론적 질문을 던지는 칼 세이건식 프롤로그 구성 차용.',
        createdAt: '2026-07-29'
      }
    ],
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-28T18:00:00.000Z'
  },
  {
    id: 'book_clean_code',
    title: 'Clean Code 클린 코드',
    author: '로버트 C. 마틴 지음 / 박재호 옮김',
    publisher: '인사이트',
    pubDate: '2013-12-24',
    isbn: '9788966260959',
    price: '33,000원',
    category: '수학/공학',
    status: 'completed',
    totalPages: 584,
    currentPage: 584,
    rating: 4.5,
    startDate: '2026-06-10',
    finishDate: '2026-06-30',
    cover: 'https://image.yes24.com/goods/11681152/XL',
    spineColor: '#15803d',
    link: 'https://www.yes24.com/Product/Goods/11681152',
    description: '애자일 소프트웨어 장인 정신을 위한 클린 코드 작성 기법과 리팩터링 가이드.',
    toc: `1장. 깨끗한 코드
2장. 의미 있는 이름
3장. 함수
4장. 주석
5장. 형식 맞추기
6장. 객체와 자료 구조`,
    quotes: [
      {
        id: 'q_cc1',
        text: '캠프장은 처음 왔을 때보다 더 깨끗하게 치워놓고 떠나라 (보이스카우트 규칙).',
        page: 19,
        comment: '코드뿐만 아니라 지속적인 지식 정리와 독서 기록 관리에도 적용되는 원칙.',
        createdAt: '2026-06-12'
      }
    ],
    review: `### 💻 클린 코드와 명확한 의사소통

소프트웨어 엔지니어링은 기계에게 지시하는 것보다 동료 인간에게 의도를 설명하는 행위에 가깝다.`,
    writingDrafts: [],
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-06-30T16:00:00.000Z'
  }
];

const DEFAULT_SETTINGS = {
  appTheme: 'oak', // oak, midnight, paper
  aiProvider: 'gemini', // gemini, openai
  geminiApiKey: '',
  openAiApiKey: '',
  gdriveClientId: '',
  yearlyGoal: 30
};

export class LibraryStorage {
  static getBooks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!data) {
        this.saveBooks(INITIAL_SAMPLE_BOOKS);
        return INITIAL_SAMPLE_BOOKS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to read books from storage:', e);
      return INITIAL_SAMPLE_BOOKS;
    }
  }

  static saveBooks(books) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch (e) {
      console.error('Failed to save books to storage:', e);
    }
  }

  static getBookById(id) {
    const books = this.getBooks();
    return books.find(b => b.id === id) || null;
  }

  static addBook(book) {
    const books = this.getBooks();
    const newBook = {
      id: book.id || `book_${Date.now()}`,
      title: book.title || '제목 없음',
      author: book.author || '저자 미상',
      publisher: book.publisher || '',
      pubDate: book.pubDate || '',
      isbn: book.isbn || '',
      price: book.price || '',
      category: book.category || '기타',
      status: book.status || 'reading',
      totalPages: parseInt(book.totalPages, 10) || 100,
      currentPage: parseInt(book.currentPage, 10) || 0,
      rating: parseFloat(book.rating) || 0,
      startDate: book.startDate || new Date().toISOString().split('T')[0],
      finishDate: book.finishDate || '',
      cover: book.cover || '',
      spineColor: book.spineColor || '#2c3e50',
      link: book.link || (book.isbn ? `https://www.yes24.com/Product/Search?domain=BOOK&query=${book.isbn}` : ''),
      description: book.description || '',
      toc: book.toc || '',
      quotes: book.quotes || [],
      review: book.review || '',
      writingDrafts: book.writingDrafts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    books.unshift(newBook);
    this.saveBooks(books);
    return newBook;
  }

  static updateBook(id, updates) {
    const books = this.getBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx !== -1) {
      books[idx] = {
        ...books[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveBooks(books);
      return books[idx];
    }
    return null;
  }

  static deleteBook(id) {
    const books = this.getBooks();
    const filtered = books.filter(b => b.id !== id);
    this.saveBooks(filtered);
    return filtered;
  }

  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  static resetToSampleData() {
    this.saveBooks(INITIAL_SAMPLE_BOOKS);
    return INITIAL_SAMPLE_BOOKS;
  }

  // Backup & Export / Import
  static exportFullBackup() {
    const backup = {
      version: '1.0.0',
      appName: 'My Literary Haven',
      exportedAt: new Date().toISOString(),
      books: this.getBooks(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.books || !Array.isArray(parsed.books)) {
        throw new Error('유효한 서재 백업 데이터 포맷이 아닙니다.');
      }
      this.saveBooks(parsed.books);
      if (parsed.settings) {
        this.saveSettings(parsed.settings);
      }
      return { success: true, count: parsed.books.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
