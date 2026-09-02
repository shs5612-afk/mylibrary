/**
 * Google Drive Backup & Sync Service
 * Google Identity Services (GSI) OAuth2 & Drive API v3 + Local JSON 백업
 */

import { LibraryStorage } from './storage.js';

export class GDriveService {
  static tokenClient = null;
  static accessToken = null;
  static isGapiLoaded = false;
  static isGsiLoaded = false;

  /**
   * Initialize Google Drive Client
   * @param {string} clientId 
   * @param {Function} onStatusChange 
   */
  static init({ clientId, onStatusChange }) {
    const cid = clientId || '1047587989524-sample.apps.googleusercontent.com';

    // Check if GSI is available
    if (window.google?.accounts?.oauth2) {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata',
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              this.accessToken = tokenResponse.access_token;
              if (onStatusChange) onStatusChange({ authorized: true, token: this.accessToken });
            }
          }
        });
        this.isGsiLoaded = true;
      } catch (e) {
        console.warn('GDrive init error:', e);
      }
    }
  }

  /**
   * Request Google OAuth Authorization
   */
  static requestAuth() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert('Google Identity Services SDK를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  /**
   * Backup current library data directly to Google Drive
   * @returns {Promise<{success: boolean, fileId?: string, error?: string}>}
   */
  static async backupToDrive() {
    if (!this.accessToken) {
      // Prompt auth
      this.requestAuth();
      return { success: false, error: 'Google 계정 로그인이 필요합니다. 연결 창을 확인해 주세요.' };
    }

    try {
      const backupData = LibraryStorage.exportFullBackup();
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `MyLibrary_Backup_${dateStr}.json`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        description: '나만의 개인 서재 및 독서기록 자동 백업'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([backupData], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: form
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || `Google Drive upload failed: ${res.statusText}`);
      }

      const fileData = await res.json();
      return { success: true, fileId: fileData.id, fileName };
    } catch (e) {
      console.error('GDrive backup error:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * List backups from Google Drive
   */
  static async listDriveBackups() {
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
      console.error('List backups error:', e);
      return [];
    }
  }

  /**
   * Restore from a specific Google Drive file ID
   */
  static async restoreFromDriveFile(fileId) {
    if (!this.accessToken) return { success: false, error: '인증이 필요합니다.' };

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (!res.ok) throw new Error('Failed to download backup file');
      const text = await res.text();
      return LibraryStorage.importFullBackup(text);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * Download Local JSON Backup File
   */
  static downloadLocalBackup() {
    const backupJson = LibraryStorage.exportFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MyLibrary_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Restore from Local File input
   */
  static async restoreFromLocalFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const result = LibraryStorage.importFullBackup(content);
        resolve(result);
      };
      reader.onerror = () => resolve({ success: false, error: '파일 읽기 실패' });
      reader.readAsText(file);
    });
  }
}
