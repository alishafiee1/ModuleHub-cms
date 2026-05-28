// admin/settings.js — Super Admin system settings form
(function initSettingsPage() {
  const form = document.getElementById('settingsForm');
  const nicSection = document.getElementById('nicSection');
  const nicTextSection = document.getElementById('nicTextSection');
  const nicOptions = document.getElementById('nicOptions');

  let currentSettings = null;
  let networkInterfaces = [];
  let showNicSelector = false;

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
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'packageInstallInterfaceRadio';
      radio.value = iface;
      radio.checked = currentSettings?.packageInstallInterface === iface;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(iface));
      nicOptions.appendChild(label);
    }
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

  void loadSettingsPage();
})();
