/**
 * YES24 & ISBN Book Info Fetcher
 * YES24 도서 검색 및 ISBN 메타데이터 파싱 (Vercel Serverless + Google Books + OpenLibrary + Fallback Database)
 */

export class Yes24Fetcher {
  /**
   * Search books from YES24 or ISBN
   * @param {string} query ISBN or Title or Author
   * @returns {Promise<Array>} List of multiple books (up to 20)
   */
  static async search(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    let books = [];

    // 1. Try Vercel Serverless API first (/api/yes24)
    try {
      const apiUrl = `/api/yes24?query=${encodeURIComponent(trimmed)}`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.books) && data.books.length > 0) {
          books = data.books.map(b => this.normalizeBook(b));
          if (books.length >= 1) {
            return books;
          }
        }
      }
    } catch (e) {
      console.warn('Vercel YES24 API endpoint unavailable, attempting client-side multi-provider search:', e);
    }

    // 2. Client-Side Google Books API (Returns up to 20 Korean books with ISBNs & covers)
    try {
      const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(trimmed)}&maxResults=20`;
      const gRes = await fetch(gUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          for (const item of gData.items) {
            const info = item.volumeInfo || {};
            const title = info.title || '';
            const isbns = info.industryIdentifiers || [];
            const isbn13Obj = isbns.find(i => i.type === 'ISBN_13') || isbns[0] || {};
            const isbn = isbn13Obj.identifier || '';
            const cover = info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '').replace('http:', 'https:') : '';

            if (title && !books.some(b => b.title.toLowerCase() === title.toLowerCase())) {
              books.push(this.normalizeBook({
                id: item.id || `gbook_${Date.now()}_${books.length}`,
                title,
                author: (info.authors || ['저자 미상']).join(', '),
                publisher: info.publisher || '',
                pubDate: info.publishedDate || '',
                isbn,
                price: '',
                category: this.detectCategory(info.categories, title, info.description),
                totalPages: info.pageCount || 280,
                cover,
                description: info.description || '',
                link: `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(isbn || title)}`
              }));
            }
          }
        }
      }
    } catch (gErr) {
      console.warn('Client Google Books API warning:', gErr);
    }

    // 3. Client-Side OpenLibrary API (for English, Science, Mathematics and International books)
    if (books.length < 5) {
      try {
        const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=15`;
        const olRes = await fetch(olUrl);
        if (olRes.ok) {
          const olData = await olRes.json();
          if (olData.docs && olData.docs.length > 0) {
            for (const doc of olData.docs) {
              const title = doc.title || '';
              const isbn = doc.isbn ? doc.isbn[0] : '';
              if (title && !books.some(b => b.title.toLowerCase() === title.toLowerCase())) {
                books.push(this.normalizeBook({
                  id: doc.key || `ol_${Date.now()}_${books.length}`,
                  title,
                  author: (doc.author_name || ['저자 미상']).join(', '),
                  publisher: (doc.publisher || [''])[0] || '',
                  pubDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
                  isbn,
                  price: '',
                  category: this.detectCategory([], title, ''),
                  totalPages: doc.number_of_pages_median || 320,
                  cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
                  description: '',
                  link: `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(isbn || title)}`
                }));
              }
            }
          }
        }
      } catch (olErr) {
        console.warn('OpenLibrary API warning:', olErr);
      }
    }

    // 4. Instant Korean Reference Book Catalog matching for offline / rate-limit resilience
    const localMatches = this.findFromLocalCatalog(trimmed);
    for (const lb of localMatches) {
      if (!books.some(b => b.title.toLowerCase().includes(lb.title.toLowerCase()) || (lb.isbn && b.isbn === lb.isbn))) {
        books.unshift(this.normalizeBook(lb));
      }
    }

    return books.slice(0, 20);
  }

  static detectCategory(categories = [], title = '', description = '') {
    const text = ((categories || []).join(' ') + ' ' + title + ' ' + (description || '')).toLowerCase();
    if (text.includes('math') || text.includes('comput') || text.includes('engin') || text.includes('수학') || text.includes('공학') || text.includes('미적분') || text.includes('알고리즘') || text.includes('코드') || text.includes('프로그래밍')) {
      return '수학/공학';
    } else if (text.includes('sci') || text.includes('과학') || text.includes('물리') || text.includes('우주') || text.includes('생물') || text.includes('코스모스') || text.includes('화학')) {
      return '자연과학';
    } else if (text.includes('phil') || text.includes('hist') || text.includes('인문') || text.includes('철학') || text.includes('역사') || text.includes('사상')) {
      return '인문/철학';
    } else if (text.includes('econ') || text.includes('busin') || text.includes('경제') || text.includes('경영') || text.includes('투자') || text.includes('주식') || text.includes('돈')) {
      return '경제/경영';
    } else if (text.includes('fic') || text.includes('novel') || text.includes('소설') || text.includes('문학') || text.includes('에세이') || text.includes('시집')) {
      return '문학/소설';
    }
    return '기타';
  }

  static normalizeBook(raw) {
    const category = raw.category || this.detectCategory([], raw.title, raw.description);
    const spineColors = ['#8B2635', '#2E5266', '#1E3F20', '#6E44FF', '#D97724', '#3D348B', '#0E443B', '#7A306C'];
    const spineColor = raw.spineColor || spineColors[Math.abs(hashString(raw.title || 'book')) % spineColors.length];

    return {
      id: raw.id || `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: raw.title || '제목 없음',
      author: raw.author || '저자 미상',
      publisher: raw.publisher || '',
      pubDate: raw.pubDate || '',
      isbn: raw.isbn || '',
      price: raw.price || '',
      category,
      spineColor,
      totalPages: parseInt(raw.totalPages || raw.pageCount, 10) || 300,
      currentPage: raw.currentPage || 0,
      rating: raw.rating || 5.0,
      status: raw.status || 'reading',
      cover: raw.cover || '',
      description: raw.description || '',
      link: raw.link || (raw.isbn ? `https://www.yes24.com/Product/Search?domain=BOOK&query=${raw.isbn}` : `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(raw.title)}`),
      toc: raw.toc || '',
      quotes: raw.quotes || [],
      review: raw.review || '',
      writingDrafts: raw.writingDrafts || []
    };
  }

  static findFromLocalCatalog(query) {
    const q = query.toLowerCase().trim();
    const catalog = [
      {
        title: "미적분학의 힘 (Infinite Powers)",
        author: "스티븐 스트로가츠",
        publisher: "해나무",
        pubDate: "2020-07-20",
        isbn: "9788956058986",
        price: "22,000원",
        category: "수학/공학",
        totalPages: 480,
        cover: "https://image.yes24.com/goods/91361280/XL",
        description: "미적분학이 어떻게 현대 문명과 인공지능, GPS, 우주선을 탄생시켰는지 흥미진진하게 밝히는 수학 명저.",
        link: "https://www.yes24.com/Product/Goods/91361280"
      },
      {
        title: "미적분의 쓸모",
        author: "한화택",
        publisher: "더퀘스트",
        pubDate: "2021-07-15",
        isbn: "9791140700234",
        price: "18,000원",
        category: "수학/공학",
        totalPages: 288,
        cover: "https://image.yes24.com/goods/102604085/XL",
        description: "로켓 발사부터 인공지능 알고리즘까지 일상을 지배하는 미적분의 놀라운 원리.",
        link: "https://www.yes24.com/Product/Goods/102604085"
      },
      {
        title: "스튜어트 미분적분학 (Calculus)",
        author: "James Stewart",
        publisher: "북스힐",
        pubDate: "2021-03-01",
        isbn: "9791159713439",
        price: "49,000원",
        category: "수학/공학",
        totalPages: 1184,
        cover: "https://image.yes24.com/goods/97967916/XL",
        description: "전 세계 이공계 대학생들이 가장 많이 읽는 미적분학의 표준 교과서.",
        link: "https://www.yes24.com/Product/Goods/97967916"
      },
      {
        title: "코스모스 (Cosmos)",
        author: "칼 세이건",
        publisher: "사이언스북스",
        pubDate: "2006-12-20",
        isbn: "9788983711892",
        price: "23,400원",
        category: "자연과학",
        totalPages: 719,
        cover: "https://image.yes24.com/goods/2312211/XL",
        description: "인류 역사상 가장 위대한 과학 교양서. 칼 세이건이 펼쳐 보이는 웅대한 우주의 파노라마.",
        link: "https://www.yes24.com/Product/Goods/2312211"
      },
      {
        title: "클린 코드 (Clean Code)",
        author: "로버트 C. 마틴",
        publisher: "인사이트",
        pubDate: "2013-12-24",
        isbn: "9788966260959",
        price: "33,000원",
        category: "수학/공학",
        totalPages: 584,
        cover: "https://image.yes24.com/goods/11681152/XL",
        description: "애자일 소프트웨어 장인 정신의 정수. 읽기 쉽고 견고한 명품 소프트웨어를 작성하는 방법.",
        link: "https://www.yes24.com/Product/Goods/11681152"
      },
      {
        title: "클린 아키텍처 (Clean Architecture)",
        author: "로버트 C. 마틴",
        publisher: "인사이트",
        pubDate: "2019-08-20",
        isbn: "9788966262472",
        price: "32,000원",
        category: "수학/공학",
        totalPages: 432,
        cover: "https://image.yes24.com/goods/77283734/XL",
        description: "소프트웨어 구조와 설계의 핵심 원칙. SOLID 및 클린 아키텍처 완벽 해설서.",
        link: "https://www.yes24.com/Product/Goods/77283734"
      },
      {
        title: "선형대수와 그 응용 (Linear Algebra)",
        author: "Gilbert Strang",
        publisher: "한빛아카데미",
        pubDate: "2020-01-06",
        isbn: "9791156644675",
        price: "35,000원",
        category: "수학/공학",
        totalPages: 600,
        cover: "https://image.yes24.com/goods/85937402/XL",
        description: "MIT 길버트 스트랭 교수의 명강의. 인공지능과 데이터 사이언스를 위한 선형대수학 필수서.",
        link: "https://www.yes24.com/Product/Goods/85937402"
      },
      {
        title: "사피엔스 (Sapiens)",
        author: "유발 하라리",
        publisher: "김영사",
        pubDate: "2015-11-24",
        isbn: "9788934972464",
        price: "22,000원",
        category: "인문/철학",
        totalPages: 636,
        cover: "https://image.yes24.com/goods/23030284/XL",
        description: "유인원에서 사이보그까지, 인간 역사의 대담하고 깊은 통찰.",
        link: "https://www.yes24.com/Product/Goods/23030284"
      },
      {
        title: "이기적 유전자 (The Selfish Gene)",
        author: "리처드 도킨스",
        publisher: "을유문화사",
        pubDate: "2018-10-20",
        isbn: "9788932473901",
        price: "20,000원",
        category: "자연과학",
        totalPages: 552,
        cover: "https://image.yes24.com/goods/65324543/XL",
        description: "진화론의 새로운 패러다임을 연 현대 과학의 고전.",
        link: "https://www.yes24.com/Product/Goods/65324543"
      },
      {
        title: "돈의 심리학",
        author: "모건 하우절",
        publisher: "인플루엔셜",
        pubDate: "2021-01-13",
        isbn: "9791168340770",
        price: "19,800원",
        category: "경제/경영",
        totalPages: 424,
        cover: "https://image.yes24.com/goods/96542661/XL",
        description: "부의 창출과 투자의 비밀을 심리학적 통찰로 밝혀낸 최고의 금융 도서.",
        link: "https://www.yes24.com/Product/Goods/96542661"
      }
    ];

    return catalog.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.publisher.toLowerCase().includes(q) ||
      (b.isbn && b.isbn.includes(q))
    );
  }
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
