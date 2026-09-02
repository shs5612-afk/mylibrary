/**
 * Google Drive Cloud Backup Service
 * Google Drive API v3 및 Google Identity Services(GSI) 전담 계층 (ISP 준수)
 */

export class GoogleDriveService {
  constructor(clientId) {
    this.clientId = clientId || '1047587989524-sample.apps.googleusercontent.com';
    this.tokenClient = null;
    this.accessToken = null;
  }

  setClientId(clientId) {
    if (clientId) this.clientId = clientId;
  }

  init(onStatusChange) {
    if (window.google?.accounts?.oauth2) {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              this.accessToken = tokenResponse.access_token;
              if (onStatusChange) onStatusChange({ authorized: true, token: this.accessToken });
            }
          }
        });
      } catch (e) {
        console.warn('GoogleDriveService init error:', e);
      }
    }
  }

  requestAuth() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert('Google Identity Services SDK를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  async uploadBackup(backupJsonString) {
    if (!this.accessToken) {
      this.requestAuth();
      return { success: false, error: 'Google 계정 로그인이 필요합니다. 연결 창을 확인해 주세요.' };
    }

    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `MyLibrary_Backup_${dateStr}.json`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        description: '나만의 개인 서재 및 독서기록 자동 백업'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([backupJsonString], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        body: form
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Google Drive upload failed: ${res.statusText}`);
      }

      const fileData = await res.json();
      return { success: true, fileId: fileData.id, fileName };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async listBackups() {
    if (!this.accessToken) {
      this.requestAuth();
      return [];
    }

    try {
      const query = encodeURIComponent("name contains 'MyLibrary_Backup_' and trashed = false");
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (!res.ok) throw new Error('Failed to list backups');
      const data = await res.json();
      return data.files || [];
    } catch (e) {
      return [];
    }
  }

  async downloadBackup(fileId) {
    if (!this.accessToken) return { success: false, error: '인증이 필요합니다.' };

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (!res.ok) throw new Error('Failed to download backup file');
      const text = await res.text();
      return { success: true, content: text };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
