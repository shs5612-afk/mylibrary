/**
 * Google Drive Backup Modal Component (Refactored - ISP & DIP)
 * 구글 드라이브 원격 서비스와 로컬 파일 백업 서비스를 주입받아 제어
 */

export class GDriveBackupModal {
  /**
   * @param {Object} params
   * @param {import('../services/cloud/GoogleDriveService.js').GoogleDriveService} params.gdriveService
   * @param {typeof import('../services/cloud/LocalFileBackupService.js').LocalFileBackupService} params.localBackupService
   * @param {typeof import('../utils/backupSerializer.js').BackupSerializer} params.serializer
   * @param {Function} params.getDataToBackup
   * @param {Function} params.onRestoreData
   */
  constructor({ gdriveService, localBackupService, serializer, getDataToBackup, onRestoreData }) {
    this.modalEl = document.getElementById('modalGDrive');
    this.gdriveService = gdriveService;
    this.localBackupService = localBackupService;
    this.serializer = serializer;
    this.getDataToBackup = getDataToBackup;
    this.onRestoreData = onRestoreData;
    this.init();
  }

  init() {
    // 1. GDrive OAuth Connection
    const btnAuth = document.getElementById('btnGDriveAuthorize');
    const authInfo = document.getElementById('gdriveAuthInfo');

    btnAuth.addEventListener('click', () => {
      this.gdriveService.init((status) => {
        if (status.authorized) {
          authInfo.innerHTML = '<span class="dot-indicator green"></span> 구글 드라이브 계정 연결됨 (백업 가능)';
          btnAuth.textContent = '계정 재연결';
        }
      });
      this.gdriveService.requestAuth();
    });

    // 2. Google Drive Cloud Backup
    const btnBackup = document.getElementById('btnGDriveBackupNow');
    btnBackup.addEventListener('click', async () => {
      btnBackup.disabled = true;
      btnBackup.innerHTML = '<i data-lucide="loader-2" class="spin"></i> 업로드 중...';
      if (window.lucide) window.lucide.createIcons();

      const data = this.getDataToBackup ? this.getDataToBackup() : { books: [], settings: {} };
      const jsonString = this.serializer.serialize(data.books, data.settings);

      const res = await this.gdriveService.uploadBackup(jsonString);
      btnBackup.disabled = false;
      btnBackup.innerHTML = '<i data-lucide="upload-cloud"></i> Google Drive에 원클릭 백업 저장';
      if (window.lucide) window.lucide.createIcons();

      if (res.success) {
        alert(`Google Drive에 서재 백업이 성공적으로 저장되었습니다!\n파일명: ${res.fileName}`);
      } else {
        alert(res.error || '백업 저장 중 오류가 발생했습니다.');
      }
    });

    // 3. Google Drive List & Restore
    const btnRestoreList = document.getElementById('btnGDriveRestoreList');
    btnRestoreList.addEventListener('click', async () => {
      const files = await this.gdriveService.listBackups();
      if (files.length === 0) {
        alert('Google Drive에 저장된 MyLibrary 백업 파일이 없거나 로그인이 필요합니다.');
        return;
      }

      const fileChoices = files.map((f, i) => `${i + 1}. ${f.name} (${new Date(f.createdTime).toLocaleString()})`).join('\n');
      const selection = prompt(`복원할 백업 파일 번호를 입력하세요:\n\n${fileChoices}`, '1');

      if (selection) {
        const idx = parseInt(selection, 10) - 1;
        if (files[idx]) {
          const res = await this.gdriveService.downloadBackup(files[idx].id);
          if (res.success) {
            const parsed = this.serializer.deserialize(res.content);
            if (this.onRestoreData) this.onRestoreData(parsed);
            alert(`총 ${parsed.count}권의 도서 및 독서기록이 Google Drive에서 성공적으로 복원되었습니다!`);
            this.close();
          } else {
            alert(`복원 실패: ${res.error}`);
          }
        }
      }
    });

    // 4. Local JSON Download
    const btnDownloadLocal = document.getElementById('btnDownloadJsonBackup');
    btnDownloadLocal.addEventListener('click', () => {
      const data = this.getDataToBackup ? this.getDataToBackup() : { books: [], settings: {} };
      const jsonString = this.serializer.serialize(data.books, data.settings);
      this.localBackupService.downloadJson(jsonString);
      alert('백업 JSON 파일이 다운로드되었습니다. Google Drive 폴더에 보관해 두시면 언제든 복원할 수 있습니다.');
    });

    // 5. Local JSON File Upload Restore
    const inputRestore = document.getElementById('inputRestoreJson');
    inputRestore.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (confirm(`선택한 백업 파일("${file.name}")로 서재를 복원하시겠습니까? 기존 데이터가 덮어씌워집니다.`)) {
        const fileRes = await this.localBackupService.readLocalFile(file);
        if (fileRes.success) {
          try {
            const parsed = this.serializer.deserialize(fileRes.content);
            if (this.onRestoreData) this.onRestoreData(parsed);
            alert(`총 ${parsed.count}권의 도서 및 독서기록이 성공적으로 복원되었습니다!`);
            this.close();
          } catch (err) {
            alert(`복원 실패: ${err.message}`);
          }
        } else {
          alert(fileRes.error);
        }
      }
      inputRestore.value = '';
    });

    document.querySelectorAll('[data-close="modalGDrive"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open() {
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}
