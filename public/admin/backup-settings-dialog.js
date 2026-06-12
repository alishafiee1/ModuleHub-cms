/**
 * backup-settings-dialog.js — Full CMS backup/restore dialog for admin settings page.
 */
const BackupSettingsDialog = (function createBackupSettingsDialog() {
  let backupMeta = { backupCount: 0, latestBackup: null };
  let onAfterMetaChange = null;

  function formatBackupDate(isoString) {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return isoString;
    }
  }

  function formatBackupSize(sizeBytes) {
    if (!sizeBytes || sizeBytes < 1024) return `${sizeBytes || 0} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Refreshes backup summary shown on the settings card.
   * @returns {Promise<{ backupCount: number, latestBackup: string|null }>}
   */
  async function refreshBackupMeta() {
    try {
      const data = await ModuleHubApi.listFullBackups();
      const backups = data.backups ?? [];
      backupMeta = {
        backupCount: backups.length,
        latestBackup: backups[0] ? formatBackupDate(backups[0].createdAt) : null,
      };
    } catch {
      backupMeta = { backupCount: 0, latestBackup: null };
    }
    if (onAfterMetaChange) onAfterMetaChange(backupMeta);
    return backupMeta;
  }

  function getBackupMeta() {
    return backupMeta;
  }

  const BACKUP_HELP_HTML = `
    <div class="backup-help-content">
      <p><strong>داخل بکاپ کامل ذخیره می‌شود:</strong></p>
      <ul>
        <li><code>site-layout.json</code> — چیدمان کارت‌ها و ماژول‌ها</li>
        <li><code>system-settings.json</code> — تنظیمات سراسری CMS</li>
        <li><code>standalone-modules/</code> — پوشهٔ همهٔ ماژول‌ها</li>
        <li><code>thumbnails/</code> — تصاویر کوچک کارت‌ها</li>
        <li><code>backup-manifest.json</code> — فهرست و نسخهٔ فرمت بکاپ</li>
      </ul>
      <p><strong>داخل بکاپ ذخیره نمی‌شود:</strong></p>
      <ul>
        <li>لاگ‌های ماژول (<code>storage/logs/</code> و مسیرهای خارجی لاگ)</li>
        <li>کش پکیج npm/pip مشترک</li>
        <li>فایل‌های موقت آپلود ZIP</li>
        <li>حساب‌های ادمین و sessionهای فعال</li>
        <li>بکاپ‌های دیگر روی دیسک (هر ZIP جداگانه است)</li>
      </ul>
      <p class="backup-hint">بکاپ <strong>تکی ماژول</strong> از ⚙ فقط همان ماژول را می‌گیرد، نه کل CMS.</p>
    </div>`;

  async function showBackupHelp() {
    await Swal.fire({
      title: 'چه چیزی در بکاپ است؟',
      html: BACKUP_HELP_HTML,
      icon: 'info',
      confirmButtonText: 'بستن',
      width: '34rem',
    });
  }

  async function promptAdminPasswordForDelete(fileName) {
    const result = await Swal.fire({
      title: 'حذف بکاپ',
      html: `
        <p class="backup-delete-warning">فایل <strong>${fileName}</strong> برای همیشه حذف می‌شود.</p>
        <div class="swal-password-field password-input-group">
          <input type="password" id="backupDeleteAdminPassword" class="swal2-input" placeholder="رمز Super Admin" autocomplete="current-password">
          <button type="button" class="password-toggle-btn" aria-label="نمایش رمز"><i class="fas fa-eye"></i></button>
        </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'حذف',
      cancelButtonText: 'انصراف',
      confirmButtonColor: '#dc2626',
      focusConfirm: false,
      didOpen: () => {
        if (typeof AdminMenu !== 'undefined' && AdminMenu.wirePasswordToggles) {
          AdminMenu.wirePasswordToggles(Swal.getHtmlContainer());
        }
      },
      preConfirm: () => {
        const adminPassword = document.getElementById('backupDeleteAdminPassword')?.value ?? '';
        if (!adminPassword) {
          Swal.showValidationMessage('رمز Super Admin الزامی است');
          return false;
        }
        return adminPassword;
      },
    });
    return result.isConfirmed ? result.value : null;
  }

  function buildBackupListHtml(backups) {
    if (!backups.length) {
      return '<p class="backup-empty-state">هنوز بکاپی وجود ندارد. با دکمهٔ بالا یک بکاپ بسازید.</p>';
    }
    return backups.map((entry) => `
      <div class="backup-list-item" data-file-name="${entry.fileName}">
        <div class="backup-list-item-info">
          <strong>${entry.fileName}</strong>
          <span>${formatBackupDate(entry.createdAt)} · ${formatBackupSize(entry.sizeBytes)}</span>
        </div>
        <div class="backup-list-item-actions">
          <button type="button" class="backup-btn backup-btn-download" data-action="download" data-file="${entry.fileName}">
            <i class="fas fa-download"></i> دانلود
          </button>
          <button type="button" class="backup-btn backup-btn-restore" data-action="restore-server" data-file="${entry.fileName}">
            <i class="fas fa-undo"></i> بازیابی
          </button>
          <button type="button" class="backup-btn backup-btn-delete" data-action="delete" data-file="${entry.fileName}">
            <i class="fas fa-trash"></i> حذف
          </button>
        </div>
      </div>`).join('');
  }

  function buildBackupDialogHtml(backups, maxZipUploadMb) {
    return `
      <div class="backup-dialog">
        <div class="backup-dialog-section backup-dialog-toolbar">
          <button type="button" id="backupCreateBtn" class="backup-create-btn">
            <i class="fas fa-plus-circle"></i> ایجاد بکاپ جدید
          </button>
          <button type="button" id="backupHelpBtn" class="backup-help-btn" title="توضیحات بکاپ">
            <i class="fas fa-circle-info"></i> توضیحات
          </button>
        </div>
        <div class="backup-dialog-section">
          <h4 class="backup-section-title">بکاپ‌های ذخیره‌شده روی سرور</h4>
          <div id="backupListContainer" class="backup-list">${buildBackupListHtml(backups)}</div>
        </div>
        <div class="backup-dialog-section backup-upload-section">
          <h4 class="backup-section-title">بازیابی از فایل محلی</h4>
          <input type="file" id="backupUploadInput" accept=".zip,application/zip" class="backup-file-input">
          <label class="backup-confirm-label">
            <input type="checkbox" id="backupUploadConfirm">
            می‌دانم بازیابی layout و تنظیمات را بازنویسی می‌کند
          </label>
          <button type="button" id="backupUploadRestoreBtn" class="backup-upload-restore-btn" disabled>
            <i class="fas fa-upload"></i> بازیابی از فایل انتخاب‌شده
          </button>
          <p class="backup-hint">حداکثر حجم آپلود: ${maxZipUploadMb} MB. بازیابی از سرور محدودیت دیسک دارد و ممکن است زمان‌بر باشد.</p>
          <p class="backup-hint backup-hint-warning">قبل از بازیابی، نسخهٔ امنیتی خودکار (pre-restore) گرفته می‌شود.</p>
        </div>
      </div>`;
  }

  async function confirmDangerousRestore(fileLabel) {
    const confirm = await Swal.fire({
      title: 'تأیید بازیابی',
      html: `بازیابی از <strong>${fileLabel}</strong> انجام شود؟<br><br>
        قبل از بازیابی یک نسخهٔ pre-restore ذخیره می‌شود. پس از اتمام، در صورت نیاز صفحه را رفرش کنید.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'بله، بازیابی کن',
      cancelButtonText: 'انصراف',
      confirmButtonColor: '#dc2626',
    });
    return confirm.isConfirmed;
  }

  async function handleRestoreSuccess(result) {
    await refreshBackupMeta();
    await Swal.fire({
      icon: 'success',
      title: 'بازیابی انجام شد',
      html: `${result.message || ''}<br>نسخهٔ امنیتی: ${result.preRestoreBackupFileName || '—'}`,
      confirmButtonText: 'رفتن به صفحهٔ اصلی',
    });
    window.location.href = '/';
  }

  async function refreshBackupList(listContainer, backups) {
    const listData = await ModuleHubApi.listFullBackups();
    backups.length = 0;
    backups.push(...(listData.backups ?? []));
    if (listContainer) listContainer.innerHTML = buildBackupListHtml(backups);
    await refreshBackupMeta();
  }

  function wireBackupDialog(container, backups) {
    const listContainer = container.querySelector('#backupListContainer');
    const createBtn = container.querySelector('#backupCreateBtn');
    const helpBtn = container.querySelector('#backupHelpBtn');
    const uploadInput = container.querySelector('#backupUploadInput');
    const uploadConfirm = container.querySelector('#backupUploadConfirm');
    const uploadRestoreBtn = container.querySelector('#backupUploadRestoreBtn');

    helpBtn?.addEventListener('click', () => {
      void showBackupHelp();
    });

    createBtn?.addEventListener('click', async () => {
      createBtn.disabled = true;
      const originalHtml = createBtn.innerHTML;
      createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ایجاد...';
      try {
        await ModuleHubApi.createFullBackup();
        await refreshBackupList(listContainer, backups);
        void Swal.fire({ icon: 'success', title: 'بکاپ ایجاد شد', timer: 2000, showConfirmButton: false });
      } catch (error) {
        void Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
      } finally {
        createBtn.disabled = false;
        createBtn.innerHTML = originalHtml;
      }
    });

    const updateUploadButton = () => {
      if (uploadRestoreBtn) {
        uploadRestoreBtn.disabled = !(uploadInput?.files?.[0] && uploadConfirm?.checked);
      }
    };
    uploadInput?.addEventListener('change', updateUploadButton);
    uploadConfirm?.addEventListener('change', updateUploadButton);

    uploadRestoreBtn?.addEventListener('click', async () => {
      const file = uploadInput?.files?.[0];
      if (!file || !uploadConfirm?.checked) return;
      const ok = await confirmDangerousRestore(file.name);
      if (!ok) return;

      uploadRestoreBtn.disabled = true;
      Swal.fire({ title: 'در حال بازیابی...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const result = await ModuleHubApi.restoreFullBackupFromUpload(file);
        await handleRestoreSuccess(result);
      } catch (error) {
        await Swal.fire({ icon: 'error', title: 'بازیابی ناموفق', text: error.message });
      } finally {
        uploadRestoreBtn.disabled = false;
        updateUploadButton();
      }
    });

    listContainer?.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const fileName = button.getAttribute('data-file');
      if (!fileName) return;

      if (button.getAttribute('data-action') === 'download') {
        ModuleHubApi.downloadFullBackup(fileName);
        return;
      }

      if (button.getAttribute('data-action') === 'restore-server') {
        const ok = await confirmDangerousRestore(fileName);
        if (!ok) return;

        Swal.fire({ title: 'در حال بازیابی...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
          const result = await ModuleHubApi.restoreFullBackupFromServer(fileName);
          await handleRestoreSuccess(result);
        } catch (error) {
          await Swal.fire({ icon: 'error', title: 'بازیابی ناموفق', text: error.message });
        }
        return;
      }

      if (button.getAttribute('data-action') === 'delete') {
        const adminPassword = await promptAdminPasswordForDelete(fileName);
        if (!adminPassword) return;

        try {
          await ModuleHubApi.deleteFullBackup(fileName, adminPassword);
          await refreshBackupList(listContainer, backups);
          void Swal.fire({ icon: 'success', title: 'بکاپ حذف شد', timer: 1800, showConfirmButton: false });
        } catch (error) {
          void Swal.fire({ icon: 'error', title: 'حذف ناموفق', text: error.message });
        }
      }
    });
  }

  /**
   * Opens the backup/restore SweetAlert dialog.
   * @param {number} maxZipUploadMb - Upload size limit from system settings
   */
  async function openDialog(maxZipUploadMb) {
    let backups = [];
    try {
      const data = await ModuleHubApi.listFullBackups();
      backups = data.backups ?? [];
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'خطا در بارگذاری لیست', text: error.message });
      return;
    }

    await Swal.fire({
      title: 'پشتیبان‌گیری و بازیابی',
      html: buildBackupDialogHtml(backups, maxZipUploadMb ?? 200),
      width: '36rem',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'بستن',
      didOpen: () => {
        const container = Swal.getHtmlContainer();
        if (container) wireBackupDialog(container, backups);
      },
    });
  }

  /**
   * Registers callback when backup meta changes (for card summary refresh).
   * @param {(meta: object) => void} callback - Called after meta refresh
   */
  function onMetaChange(callback) {
    onAfterMetaChange = callback;
  }

  return {
    openDialog,
    refreshBackupMeta,
    getBackupMeta,
    onMetaChange,
  };
})();
