/**
 * Local File Backup & Restore Service
 * 브라우저 로컬 파일 다운로드 및 업로드 전담 계층 (ISP 준수)
 */

export class LocalFileBackupService {
  static downloadJson(jsonContent, defaultFileName = 'MyLibrary_Backup.json') {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = defaultFileName.replace('.json', `_${dateStr}.json`);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async readLocalFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ success: true, content: e.target.result });
      };
      reader.onerror = () => resolve({ success: false, error: '파일 읽기에 실패했습니다.' });
      reader.readAsText(file);
    });
  }
}
