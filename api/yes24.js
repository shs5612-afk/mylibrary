export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { query, q, isbn, goodsNo } = req.query || {};
  const searchQuery = query || q;

  // 0. Detail Goods Inquiry Mode (Fetch full TOC & Book Intro by goodsNo)
  if (goodsNo) {
    try {
      const detailUrl = `https://www.yes24.com/Product/Goods/${encodeURIComponent(goodsNo)}`;
      const resDetail = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': 'https://www.yes24.com/'
        }
      });

      if (resDetail.ok) {
        const buffer = await resDetail.arrayBuffer();
        let html = '';
        try {
          html = new TextDecoder('utf-8').decode(buffer);
        } catch (_) {
          html = new TextDecoder('euc-kr').decode(buffer);
        }

        // Extract TOC from <div id="infoset_toc">...<textarea class="txtContentText">...</textarea>
        const tocMatch = /<div[^>]*id=["']infoset_toc["'][\s\S]*?<textarea[^>]*class=["']txtContentText["'][^>]*>([\s\S]*?)<\/textarea>/i.exec(html) ||
                         /<div[^>]*id=["']infoset_toc["'][\s\S]*?<div[^>]*class=["']infoWrap_txt["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
        let toc = '';
        if (tocMatch) {
          toc = tocMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
        }

        // Extract Intro from <div id="infoset_introduce">
        const introMatch = /<div[^>]*id=["']infoset_introduce["'][\s\S]*?<textarea[^>]*class=["']txtContentText["'][^>]*>([\s\S]*?)<\/textarea>/i.exec(html);
        let description = '';
        if (introMatch) {
          description = introMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
        }

        return res.status(200).json({
          success: true,
          goodsNo,
          toc,
          description
        });
      }
    } catch (dErr) {
      console.warn('YES24 detail TOC fetch error:', dErr.message);
    }
  }

  const searchTerm = (isbn || searchQuery || '').trim();

  if (!searchTerm) {
    return res.status(400).json({ success: false, error: 'Search term or ISBN is required' });
  }

  const books = [];

  // 1. YES24 Live Scraping with Session Warm-up & Modern DOM Parsing
  try {
    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': 'https://www.yes24.com/'
    };

    // Step A: Warm up session cookie to bypass redirect to Main/default.aspx
    let cookieHeader = '';
    try {
      const warmRes = await fetch('https://www.yes24.com/Main/default.aspx', { headers: baseHeaders });
      const setCookie = warmRes.headers.get('set-cookie');
      if (setCookie) {
        cookieHeader = setCookie.split(',').map(c => c.split(';')[0]).join('; ');
      }
    } catch (cookieErr) {
      console.warn('YES24 session warm-up error:', cookieErr.message);
    }

    const reqHeaders = { ...baseHeaders };
    if (cookieHeader) reqHeaders['Cookie'] = cookieHeader;

    const encoded = encodeURIComponent(searchTerm);
    const searchUrls = [
      `https://www.yes24.com/Product/Search?domain=BOOK&query=${encoded}`,
      `https://www.yes24.com/Product/Search?domain=ALL&query=${encoded}`
    ];

    for (const searchUrl of searchUrls) {
      if (books.length >= 8) break;

      const response = await fetch(searchUrl, { headers: reqHeaders });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        let html = '';
        try {
          html = new TextDecoder('utf-8').decode(buffer);
          if (!html.includes('yesSchList') && !html.includes('goods_name')) {
            html = new TextDecoder('euc-kr').decode(buffer);
          }
        } catch (_) {
          html = new TextDecoder('utf-8').decode(buffer);
        }

        // Match individual product list items (e.g. <li ... data-goods-no="...">)
        const itemMatches = html.match(/<li[^>]*data-goods-no="(\d+)"[^>]*>[\s\S]*?<\/li>/gi) ||
                            html.match(/<div\s+class="itemUnit"[\s\S]*?<\/div>\s*<\/li>/gi) || [];

        for (const itemHtml of itemMatches) {
          if (books.length >= 20) break;

          // Goods No
          const goodsNoMatch = /data-goods-no="(\d+)"/i.exec(itemHtml) ||
                               /href="\/[Pp]roduct\/[Gg]oods\/(\d+)"/i.exec(itemHtml);
          const goodsNo = goodsNoMatch ? goodsNoMatch[1] : '';

          // Title
          const titleMatch = /<a\s+class="gd_name"[^>]*>([\s\S]*?)<\/a>/i.exec(itemHtml) ||
                             /<strong\s+class="item_name"[^>]*>([\s\S]*?)<\/strong>/i.exec(itemHtml);
          let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Subtitle
          const subMatch = /<(?:a|span)\s+class="gd_nameE"[^>]*>([\s\S]*?)<\/(?:a|span)>/i.exec(itemHtml);
          const subtitle = subMatch ? subMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          if (subtitle) title = `${title} - ${subtitle}`;

          // Author
          const authMatch = /<span\s+class="[^"]*info_auth"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          let author = '저자 미상';
          if (authMatch) {
            author = authMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').replace(/저\b/g, '').trim();
          }

          // Publisher
          const pubMatch = /<span\s+class="[^"]*info_pub"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          const publisher = pubMatch ? pubMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Pub Date
          const dateMatch = /<span\s+class="[^"]*info_date"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          const pubDate = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Price
          const priceMatch = /<em\s+class="yes_b">([\d,]+)<\/em>/i.exec(itemHtml) ||
                             /class="txt_price"[^>]*>([\d,]+)원/i.exec(itemHtml);
          const price = priceMatch ? `${priceMatch[1]}원` : '';

          // Cover Image URL (Upgraded to high-res XL)
          const imgMatch = /data-original="([^"]+)"/i.exec(itemHtml) ||
                           /src="(https:\/\/image\.yes24\.com\/goods\/[^"]+)"/i.exec(itemHtml) ||
                           /src="([^"]+)"[^>]*class="lazy"/i.exec(itemHtml);
          let cover = imgMatch ? imgMatch[1] : '';
          if (cover.startsWith('//')) cover = 'https:' + cover;
          if (cover) {
            cover = cover.replace(/\/M\//i, '/XL/').replace(/\/L\//i, '/XL/').replace(/\/S\//i, '/XL/');
          }

          // Description
          const descMatch = /<div\s+class="info_read"[^>]*>([\s\S]*?)<\/div>/i.exec(itemHtml) ||
                            /<p\s+class="item_desc"[^>]*>([\s\S]*?)<\/p>/i.exec(itemHtml);
          const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

          if (title && !books.some(b => b.title === title || (goodsNo && b.goodsNo === goodsNo))) {
            books.push({
              id: goodsNo || `yes24_${Date.now()}_${books.length}`,
              goodsNo,
              title,
              author,
              publisher,
              pubDate,
              price,
              cover,
              description,
              totalPages: 320,
              link: goodsNo ? `https://www.yes24.com/Product/Goods/${goodsNo}` : `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(title)}`,
              isbn: /^\d{10,13}$/.test(searchTerm) ? searchTerm : ''
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('YES24 live HTML parsing error/warning:', err);
  }

  // 2. Fallback / Augment with Google Books API if fewer than 5 books found
  if (books.length < 5) {
    try {
      const gEncoded = encodeURIComponent(searchTerm);
      const gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gEncoded}&maxResults=15&langRestrict=ko`);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.items && gData.items.length > 0) {
          for (const item of gData.items) {
            const info = item.volumeInfo || {};
            const title = info.title || '';
            const isbns = info.industryIdentifiers || [];
            const isbn13 = (isbns.find(i => i.type === 'ISBN_13') || isbns[0] || {}).identifier || '';

            if (title && !books.some(b => b.title.toLowerCase() === title.toLowerCase())) {
              const cover = info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail || '').replace('http:', 'https:') : '';
              books.push({
                id: item.id,
                title,
                author: (info.authors || ['저자 미상']).join(', '),
                publisher: info.publisher || '',
                pubDate: info.publishedDate || '',
                cover,
                description: info.description || '',
                totalPages: info.pageCount || 280,
                price: '',
                isbn: isbn13,
                link: `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(isbn13 || title)}`
              });
            }
          }
        }
      }
    } catch (gErr) {
      console.warn('Google Books fallback warning:', gErr);
    }
  }

  // 3. Fallback / Augment with OpenLibrary if still fewer than 5 books
  if (books.length < 5) {
    try {
      const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=10`);
      if (olRes.ok) {
        const olData = await olRes.json();
        if (olData.docs && olData.docs.length > 0) {
          for (const doc of olData.docs) {
            const title = doc.title || '';
            const isbn = doc.isbn ? doc.isbn[0] : '';
            if (title && !books.some(b => b.title.toLowerCase() === title.toLowerCase())) {
              books.push({
                id: doc.key || `ol_${Date.now()}_${books.length}`,
                title,
                author: (doc.author_name || ['저자 미상']).join(', '),
                publisher: (doc.publisher || [''])[0] || '',
                pubDate: doc.first_publish_year ? String(doc.first_publish_year) : '',
                cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
                description: '',
                totalPages: doc.number_of_pages_median || 300,
                price: '',
                isbn,
                link: `https://www.yes24.com/Product/Search?domain=BOOK&query=${encodeURIComponent(isbn || title)}`
              });
            }
          }
        }
      }
    } catch (olErr) {
      console.warn('OpenLibrary fallback warning:', olErr);
    }
  }

  return res.status(200).json({
    success: true,
    count: books.length,
    books
  });
}
