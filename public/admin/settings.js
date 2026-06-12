// admin/settings.js — Super Admin settings as icon cards with dialog editors
(function initSettingsPage() {
  const cardsGrid = document.getElementById('settingsCardsGrid');

  let currentSettings = null;
  let networkInterfaces = [];
  let showNicSelector = false;

  const SETTINGS_HELP_TEXTS = {
    maxZipUploadMb: { title: 'حداکثر حجم ZIP', text: 'بزرگ‌ترین حجم فایل ZIP که می‌توانید آپلود کنید. اگر ماژول سنگین‌تر باشد، سرور خطای ۴۱۳ می‌دهد.' },
    portRangeStart: { title: 'شروع بازه پورت', text: 'کوچک‌ترین پورت برای تخصیص خودکار به ماژول‌های جدید.' },
    portRangeEnd: { title: 'پایان بازه پورت', text: 'بزرگ‌ترین پورت مجاز. باید از «شروع بازه» بزرگ‌تر باشد.' },
    cpu_limit: { title: 'CPU پیش‌فرض', text: 'سهم پردازنده برای ماژول جدید (مثلاً ۰.۵ یعنی نصف یک هسته).' },
    ram_limit_mb: { title: 'RAM پیش‌فرض', text: 'حافظه RAM (مگابایت) پیشنهادی wizard برای ماژول جدید.' },
    swap_limit_mb: { title: 'Swap پیش‌فرض', text: 'حافظه swap اضطراری (مگابایت).' },
    disk_iops: { title: 'Disk IOPS', text: 'محدودیت سرعت دیسک برای هر ماژول.' },
    net_mbps: { title: 'Network (Mbps)', text: 'سقف پهنای باند شبکه برای ماژول.' },
    maxConcurrentRunningModules: { title: 'حداکثر ماژول همزمان', text: 'چند ماژول هم‌زمان می‌توانند running باشند.' },
    logRetentionDays: { title: 'نگهداری لاگ', text: 'چند روز فایل‌های لاگ نگه داشته شوند.' },
    maxPackageCacheGb: { title: 'حداکثر کش پکیج', text: 'سقف فضای کش npm/pip/composer مشترک.' },
    dependencyInstallTimeoutSec: { title: 'تایم‌اوت نصب وابستگی', text: 'حداکثر زمان مجاز npm install یا pip install.' },
    uploadTempCleanupHours: { title: 'پاکسازی temp آپلود', text: 'فایل ZIP موقت چند ساعت بعد از آپلود پاک شود.' },
    logViewerMaxLines: { title: 'حداکثر خطوط log viewer', text: 'تعداد خطوط نمایش در دیالوگ مشاهده لاگ.' },
    autoRestartOnCrash: { title: 'راه‌اندازی مجدد خودکار', text: 'پس از crash، CMS تا سقف مجاز دوباره start می‌کند.' },
    autoRestartMaxAttemptsPerHour: { title: 'حداکثر تلاش در ساعت', text: 'سقف auto-restart در هر ساعت.' },
    packageInstallInterface: { title: 'رابط شبکه نصب پکیج', text: 'کارت شبکه برای npm/docker/git — مسیر دائمی Ubuntu عوض نمی‌شود.' },
    sessionTtlHours: { title: 'Session Super Admin', text: 'چند ساعت بعد از login، session ادمین منقضی شود.' },
    loginRateLimitPerMinute: { title: 'محدودیت login', text: 'حداکثر تلاش login در دقیقه — بیشتر خطای ۴۲۹.' },
    moduleManagerSessionTtlHours: { title: 'Session Module Manager', text: 'مدت session ورود با رمز ماژول.' },
    modulePasswordMaxAttempts: { title: 'حداکثر تلاش رمز ماژول', text: 'چند بار رمز ⚙ اشتباه قبل از lockout.' },
    modulePasswordLockoutMinutes: { title: 'مدت lockout', text: 'مدت مسدودیت پس از تلاش‌های اشتباه.' },
  };

  /** @type {Array<{ id: string, title: string, icon: string, summary: (s: object) => string, dialogType?: string }>} */
  const SETTING_CARDS = [
    {
      id: 'upload-port',
      title: 'آپلود و پورت',
      icon: 'fa-upload',
      summary: (s) => `ZIP: ${s.maxZipUploadMb}MB · پورت: ${s.portRangeStart}–${s.portRangeEnd}`,
    },
    {
      id: 'resources',
      title: 'منابع پیش‌فرض ماژول',
      icon: 'fa-microchip',
      summary: (s) => {
        const r = s.defaultModuleResources;
        return `CPU ${r.cpu_limit} · RAM ${r.ram_limit_mb}MB · Net ${r.net_mbps}Mbps`;
      },
    },
    {
      id: 'schedule-cache',
      title: 'زمان‌بندی و کش',
      icon: 'fa-server',
      summary: (s) => `همزمان: ${s.maxConcurrentRunningModules} · کش: ${s.maxPackageCacheGb}GB · لاگ: ${s.logRetentionDays}روز`,
    },
    {
      id: 'auto-restart',
      title: 'راه‌اندازی مجدد خودکار',
      icon: 'fa-redo',
      summary: (s) => (s.autoRestartOnCrash
        ? `فعال · حداکثر ${s.autoRestartMaxAttemptsPerHour}/ساعت`
        : 'غیرفعال'),
    },
    {
      id: 'network',
      title: 'رابط شبکه نصب پکیج',
      icon: 'fa-network-wired',
      summary: (s) => `رابط: ${s.packageInstallInterface || '—'}`,
    },
    {
      id: 'auth',
      title: 'احراز هویت',
      icon: 'fa-user-shield',
      summary: (s) => `Session ادمین: ${s.sessionTtlHours}س · login: ${s.loginRateLimitPerMinute}/دقیقه`,
    },
    {
      id: 'change-password',
      title: 'تغییر رمز عبور',
      icon: 'fa-key',
      dialogType: 'password',
      summary: () => 'تغییر رمز Super Admin',
    },
    {
      id: 'backup-restore',
      title: 'پشتیبان‌گیری و بازیابی',
      icon: 'fa-database',
      dialogType: 'backup',
      summary: (_s, meta) => `${meta.backupCount} بکاپ · آخرین: ${meta.latestBackup || '—'}`,
    },
  ];

  function showSettingsHelp(helpKey) {
    const help = SETTINGS_HELP_TEXTS[helpKey];
    if (!help) return;
    void Swal.fire({ title: help.title, text: help.text, icon: 'info', confirmButtonText: 'بستن' });
  }

  function wireDialogHelp(container) {
    if (!container) return;
    container.querySelectorAll('[data-help-key]').forEach((label) => {
      label.addEventListener('click', (event) => {
        event.preventDefault();
        const key = label.getAttribute('data-help-key');
        if (key) showSettingsHelp(key);
      });
    });
  }

  function fieldHtml(id, label, helpKey, type, value, extra = '') {
    return `<div class="swal-settings-field">
      <label data-help-key="${helpKey}">${label}</label>
      <input id="swal-${id}" type="${type}" value="${value}" ${extra}>
    </div>`;
  }

  function buildUploadPortHtml(s) {
    return fieldHtml('maxZipUploadMb', 'حداکثر حجم ZIP (MB)', 'maxZipUploadMb', 'number', s.maxZipUploadMb, 'min="1" max="2048"')
      + fieldHtml('portRangeStart', 'شروع بازه پورت', 'portRangeStart', 'number', s.portRangeStart, 'min="1024" max="65535"')
      + fieldHtml('portRangeEnd', 'پایان بازه پورت', 'portRangeEnd', 'number', s.portRangeEnd, 'min="1024" max="65535"');
  }

  function buildResourcesHtml(s) {
    const r = s.defaultModuleResources;
    return fieldHtml('cpu_limit', 'CPU limit', 'cpu_limit', 'number', r.cpu_limit, 'step="0.1" min="0.1"')
      + fieldHtml('ram_limit_mb', 'RAM (MB)', 'ram_limit_mb', 'number', r.ram_limit_mb, 'min="64"')
      + fieldHtml('swap_limit_mb', 'Swap (MB)', 'swap_limit_mb', 'number', r.swap_limit_mb, 'min="0"')
      + fieldHtml('disk_iops', 'Disk IOPS', 'disk_iops', 'number', r.disk_iops, 'min="1"')
      + fieldHtml('net_mbps', 'Network (Mbps)', 'net_mbps', 'number', r.net_mbps, 'min="1"');
  }

  function buildScheduleCacheHtml(s) {
    return fieldHtml('maxConcurrentRunningModules', 'حداکثر ماژول همزمان', 'maxConcurrentRunningModules', 'number', s.maxConcurrentRunningModules, 'min="1"')
      + fieldHtml('logRetentionDays', 'نگهداری لاگ (روز)', 'logRetentionDays', 'number', s.logRetentionDays, 'min="1"')
      + fieldHtml('maxPackageCacheGb', 'حداکثر کش پکیج (GB)', 'maxPackageCacheGb', 'number', s.maxPackageCacheGb, 'step="0.1" min="0.1"')
      + fieldHtml('dependencyInstallTimeoutSec', 'تایم‌اوت نصب وابستگی (ثانیه)', 'dependencyInstallTimeoutSec', 'number', s.dependencyInstallTimeoutSec, 'min="1"')
      + fieldHtml('uploadTempCleanupHours', 'پاکسازی temp آپلود (ساعت)', 'uploadTempCleanupHours', 'number', s.uploadTempCleanupHours, 'min="1"')
      + fieldHtml('logViewerMaxLines', 'حداکثر خطوط log viewer', 'logViewerMaxLines', 'number', s.logViewerMaxLines, 'min="1"');
  }

  function buildAutoRestartHtml(s) {
    const checked = s.autoRestartOnCrash ? 'checked' : '';
    return `<div class="swal-settings-field">
      <label class="swal-settings-checkbox" data-help-key="autoRestartOnCrash">
        <input type="checkbox" id="swal-autoRestartOnCrash" ${checked}>
        فعال‌سازی auto-restart پس از crash
      </label>
    </div>`
      + fieldHtml('autoRestartMaxAttemptsPerHour', 'حداکثر تلاش در ساعت', 'autoRestartMaxAttemptsPerHour', 'number', s.autoRestartMaxAttemptsPerHour, 'min="1"');
  }

  function buildNetworkHtml(s) {
    if (showNicSelector && networkInterfaces.length > 0) {
      const options = networkInterfaces.map((iface) => {
        const checked = s.packageInstallInterface === iface ? 'checked' : '';
        return `<label data-help-key="packageInstallInterface">
          <input type="radio" name="swal-nic" value="${iface}" ${checked}> ${iface}
        </label>`;
      }).join('');
      return `<div class="swal-nic-options">${options}</div>
        <p style="font-size:0.8rem;color:#64748b;margin-top:0.5rem;">وقتی ≥۲ NIC فعال باشد، انتخاب رابط الزامی است.</p>`;
    }
    return fieldHtml('packageInstallInterface', 'packageInstallInterface', 'packageInstallInterface', 'text', s.packageInstallInterface || '', 'required');
  }

  function buildAuthHtml(s) {
    return fieldHtml('sessionTtlHours', 'Session TTL Super Admin (ساعت)', 'sessionTtlHours', 'number', s.sessionTtlHours, 'min="1"')
      + fieldHtml('loginRateLimitPerMinute', 'محدودیت login در دقیقه', 'loginRateLimitPerMinute', 'number', s.loginRateLimitPerMinute, 'min="1"')
      + fieldHtml('moduleManagerSessionTtlHours', 'Session TTL Module Manager (ساعت)', 'moduleManagerSessionTtlHours', 'number', s.moduleManagerSessionTtlHours, 'min="1"')
      + fieldHtml('modulePasswordMaxAttempts', 'حداکثر تلاش رمز ماژول', 'modulePasswordMaxAttempts', 'number', s.modulePasswordMaxAttempts, 'min="1"')
      + fieldHtml('modulePasswordLockoutMinutes', 'مدت lockout (دقیقه)', 'modulePasswordLockoutMinutes', 'number', s.modulePasswordLockoutMinutes, 'min="1"');
  }

  const DIALOG_BUILDERS = {
    'upload-port': buildUploadPortHtml,
    resources: buildResourcesHtml,
    'schedule-cache': buildScheduleCacheHtml,
    'auto-restart': buildAutoRestartHtml,
    network: buildNetworkHtml,
    auth: buildAuthHtml,
  };

  function readSwalValue(id) {
    return document.getElementById(`swal-${id}`)?.value;
  }

  function readSwalNumber(id) {
    return Number(readSwalValue(id));
  }

  function readSwalChecked(id) {
    return Boolean(document.getElementById(`swal-${id}`)?.checked);
  }

  function buildPayloadForCard(cardId) {
    if (cardId === 'upload-port') {
      return {
        maxZipUploadMb: readSwalNumber('maxZipUploadMb'),
        portRangeStart: readSwalNumber('portRangeStart'),
        portRangeEnd: readSwalNumber('portRangeEnd'),
      };
    }
    if (cardId === 'resources') {
      return {
        defaultModuleResources: {
          cpu_limit: readSwalNumber('cpu_limit'),
          ram_limit_mb: readSwalNumber('ram_limit_mb'),
          swap_limit_mb: readSwalNumber('swap_limit_mb'),
          disk_iops: readSwalNumber('disk_iops'),
          net_mbps: readSwalNumber('net_mbps'),
        },
      };
    }
    if (cardId === 'schedule-cache') {
      return {
        maxConcurrentRunningModules: readSwalNumber('maxConcurrentRunningModules'),
        logRetentionDays: readSwalNumber('logRetentionDays'),
        maxPackageCacheGb: readSwalNumber('maxPackageCacheGb'),
        dependencyInstallTimeoutSec: readSwalNumber('dependencyInstallTimeoutSec'),
        uploadTempCleanupHours: readSwalNumber('uploadTempCleanupHours'),
        logViewerMaxLines: readSwalNumber('logViewerMaxLines'),
      };
    }
    if (cardId === 'auto-restart') {
      return {
        autoRestartOnCrash: readSwalChecked('autoRestartOnCrash'),
        autoRestartMaxAttemptsPerHour: readSwalNumber('autoRestartMaxAttemptsPerHour'),
      };
    }
    if (cardId === 'network') {
      if (showNicSelector) {
        const selected = document.querySelector('input[name="swal-nic"]:checked');
        return { packageInstallInterface: selected?.value?.trim() || '' };
      }
      return { packageInstallInterface: readSwalValue('packageInstallInterface')?.trim() || '' };
    }
    if (cardId === 'auth') {
      return {
        sessionTtlHours: readSwalNumber('sessionTtlHours'),
        loginRateLimitPerMinute: readSwalNumber('loginRateLimitPerMinute'),
        moduleManagerSessionTtlHours: readSwalNumber('moduleManagerSessionTtlHours'),
        modulePasswordMaxAttempts: readSwalNumber('modulePasswordMaxAttempts'),
        modulePasswordLockoutMinutes: readSwalNumber('modulePasswordLockoutMinutes'),
      };
    }
    return {};
  }

  async function saveSettingsPayload(payload) {
    const result = await ModuleHubApi.saveSystemSettings(payload);
    currentSettings = result.settings;
    renderCards();
    return result;
  }

  async function openCardDialog(cardId) {
    const card = SETTING_CARDS.find((c) => c.id === cardId);
    if (!card || !currentSettings) return;

    if (card.dialogType === 'password') {
      await AdminMenu.showChangePasswordDialog();
      return;
    }

    if (card.dialogType === 'backup') {
      await BackupSettingsDialog.openDialog(currentSettings.maxZipUploadMb);
      return;
    }

    const buildHtml = DIALOG_BUILDERS[cardId];
    if (!buildHtml) return;

    const result = await Swal.fire({
      title: card.title,
      html: buildHtml(currentSettings),
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ذخیره',
      cancelButtonText: 'انصراف',
      width: '32rem',
      didOpen: () => wireDialogHelp(Swal.getHtmlContainer()),
    });

    if (!result.isConfirmed) return;

    try {
      const payload = buildPayloadForCard(cardId);
      await saveSettingsPayload(payload);
      await Swal.fire({ icon: 'success', title: 'ذخیره شد', text: 'تنظیمات این بخش اعمال شد.', timer: 2000, showConfirmButton: false });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'ذخیره ناموفق', text: error.message });
    }
  }

  function renderCards() {
    if (!cardsGrid || !currentSettings) return;

    cardsGrid.innerHTML = SETTING_CARDS.map((card) => `
      <button type="button" class="settings-card" data-card-id="${card.id}">
        <div class="settings-card-icon"><i class="fas ${card.icon}"></i></div>
        <h3 class="settings-card-title">${card.title}</h3>
        <p class="settings-card-summary">${card.summary(currentSettings, BackupSettingsDialog.getBackupMeta())}</p>
        <div class="settings-card-action"><i class="fas fa-edit"></i> ویرایش</div>
      </button>`).join('');

    cardsGrid.querySelectorAll('.settings-card').forEach((button) => {
      button.addEventListener('click', () => {
        void openCardDialog(button.getAttribute('data-card-id'));
      });
    });
  }

  async function loadSettingsPage() {
    try {
      const data = await ModuleHubApi.loadSystemSettings();
      currentSettings = data.settings;
      networkInterfaces = data.networkInterfaces ?? [];
      showNicSelector = Boolean(data.showNicSelector);
      await BackupSettingsDialog.refreshBackupMeta();
      renderCards();
    } catch (error) {
      cardsGrid.innerHTML = `<div class="loading-state">خطا: ${error.message}</div>`;
      if (String(error.message).includes('403')) {
        window.location.href = '/admin/login';
      }
    }
  }

  async function initAdminMenuOnSettings() {
    try {
      const status = await ModuleHubApi.loadAuthStatus();
      AdminMenu.mount('adminAuthMenuHost', { onAfterLogout: () => { window.location.href = '/'; } });
      AdminMenu.update(status.isSuperAdmin);
    } catch {
      window.location.href = '/admin/login';
    }
  }

  BackupSettingsDialog.onMetaChange(() => renderCards());

  void initAdminMenuOnSettings();
  void loadSettingsPage();
})();
