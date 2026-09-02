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

  const { query, isbn } = req.query;
  const searchTerm = (isbn || query || '').trim();

  if (!searchTerm) {
    return res.status(400).json({ success: false, error: 'Search term or ISBN is required' });
  }

  const books = [];

  // 1. Attempt YES24 Scraping (Support both domain=ALL & domain=BOOK)
  try {
    const encoded = encodeURIComponent(searchTerm);
    const searchUrls = [
      `https://www.yes24.com/Product/Search?domain=ALL&query=${encoded}`,
      `https://www.yes24.com/Product/Search?domain=BOOK&query=${encoded}`
    ];

    for (const searchUrl of searchUrls) {
      if (books.length >= 5) break;

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.yes24.com/'
        }
      });

      if (response.ok) {
        const html = await response.text();

        // Pattern A: <li data-goods-no="..."> or <div class="itemUnit"> or <div class="item_info">
        const itemMatches = html.match(/<li\s+data-goods-no="(\d+)"[\s\S]*?<\/li>/gi) ||
                            html.match(/<div\s+class="itemUnit"[\s\S]*?<\/div>\s*<\/li>/gi) ||
                            html.match(/<div\s+class="item_info"[\s\S]*?<\/div>/gi) || [];

        for (const itemHtml of itemMatches) {
          if (books.length >= 20) break;

          // Goods No
          const goodsNoMatch = /data-goods-no="(\d+)"/i.exec(itemHtml) ||
                               /href="\/Product\/Goods\/(\d+)"/i.exec(itemHtml) ||
                               /goods\/(\d+)/i.exec(itemHtml);
          const goodsNo = goodsNoMatch ? goodsNoMatch[1] : '';

          // Title
          const titleMatch = /<a\s+class="gd_name"[^>]*>([\s\S]*?)<\/a>/i.exec(itemHtml) ||
                             /<strong\s+class="item_name"[^>]*>([\s\S]*?)<\/strong>/i.exec(itemHtml);
          let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Subtitle
          const subMatch = /<a\s+class="gd_nameE"[^>]*>([\s\S]*?)<\/a>/i.exec(itemHtml);
          const subtitle = subMatch ? subMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          if (subtitle) title = `${title} - ${subtitle}`;

          // Author
          const authMatch = /<span\s+class="info_auth"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml) ||
                            /<span\s+class="authPub_info"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          const author = authMatch ? authMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '저자 미상';

          // Publisher
          const pubMatch = /<span\s+class="info_pub"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          const publisher = pubMatch ? pubMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Pub Date
          const dateMatch = /<span\s+class="info_date"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
          const pubDate = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          // Price
          const priceMatch = /<em\s+class="yes_b">([\d,]+)<\/em>/i.exec(itemHtml) ||
                             /class="txt_price"[^>]*>([\d,]+)원/i.exec(itemHtml);
          const price = priceMatch ? `${priceMatch[1]}원` : '';

          // Cover Image URL
          const imgMatch = /data-original="([^"]+)"/i.exec(itemHtml) ||
                           /src="(https:\/\/image\.yes24\.com\/goods\/[^"]+)"/i.exec(itemHtml) ||
                           /src="([^"]+)"[^>]*class="lazy"/i.exec(itemHtml);
          let cover = imgMatch ? imgMatch[1] : '';
          if (cover.startsWith('//')) cover = 'https:' + cover;
          if (cover) {
            cover = cover.replace('/M/', '/XL/').replace('/S/', '/XL/');
          }

          // Description
          const descMatch = /<div\s+class="info_read"[^>]*>([\s\S]*?)<\/div>/i.exec(itemHtml);
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
    console.warn('YES24 live HTML parsing warning:', err);
  }

  // 2. Fallback / Augment with Google Books API if fewer than 6 books found
  if (books.length < 6) {
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
