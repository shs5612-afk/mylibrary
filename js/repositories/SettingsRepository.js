/**
 * Settings Repository
 * 환경 설정 영속성 전담 계층 (SRP 준수)
 */

export const DEFAULT_SETTINGS = {
  appTheme: 'oak',
  aiProvider: 'gemini',
  geminiModel: 'gemini-3.7-flash',
  geminiApiKey: '',
  openAiApiKey: '',
  openAiModel: 'gpt-4o-mini',
  gdriveClientId: '',
  yearlyGoal: 30
};

export class SettingsRepository {
  constructor(storageKey = 'my_library_settings_v1') {
    this.storageKey = storageKey;
  }

  getSettings() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }
}
