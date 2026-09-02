/**
 * Backup Serializer & Validator
 * 서재 데이터 직렬화 및 역직렬화 무결성 검증 (SRP 준수)
 */

export class BackupSerializer {
  static serialize(books, settings) {
    const backup = {
      version: '1.0.0',
      appName: 'My Literary Haven',
      exportedAt: new Date().toISOString(),
      books: books || [],
      settings: settings || {}
    };
    return JSON.stringify(backup, null, 2);
  }

  static deserialize(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('백업 데이터 문자열이 유효하지 않습니다.');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('JSON 구문 분석 오류: 유효한 JSON 파일이 아닙니다.');
    }

    if (!parsed.books || !Array.isArray(parsed.books)) {
      throw new Error('유효한 서재 백업 데이터 포맷이 아닙니다 (books 필드 누락).');
    }

    return {
      success: true,
      books: parsed.books,
      settings: parsed.settings || null,
      count: parsed.books.length
    };
  }
}
