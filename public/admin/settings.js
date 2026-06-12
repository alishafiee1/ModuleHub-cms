// admin/settings.js — Super Admin system settings form
(function initSettingsPage() {
  const form = document.getElementById('settingsForm');
  const nicSection = document.getElementById('nicSection');
  const nicTextSection = document.getElementById('nicTextSection');
  const nicOptions = document.getElementById('nicOptions');

  let currentSettings = null;
  let networkInterfaces = [];
  let showNicSelector = false;
  /** Simple Persian help texts keyed by data-help-key */
  const SETTINGS_HELP_TEXTS = {
    maxZipUploadMb: {
      title: 'حداکثر حجم ZIP',
      text: 'بزرگ‌ترین حجم فایل ZIP که می‌توانید آپلود کنید. اگر ماژول سنگین‌تر باشد، سرور خطای ۴۱۳ می‌دهد و آپلود رد می‌شود.',
    },
    portRangeStart: {
      title: 'شروع بازه پورت',
      text: 'کوچک‌ترین شماره پورتی که CMS برای ماژول‌های جدید (وقتی پورت دستی نمی‌دهید) در نظر می‌گیرد.',
    },
    portRangeEnd: {
      title: 'پایان بازه پورت',
      text: 'بزرگ‌ترین پورت مجاز برای تخصیص خودکار. باید از «شروع بازه» بزرگ‌تر باشد.',
    },
    cpu_limit: {
      title: 'CPU پیش‌فرض',
      text: 'سهم پردازنده برای ماژول تازه اضافه‌شده. عدد کوچک‌تر یعنی فشار کمتر روی سرور (مثلاً ۰.۵ یعنی نصف یک هسته).',
    },
    ram_limit_mb: {
      title: 'RAM پیش‌فرض',
      text: 'حافظهٔ RAM (مگابایت) که wizard برای ماژول جدید پیشنهاد می‌دهد. اگر کم باشد ماژول ممکن است crash کند.',
    },
    swap_limit_mb: {
      title: 'Swap پیش‌فرض',
      text: 'حافظهٔ swap اضطراری (مگابایت). وقتی RAM پر شود سیستم از swap استفاده می‌کند — خیلی زیاد نکنید.',
    },
    disk_iops: {
      title: 'Disk IOPS',
      text: 'محدودیت سرعت نوشتن/خواندن دیسک برای ماژول. عدد پایین‌تر یعنی ماژول کمتر دیسک را اشغال می‌کند.',
    },
    net_mbps: {
      title: 'Network (Mbps)',
      text: 'سقف پهنای باند شبکه برای ماژول (مگابیت بر ثانیه). برای جلوگیری از اشباع اینترنت سرور.',
    },
    maxConcurrentRunningModules: {
      title: 'حداکثر ماژول همزمان',
      text: 'چند ماژول می‌توانند هم‌زمان روی دکمه Start باشند. بعد از این تعداد، Start جدید خطای ۴۰۹ می‌دهد.',
    },
    logRetentionDays: {
      title: 'نگهداری لاگ',
      text: 'چند روز فایل‌های لاگ CMS و ماژول‌ها نگه داشته شوند. با logrotate هماهنگ است — قدیمی‌ها فشرده یا حذف می‌شوند.',
    },
    maxPackageCacheGb: {
      title: 'حداکثر کش پکیج',
      text: 'سقف فضای دیسک برای کش npm/pip/composer مشترک. وقتی پر شود قدیمی‌ترین کش‌ها (LRU) پاک می‌شوند.',
    },
    dependencyInstallTimeoutSec: {
      title: 'تایم‌اوت نصب وابستگی',
      text: 'حداکثر ثانیه‌ای که npm install یا pip install اجازه دارند طول بکشند. بعد از آن نصب قطع می‌شود.',
    },
    uploadTempCleanupHours: {
      title: 'پاکسازی temp آپلود',
      text: 'فایل‌های ZIP موقت بعد از آپلود چند ساعت در پوشه temp بمانند و سپس پاک شوند.',
    },
    logViewerMaxLines: {
      title: 'حداکثر خطوط log viewer',
      text: 'در دیالوگ ⚙ → مشاهده لاگ، چند خط آخر نشان داده شود (پیش‌فرض ۵۰).',
    },
    autoRestartOnCrash: {
      title: 'راه‌اندازی مجدد خودکار',
      text: 'اگر ماژول crash کند، CMS سعی می‌کند خودکار دوباره Start کند — تا سقف «حداکثر تلاش در ساعت».',
    },
    autoRestartMaxAttemptsPerHour: {
      title: 'حداکثر تلاش در ساعت',
      text: 'در یک ساعت چند بار auto-restart مجاز است. بیش از این، CMS دیگر خودکار start نمی‌کند تا loop بی‌نهایت نشود.',
    },
    packageInstallInterface: {
      title: 'رابط شبکه نصب پکیج',
      text: 'روی سرور دو خط اینترنت دارید؟ این کارت شبکه موقتاً برای npm/docker/git انتخاب می‌شود. مسیر دائمی Ubuntu عوض نمی‌شود.',
    },
    sessionTtlHours: {
      title: 'Session Super Admin',
      text: 'چند ساعت بعد از login، session ادمین اصلی منقضی شود. (فاز ۸ — login واقعی)',
    },
    loginRateLimitPerMinute: {
      title: 'محدودیت login',
      text: 'در هر دقیقه چند بار می‌توان رمز login را امتحان کرد. بیشتر → خطای ۴۲۹ (ضد brute-force).',
    },
    moduleManagerSessionTtlHours: {
      title: 'Session Module Manager',
      text: 'مدت session کسی که فقط با رمز یک ماژول وارد شده (نه Super Admin).',
    },
    modulePasswordMaxAttempts: {
      title: 'حداکثر تلاش رمز ماژول',
      text: 'چند بار می‌توان رمز ⚙ یک ماژول را اشتباه زد قبل از lockout.',
    },
    modulePasswordLockoutMinutes: {
      title: 'مدت lockout',
      text: 'بعد از تلاش‌های اشتباه، چند دقیقه ورود به همان ماژول مسدود می‌ماند.',
    },
  };

  /**
   * Shows SweetAlert help popup for a settings field key.
   * @param {string} helpKey - data-help-key value
   */
  function showSettingsHelp(helpKey) {
    if (typeof Swal !== 'undefined' && Swal.isVisible()) {
      return;
    }
    const help = SETTINGS_HELP_TEXTS[helpKey];
    if (!help) {
      return;
    }
    void Swal.fire({
      title: help.title,
      text: help.text,
      icon: 'info',
      confirmButtonText: 'بستن',
    });
  }

  /**
   * Opens help when user clicks or taps a field title (not inputs/checkboxes/radios).
   * @param {Event} event - Click or keyboard event
   */
  function handleHelpTrigger(event) {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const helpElement = event.target.closest('[data-help-key]');
    if (!helpElement || !form?.contains(helpElement)) {
      return;
    }

    if (event.target.closest('input, select, textarea, button.password-toggle-btn')) {
      return;
    }

    const helpKey = helpElement.getAttribute('data-help-key');
    if (!helpKey) {
      return;
    }

    event.preventDefault();
    showSettingsHelp(helpKey);
  }

  /**
   * Marks help titles as keyboard-focusable buttons for accessibility.
   * @param {ParentNode} [root] - Scope to scan; defaults to whole form
   */
  function markHelpElements(root = form) {
    if (!root) {
      return;
    }
    root.querySelectorAll('[data-help-key]').forEach((element) => {
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
    });
  }

  /**
   * Wires click/tap help on field titles inside the settings form.
   */
  function initSettingsHelpHints() {
    if (!form) {
      return;
    }

    markHelpElements();
    form.addEventListener('click', handleHelpTrigger);
    form.addEventListener('keydown', handleHelpTrigger);
  }

  /**
   * Sets a numeric input value by element id.
   * @param {string} id - Input element id
   * @param {number} value - Value to assign
   */
  function setNumberField(id, value) {
    const input = document.getElementById(id);
    if (input) {
      input.value = String(value);
    }
  }

  /**
   * Renders NIC radio buttons when multiple interfaces are available.
   */
  function renderNicOptions() {
    if (!nicOptions || !nicSection || !nicTextSection) {
      return;
    }

    nicOptions.innerHTML = '';

    if (!showNicSelector) {
      nicSection.hidden = true;
      nicTextSection.hidden = false;
      return;
    }

    nicSection.hidden = false;
    nicTextSection.hidden = true;

    for (const iface of networkInterfaces) {
      const label = document.createElement('label');
      label.setAttribute('data-help-key', 'packageInstallInterface');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'packageInstallInterfaceRadio';
      radio.value = iface;
      radio.checked = currentSettings?.packageInstallInterface === iface;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(iface));
      nicOptions.appendChild(label);
    }
    markHelpElements(nicOptions);
  }

  /**
   * Populates the form from loaded settings.
   * @param {object} settings - System settings document
   */
  function populateForm(settings) {
    setNumberField('maxZipUploadMb', settings.maxZipUploadMb);
    setNumberField('portRangeStart', settings.portRangeStart);
    setNumberField('portRangeEnd', settings.portRangeEnd);
    setNumberField('cpu_limit', settings.defaultModuleResources.cpu_limit);
    setNumberField('ram_limit_mb', settings.defaultModuleResources.ram_limit_mb);
    setNumberField('swap_limit_mb', settings.defaultModuleResources.swap_limit_mb);
    setNumberField('disk_iops', settings.defaultModuleResources.disk_iops);
    setNumberField('net_mbps', settings.defaultModuleResources.net_mbps);
    setNumberField('maxConcurrentRunningModules', settings.maxConcurrentRunningModules);
    setNumberField('logRetentionDays', settings.logRetentionDays);
    setNumberField('maxPackageCacheGb', settings.maxPackageCacheGb);
    setNumberField('dependencyInstallTimeoutSec', settings.dependencyInstallTimeoutSec);
    setNumberField('uploadTempCleanupHours', settings.uploadTempCleanupHours);
    setNumberField('logViewerMaxLines', settings.logViewerMaxLines);
    setNumberField('autoRestartMaxAttemptsPerHour', settings.autoRestartMaxAttemptsPerHour);
    setNumberField('sessionTtlHours', settings.sessionTtlHours);
    setNumberField('loginRateLimitPerMinute', settings.loginRateLimitPerMinute);
    setNumberField('moduleManagerSessionTtlHours', settings.moduleManagerSessionTtlHours);
    setNumberField('modulePasswordMaxAttempts', settings.modulePasswordMaxAttempts);
    setNumberField('modulePasswordLockoutMinutes', settings.modulePasswordLockoutMinutes);

    const autoRestart = document.getElementById('autoRestartOnCrash');
    if (autoRestart) {
      autoRestart.checked = Boolean(settings.autoRestartOnCrash);
    }

    const nicText = document.getElementById('packageInstallInterface');
    if (nicText) {
      nicText.value = settings.packageInstallInterface;
    }

    renderNicOptions();
  }

  /**
   * Builds POST body from form fields.
   * @returns {object} Partial settings update
   */
  function collectFormPayload() {
    const selectedNicRadio = document.querySelector('input[name="packageInstallInterfaceRadio"]:checked');
    const nicText = document.getElementById('packageInstallInterface');
    const packageInstallInterface = showNicSelector && selectedNicRadio
      ? selectedNicRadio.value
      : nicText?.value?.trim();

    return {
      maxZipUploadMb: Number(document.getElementById('maxZipUploadMb')?.value),
      portRangeStart: Number(document.getElementById('portRangeStart')?.value),
      portRangeEnd: Number(document.getElementById('portRangeEnd')?.value),
      defaultModuleResources: {
        cpu_limit: Number(document.getElementById('cpu_limit')?.value),
        ram_limit_mb: Number(document.getElementById('ram_limit_mb')?.value),
        swap_limit_mb: Number(document.getElementById('swap_limit_mb')?.value),
        disk_iops: Number(document.getElementById('disk_iops')?.value),
        net_mbps: Number(document.getElementById('net_mbps')?.value),
      },
      maxConcurrentRunningModules: Number(document.getElementById('maxConcurrentRunningModules')?.value),
      logRetentionDays: Number(document.getElementById('logRetentionDays')?.value),
      maxPackageCacheGb: Number(document.getElementById('maxPackageCacheGb')?.value),
      dependencyInstallTimeoutSec: Number(document.getElementById('dependencyInstallTimeoutSec')?.value),
      autoRestartOnCrash: Boolean(document.getElementById('autoRestartOnCrash')?.checked),
      autoRestartMaxAttemptsPerHour: Number(document.getElementById('autoRestartMaxAttemptsPerHour')?.value),
      uploadTempCleanupHours: Number(document.getElementById('uploadTempCleanupHours')?.value),
      packageInstallInterface,
      logViewerMaxLines: Number(document.getElementById('logViewerMaxLines')?.value),
      sessionTtlHours: Number(document.getElementById('sessionTtlHours')?.value),
      loginRateLimitPerMinute: Number(document.getElementById('loginRateLimitPerMinute')?.value),
      moduleManagerSessionTtlHours: Number(document.getElementById('moduleManagerSessionTtlHours')?.value),
      modulePasswordMaxAttempts: Number(document.getElementById('modulePasswordMaxAttempts')?.value),
      modulePasswordLockoutMinutes: Number(document.getElementById('modulePasswordLockoutMinutes')?.value),
    };
  }

  /**
   * Loads settings from backend and fills the form.
   */
  async function loadSettingsPage() {
    try {
      const data = await ModuleHubApi.loadSystemSettings();
      currentSettings = data.settings;
      networkInterfaces = data.networkInterfaces ?? [];
      showNicSelector = Boolean(data.showNicSelector);
      populateForm(currentSettings);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'خطا',
        text: error.message || 'بارگذاری تنظیمات ناموفق بود',
      });
      if (error.message && error.message.includes('403')) {
        window.location.href = '/admin/login';
      }
    }
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const payload = collectFormPayload();
      const result = await ModuleHubApi.saveSystemSettings(payload);
      currentSettings = result.settings;
      populateForm(currentSettings);
      await Swal.fire({ icon: 'success', title: 'ذخیره شد', text: 'تنظیمات با موفقیت اعمال شد.' });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'ذخیره ناموفق',
        text: error.message || 'خطای ناشناخته',
      });
    }
  });

  /**
   * Validates password fields on the settings change-password form.
   * @returns {{ currentPassword: string, newPassword: string, confirmPassword: string }|null}
   */
  function collectPasswordForm() {
    const currentPassword = document.getElementById('currentPassword')?.value ?? '';
    const newPassword = document.getElementById('newPassword')?.value ?? '';
    const confirmPassword = document.getElementById('confirmPassword')?.value ?? '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return null;
    }
    return { currentPassword, newPassword, confirmPassword };
  }

  /**
   * Submits change-password form to the API.
   */
  async function submitChangePasswordForm() {
    const fields = collectPasswordForm();
    if (!fields) {
      await Swal.fire({ icon: 'warning', title: 'فیلدهای ناقص', text: 'همه فیلدهای رمز الزامی هستند.' });
      return;
    }
    if (fields.newPassword !== fields.confirmPassword) {
      await Swal.fire({ icon: 'warning', title: 'عدم تطابق', text: 'رمز جدید و تکرار آن یکسان نیستند.' });
      return;
    }
    if (fields.newPassword.length < 8 || !/[a-zA-Z]/.test(fields.newPassword) || !/\d/.test(fields.newPassword)) {
      await Swal.fire({
        icon: 'warning',
        title: 'رمز ضعیف',
        text: 'رمز جدید باید حداقل ۸ کاراکتر و شامل حروف و ارقام باشد.',
      });
      return;
    }

    try {
      const result = await ModuleHubApi.changeSuperAdminPassword(
        fields.currentPassword,
        fields.newPassword,
        fields.confirmPassword,
      );
      await Swal.fire({
        icon: 'success',
        title: 'رمز تغییر کرد',
        text: 'لطفاً دوباره وارد شوید.',
        timer: 2500,
        showConfirmButton: false,
      });
      window.location.href = result.redirect || '/admin/login';
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  document.getElementById('changePasswordButton')?.addEventListener('click', () => {
    void submitChangePasswordForm();
  });

  async function initAdminMenuOnSettings() {
    try {
      const status = await ModuleHubApi.loadAuthStatus();
      AdminMenu.mount('adminAuthMenuHost', {
        onAfterLogout: () => {
          window.location.href = '/';
        },
      });
      AdminMenu.update(status.isSuperAdmin);
    } catch {
      window.location.href = '/admin/login';
    }
  }

  initSettingsHelpHints();
  AdminMenu.wirePasswordToggles(document.getElementById('changePasswordSection'));
  void initAdminMenuOnSettings();
  void loadSettingsPage();
})();
