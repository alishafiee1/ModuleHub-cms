// dialog.js — SweetAlert2 dialogs for module management (ported from Demo designe)
const ModuleDialogs = (function createModuleDialogs() {
  const iconLibrary = [
    'fas fa-images', 'fas fa-chart-line', 'fab fa-react', 'fab fa-docker',
    'fas fa-cube', 'fas fa-file-alt', 'fas fa-video', 'fas fa-music',
    'fas fa-store', 'fas fa-graduation-cap', 'fas fa-tachometer-alt', 'fas fa-database',
  ];

  /**
   * Wizard step 1 — Docker, port, permissions, static vs process.
   * @returns {Promise<object|undefined>}
   */
  async function showWizardStep1Dialog() {
    const { value: result } = await Swal.fire({
      title: 'مرحله ۱: نوع اجرا و پورت',
      html: `
        <div style="text-align:right;">
          <label><input type="checkbox" id="wiz-docker"> اجرا در Docker</label>
          <label style="display:block; margin-top:8px;">
            <input type="checkbox" id="wiz-needs-process" checked> نیاز به پروسه (Backend/Docker) — غیرفعال = Static/SPA
          </label>
          <label>پورت داخلی (خالی = خودکار ۴۱۰۰–۴۹۹۹)</label>
          <input id="wiz-port" class="swal2-input" type="number" placeholder="مثلاً 4105 یا خالی">
          <label>دسترسی‌ها</label>
          <select id="wiz-permissions" class="swal2-input">
            <option value="network">network</option>
            <option value="network+volume">network+volume</option>
            <option value="none">none</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'مرحله بعد',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      preConfirm: () => ({
        docker: document.getElementById('wiz-docker').checked,
        needsProcess: document.getElementById('wiz-needs-process').checked,
        port: document.getElementById('wiz-port').value.trim(),
        permissions: document.getElementById('wiz-permissions').value,
      }),
    });
    return result;
  }

  /**
   * Shows module resource and icon configuration dialog.
   * @param {object} [initialData] - Prefilled form values
   * @returns {Promise<object|undefined>}
   */
  async function showResourceAndIconDialog(initialData = {}) {
    const defaultResources = {
      cpu_limit: 0.5,
      ram_limit_mb: 512,
      swap_limit_mb: 128,
      icon: 'fas fa-cube',
      thumbnail: null,
      moduleName: '',
      moduleDesc: '',
    };
    const data = { ...defaultResources, ...initialData };

    const iconOptionsHtml = iconLibrary.map((icon) => `
      <div class="icon-option" data-icon="${icon}">
        <i class="${icon}" style="font-size: 1.8rem;"></i>
      </div>
    `).join('');

    const { value: result } = await Swal.fire({
      title: 'تنظیمات ماژول: منابع، آیکون و تصویر کارت',
      html: `
        <div style="text-align:right;">
          <label>نام ماژول</label>
          <input id="mod-name" class="swal2-input" value="${escapeHtml(data.moduleName)}" placeholder="نام کارت">
          <label>توضیحات</label>
          <textarea id="mod-desc" class="swal2-textarea" placeholder="توضیحات کوتاه">${escapeHtml(data.moduleDesc)}</textarea>
          <label>آیکون کارت</label>
          <div id="icon-selector-container" class="icon-selector">${iconOptionsHtml}</div>
          <input id="custom-icon" class="swal2-input" placeholder="آیکون سفارشی" value="${escapeHtml(data.icon)}">
          <hr>
          <label>CPU (هسته): <span id="cpu-val">${data.cpu_limit}</span></label>
          <input type="range" id="cpu-limit" class="resource-slider" min="0.1" max="2" step="0.1" value="${data.cpu_limit}">
          <label>RAM (MB): <span id="ram-val">${data.ram_limit_mb}</span></label>
          <input type="range" id="ram-limit" class="resource-slider" min="128" max="4096" step="64" value="${data.ram_limit_mb}">
          <label>Swap (MB): <span id="swap-val">${data.swap_limit_mb}</span></label>
          <input type="range" id="swap-limit" class="resource-slider" min="0" max="1024" step="32" value="${data.swap_limit_mb}">
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'ذخیره',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      preConfirm: () => {
        const selectedIconElem = document.querySelector('#icon-selector-container .icon-option.selected');
        let finalIcon = document.getElementById('custom-icon').value;
        if (selectedIconElem && !finalIcon) {
          finalIcon = selectedIconElem.getAttribute('data-icon');
        }
        if (!finalIcon) {
          finalIcon = 'fas fa-cube';
        }
        return {
          moduleName: document.getElementById('mod-name').value,
          moduleDesc: document.getElementById('mod-desc').value,
          icon: finalIcon,
          cpu_limit: parseFloat(document.getElementById('cpu-limit').value),
          ram_limit_mb: parseInt(document.getElementById('ram-limit').value, 10),
          swap_limit_mb: parseInt(document.getElementById('swap-limit').value, 10),
        };
      },
      didOpen: () => {
        bindResourceSliders();
        bindIconSelector();
      },
    });

    return result;
  }

  /**
   * Shows module log viewer dialog.
   * @param {string} moduleName - Display name
   * @param {string} logsContent - Log text
   */
  async function showLogsDialog(moduleName, logsContent) {
    await Swal.fire({
      title: `لاگ‌های ماژول: ${moduleName}`,
      html: `<pre style="text-align:left; direction:ltr; background:#1e1e2f; color:#f0f0f0; padding:12px; border-radius:12px; max-height:400px; overflow:auto;">${escapeHtml(logsContent)}</pre>`,
      icon: 'info',
      confirmButtonText: 'بستن',
      width: '700px',
    });
  }

  /**
   * Shows package cache info placeholder (phase 5).
   */
  async function showCacheInfoDialog() {
    await Swal.fire({
      title: 'کش متمرکز پکیج‌ها',
      html: '<div style="text-align:right;"><p>کش پکیج در فاز بعدی فعال می‌شود.</p></div>',
      confirmButtonText: 'بستن',
    });
  }

  /**
   * Prompts user to authenticate before module management.
   * @param {boolean} hasModulePassword - Whether module has management password
   * @returns {Promise<'login'|'module-password'|null>}
   */
  async function showAuthRequiredDialog(hasModulePassword) {
    if (hasModulePassword) {
      const result = await Swal.fire({
        title: 'ورود برای مدیریت',
        text: 'این ماژول با رمز Module Manager محافظت شده است.',
        icon: 'lock',
        showDenyButton: true,
        confirmButtonText: 'ورود Super Admin',
        denyButtonText: 'رمز ماژول',
        showCancelButton: true,
        cancelButtonText: 'انصراف',
      });
      if (result.isConfirmed) return 'login';
      if (result.isDenied) return 'module-password';
      return null;
    }

    const result = await Swal.fire({
      title: 'ورود Super Admin',
      text: 'برای مدیریت ماژول باید وارد شوید.',
      icon: 'info',
      confirmButtonText: 'رفتن به صفحه ورود',
      showCancelButton: true,
      cancelButtonText: 'انصراف',
    });
    return result.isConfirmed ? 'login' : null;
  }

  function bindResourceSliders() {
    const cpuSlider = document.getElementById('cpu-limit');
    const ramSlider = document.getElementById('ram-limit');
    const swapSlider = document.getElementById('swap-limit');
    cpuSlider.addEventListener('input', () => {
      document.getElementById('cpu-val').innerText = cpuSlider.value;
    });
    ramSlider.addEventListener('input', () => {
      document.getElementById('ram-val').innerText = ramSlider.value;
    });
    swapSlider.addEventListener('input', () => {
      document.getElementById('swap-val').innerText = swapSlider.value;
    });
  }

  function bindIconSelector() {
    document.querySelectorAll('.icon-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.icon-option').forEach((item) => item.classList.remove('selected'));
        opt.classList.add('selected');
        document.getElementById('custom-icon').value = opt.getAttribute('data-icon');
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    showWizardStep1Dialog,
    showResourceAndIconDialog,
    showLogsDialog,
    showCacheInfoDialog,
    showAuthRequiredDialog,
  };
})();
