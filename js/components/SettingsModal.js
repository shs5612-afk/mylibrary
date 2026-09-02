/**
 * Settings Modal Component (Refactored - DIP)
 * 환경 설정 리포지토리를 주입받아 설정 변경 처리
 */

export class SettingsModal {
  /**
   * @param {Object} params
   * @param {import('../repositories/SettingsRepository.js').SettingsRepository} params.settingsRepo
   * @param {Function} params.onSettingsUpdated
   * @param {Function} params.onResetSampleData
   */
  constructor({ settingsRepo, onSettingsUpdated, onResetSampleData }) {
    this.modalEl = document.getElementById('modalSettings');
    this.settingsRepo = settingsRepo;
    this.onSettingsUpdated = onSettingsUpdated;
    this.onResetSampleData = onResetSampleData;
    this.init();
  }

  init() {
    const form = document.getElementById('formSettings');
    const providerSelect = document.getElementById('settingAiProvider');
    const geminiGroup = document.getElementById('geminiKeyGroup');
    const openaiGroup = document.getElementById('openaiKeyGroup');

    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    providerSelect.addEventListener('change', () => {
      if (providerSelect.value === 'gemini') {
        geminiGroup.classList.remove('hidden');
        openaiGroup.classList.add('hidden');
      } else {
        openaiGroup.classList.remove('hidden');
        geminiGroup.classList.add('hidden');
      }
    });

    document.querySelectorAll('input[name="appTheme"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.body.setAttribute('data-theme', e.target.value);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const selectedTheme = document.querySelector('input[name="appTheme"]:checked')?.value || 'oak';
      const updated = {
        appTheme: selectedTheme,
        aiProvider: document.getElementById('settingAiProvider').value,
        geminiModel: document.getElementById('settingGeminiModel')?.value || 'gemini-3.7-flash',
        geminiApiKey: document.getElementById('settingGeminiKey').value.trim(),
        openAiApiKey: document.getElementById('settingOpenAiKey').value.trim(),
        gdriveClientId: document.getElementById('settingGDriveClientId').value.trim(),
        yearlyGoal: parseInt(document.getElementById('settingYearlyGoal').value, 10) || 30
      };

      this.settingsRepo.saveSettings(updated);

      if (this.onSettingsUpdated) {
        this.onSettingsUpdated(updated);
      }

      document.body.setAttribute('data-theme', selectedTheme);
      this.close();
      alert('환경 설정이 성공적으로 저장되었습니다.');
    });

    const btnReset = document.getElementById('btnResetSampleData');
    btnReset.addEventListener('click', () => {
      if (confirm('서재 데이터를 기본 샘플 도서(미적분학의 힘, 코스모스 등)로 초기화하시겠습니까?')) {
        if (this.onResetSampleData) this.onResetSampleData();
        this.close();
      }
    });

    document.querySelectorAll('[data-close="modalSettings"]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });
  }

  open() {
    const settings = this.settingsRepo.getSettings();

    const themeRadio = document.querySelector(`input[name="appTheme"][value="${settings.appTheme || 'oak'}"]`);
    if (themeRadio) themeRadio.checked = true;

    document.getElementById('settingAiProvider').value = settings.aiProvider || 'gemini';
    const modelSelect = document.getElementById('settingGeminiModel');
    if (modelSelect) modelSelect.value = settings.geminiModel || 'gemini-3.7-flash';
    document.getElementById('settingGeminiKey').value = settings.geminiApiKey || '';
    document.getElementById('settingOpenAiKey').value = settings.openAiApiKey || '';
    document.getElementById('settingGDriveClientId').value = settings.gdriveClientId || '';
    document.getElementById('settingYearlyGoal').value = settings.yearlyGoal || 30;

    document.getElementById('settingAiProvider').dispatchEvent(new Event('change'));
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}
