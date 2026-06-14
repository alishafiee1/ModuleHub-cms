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
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-checkbox-label">
              <input type="checkbox" id="wiz-docker"> 
              <strong>اجرا در Docker</strong>
            </label>
          </div>
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-checkbox-label">
              <input type="checkbox" id="wiz-needs-process" checked> 
              <strong>نیاز به پروسه (Backend/Docker)</strong>
            </label>
            <div style="font-size:0.75rem; color:var(--text-desc); margin-top:4px; margin-right:24px;">غیرفعال = ماژول استاتیک (Static/SPA)</div>
          </div>
          <div class="form-group">
            <label class="form-label" for="wiz-port">پورت داخلی</label>
            <div style="font-size:0.75rem; color:var(--text-desc); margin-bottom:6px;">خالی = خودکار ۴۱۰۰–۴۹۹۹</div>
            <input id="wiz-port" class="swal2-input" type="number" placeholder="مثلاً 4105">
          </div>
          <div class="form-group">
            <label class="form-label" for="wiz-permissions">دسترسی‌ها</label>
            <select id="wiz-permissions" class="swal2-select">
              <option value="network">network</option>
              <option value="network+volume">network+volume</option>
              <option value="none">none</option>
            </select>
          </div>
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
          <div class="form-group">
            <label class="form-label" for="mod-name">نام ماژول</label>
            <input id="mod-name" class="swal2-input" value="${escapeHtml(data.moduleName)}" placeholder="نام کارت">
          </div>
          <div class="form-group">
            <label class="form-label" for="mod-desc">توضیحات</label>
            <textarea id="mod-desc" class="swal2-textarea" style="height: 80px;" placeholder="توضیحات کوتاه">${escapeHtml(data.moduleDesc)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">آیکون کارت</label>
            <div id="icon-selector-container" class="icon-selector">${iconOptionsHtml}</div>
            <input id="custom-icon" class="swal2-input" placeholder="آیکون سفارشی" value="${escapeHtml(data.icon)}">
          </div>
          <hr style="border:0; border-top:1px solid var(--card-glass-border); margin: 1.5rem 0;">
          <div class="form-group">
            <label class="form-label">CPU (هسته): <span id="cpu-val" style="color:#06b6d4; font-weight:700;">${data.cpu_limit}</span></label>
            <input type="range" id="cpu-limit" class="resource-slider" min="0.1" max="2" step="0.1" value="${data.cpu_limit}">
          </div>
          <div class="form-group">
            <label class="form-label">RAM (MB): <span id="ram-val" style="color:#06b6d4; font-weight:700;">${data.ram_limit_mb}</span></label>
            <input type="range" id="ram-limit" class="resource-slider" min="128" max="4096" step="64" value="${data.ram_limit_mb}">
          </div>
          <div class="form-group">
            <label class="form-label">Swap (MB): <span id="swap-val" style="color:#06b6d4; font-weight:700;">${data.swap_limit_mb}</span></label>
            <input type="range" id="swap-limit" class="resource-slider" min="0" max="1024" step="32" value="${data.swap_limit_mb}">
          </div>
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
   * Prompts for optional log level filter before viewing module logs.
   * @returns {Promise<string|null>} Selected level or null for all
   */
  async function showLogLevelPickerDialog() {
    const { value: level } = await Swal.fire({
      title: 'فیلتر سطح لاگ',
      input: 'select',
      inputOptions: {
        '': 'همه سطوح',
        info: 'info',
        error: 'error',
        debug: 'debug',
      },
      inputValue: '',
      showCancelButton: true,
      confirmButtonText: 'نمایش',
      cancelButtonText: 'انصراف',
    });
    if (level === undefined) {
      return undefined;
    }
    return level || null;
  }

  /**
   * Shows module log viewer dialog.
   * @param {string} moduleName - Display name
   * @param {string} logsContent - Log text
   * @param {string|null} levelFilter - Active level filter label
   */
  async function showLogsDialog(moduleName, logsContent, levelFilter = null) {
    const levelLabel = levelFilter ? ` · ${levelFilter}` : '';
    await Swal.fire({
      title: `لاگ‌های ماژول: ${moduleName}${levelLabel}`,
      html: `<pre style="text-align:left; direction:ltr; background:#1e1e2f; color:#f0f0f0; padding:12px; border-radius:12px; max-height:400px; overflow:auto;">${escapeHtml(logsContent)}</pre>`,
      icon: 'info',
      confirmButtonText: 'بستن',
      width: '700px',
    });
  }

  /**
   * Shows package cache info (centralized under /var/cache/modulehub/pkg).
   */
  async function showCacheInfoDialog() {
    await Swal.fire({
      title: 'کش متمرکز پکیج‌ها',
      html: `<div style="text-align:right;">
        <p>وابستگی‌های مشترک (npm/pip/composer) با هش SHA256 در کش سرور ذخیره می‌شوند.</p>
        <p>مسیر پیش‌فرض: <code>/var/cache/modulehub/pkg</code></p>
        <p>ماژول‌های با manifest یکسان در نصب بعدی از symlink استفاده می‌کنند.</p>
      </div>`,
      confirmButtonText: 'بستن',
    });
  }

  /**
   * Card description help — full markdown view from gear menu.
   * @param {{ title: string, descriptionMarkdown?: string }} options
   */
  async function showCardDescriptionHelpDialog({ title, descriptionMarkdown = '' }) {
    const trimmed = String(descriptionMarkdown || '').trim();
    const bodyHtml = trimmed
      ? `<div class="card-description-help">${window.CardMarkdown?.renderCardDescriptionFull(trimmed) || escapeHtml(trimmed).replace(/\n/g, '<br>')}</div>`
      : '<p class="card-description-help card-description-help--empty">هنوز توضیحی ننوشتی — از «اسم و توضیح» می‌تونی اضافه کنی.</p>';

    await Swal.fire({
      title: `توضیح · ${escapeHtml(title)}`,
      html: bodyHtml,
      confirmButtonText: 'بستن',
      width: '32rem',
    });
  }

  /**
   * Gear management menu — returns selected action id.
   * @param {object} moduleMeta - Module metadata from layout API
   * @param {object} options - { isSuperAdmin, statusLabel, statusClass }
   * @returns {Promise<string|null>} Action id or null when cancelled
   */
  async function showGearActionsDialog(moduleMeta, options) {
    const { isSuperAdmin, statusLabel, statusClass } = options;
    const isRunning = moduleMeta.status === 'running';
    const hasGitRepo = Boolean(moduleMeta.gitRepo && moduleMeta.gitRepo.trim());

    const actionButtons = [
      { id: 'start', label: 'Start', icon: 'fa-play', show: !isRunning },
      { id: 'stop', label: 'Stop', icon: 'fa-stop', show: isRunning },
      { id: 'restart', label: 'Restart', icon: 'fa-redo', show: true },
      { id: 'logs', label: 'مشاهده لاگ', icon: 'fa-file-alt', show: true },
      { id: 'help', label: 'توضیح کارت', icon: 'fa-circle-question', show: true },
      { id: 'edit', label: 'ویرایش تنظیمات', icon: 'fa-edit', show: true },
      { id: 'backup', label: 'پشتیبان ZIP', icon: 'fa-download', show: true },
      { id: 'github', label: 'GitHub Sync', icon: 'fa-github', show: isSuperAdmin && hasGitRepo },
      { id: 'delete', label: 'حذف ماژول', icon: 'fa-trash', show: isSuperAdmin, danger: true },
    ].filter((action) => action.show);

    const summaryHtml = `
      <div class="gear-dialog-summary">
        <div class="gear-dialog-summary__content">
          <p class="gear-dialog-summary__line">
            وضعیت: <span class="${statusClass}">${statusLabel}</span>
            <span class="gear-dialog-summary__sep">·</span>
            نسخه ${escapeHtml(moduleMeta.version)}
          </p>
          <p class="gear-dialog-summary__desc">
            CPU ${moduleMeta.resources.cpu_limit}
            <span class="gear-dialog-summary__sep">·</span>
            RAM ${moduleMeta.resources.ram_limit_mb} MB
            <span class="gear-dialog-summary__sep">·</span>
            پورت ${moduleMeta.port || '—'}
          </p>
        </div>
      </div>`;

    return openGearActionsPopup({
      title: `مدیریت · ${escapeHtml(moduleMeta.name)}`,
      summaryHtml,
      buttonsHtml: buildGearActionButtonsHtml(actionButtons),
    });
  }

  /**
   * Folder gear menu — returns selected action id.
   * @param {object} folderNode - Folder layout node
   * @returns {Promise<string|null>}
   */
  async function showFolderGearActionsDialog(folderNode) {
    const actionButtons = [
      { id: 'edit-meta', label: 'ویرایش نام و توضیح', icon: 'fa-edit', show: true },
      { id: 'move', label: 'جابجایی به پوشهٔ دیگر', icon: 'fa-folder-open', show: folderNode.id !== 'root' },
      {
        id: 'delete',
        label: 'حذف پوشه',
        icon: 'fa-trash',
        show: folderNode.id !== 'root',
        danger: true,
        fullWidth: true,
      },
    ].filter((action) => action.show);

    const gridClass = actionButtons.length === 1
      ? 'gear-actions-grid gear-actions-grid--single'
      : actionButtons.length <= 3
        ? 'gear-actions-grid gear-actions-grid--folder'
        : 'gear-actions-grid';

    return openGearActionsPopup({
      title: `مدیریت · ${escapeHtml(folderNode.name)}`,
      summaryHtml: buildFolderGearSummaryHtml(folderNode),
      buttonsHtml: buildGearActionButtonsHtml(actionButtons),
      gridClass,
    });
  }

  /**
   * Edit folder name and card description.
   * @param {object} folderNode - Current folder node
   * @returns {Promise<object|undefined>}
   */
  async function showFolderEditMetaDialog(folderNode) {
    const { value: result } = await Swal.fire({
      title: `ویرایش · ${escapeHtml(folderNode.name)}`,
      html: `
        <div class="swal-dialog-body">
          <div class="form-group">
            <label class="form-label" for="folder-edit-name">نام پوشه</label>
            <p class="form-field-hint">همونیه که بزرگ بالای کارت دیده می‌شه.</p>
            <input id="folder-edit-name" class="swal2-input" value="${escapeHtml(folderNode.name)}">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="folder-edit-desc">توضیح کارت (زیر عنوان)</label>
            <p class="form-field-hint">خط زیر عنوان — می‌تونی چند خط بنویسی. مارک‌داون هم جوابه: <strong>پررنگ</strong>، <code>کد</code>، لینک.</p>
            <textarea id="folder-edit-desc" class="swal2-textarea swal2-textarea--compact" placeholder="مثلاً: پروژه‌های تمام‌شده یا یه توضیح کوتاه">${escapeHtml(folderNode.cardDescription || '')}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'ذخیره',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      preConfirm: () => ({
        name: document.getElementById('folder-edit-name').value,
        cardDescription: document.getElementById('folder-edit-desc').value,
      }),
    });
    return result;
  }

  /**
   * Flat folder tree options for move picker.
   * @param {object} treeRoot - Layout tree root
   * @param {string} excludeFolderId - Folder being moved (disabled with descendants)
   * @param {function} isDescendant - (ancestorId, nodeId) => boolean
   * @returns {Array<{ id: string, label: string, disabled: boolean }>}
   */
  function buildFolderPickerOptions(treeRoot, excludeFolderId, isDescendant) {
    /** @type {Array<{ id: string, label: string, disabled: boolean }>} */
    const options = [];

    function walk(node, trail) {
      if (node.type !== 'folder') {
        return;
      }
      const pathLabel = [...trail, node.name].join(' / ');
      const disabled = node.id === excludeFolderId || isDescendant(excludeFolderId, node.id);
      options.push({ id: node.id, label: pathLabel, disabled });
      for (const child of node.children ?? []) {
        if (child.type === 'folder') {
          walk(child, [...trail, node.name]);
        }
      }
    }

    walk(treeRoot, []);
    return options;
  }

  /**
   * Pick destination folder for move.
   * @param {object} treeRoot - Layout tree
   * @param {string} folderId - Folder being moved
   * @param {function} isDescendantFn - Descendant check
   * @returns {Promise<string|null>}
   */
  async function showFolderMovePickerDialog(treeRoot, folderId, isDescendantFn) {
    const options = buildFolderPickerOptions(treeRoot, folderId, isDescendantFn);
    const optionsHtml = buildSwalOptionListHtml(options, 'folder-move-target');

    const { value: confirmed } = await Swal.fire({
      title: 'جابجایی پوشه',
      html: `
        <div class="swal-dialog-body">
          <p class="swal-dialog-lead">مقصد جدید را انتخاب کنید:</p>
          <div class="swal-option-list">${optionsHtml}</div>
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'جابجایی',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      customClass: { popup: 'swal-form-dialog' },
      preConfirm: () => {
        const selected = document.querySelector('input[name="folder-move-target"]:checked');
        if (!selected) {
          Swal.showValidationMessage('یک مقصد انتخاب کنید');
          return false;
        }
        return selected.value;
      },
    });

    return confirmed || null;
  }

  /**
   * Delete folder wizard — content policy selection.
   * @param {object} folderNode - Folder to delete
   * @param {number} childCount - Direct children count
   * @returns {Promise<object|null>} Delete API body or null
   */
  async function showFolderDeleteWizardDialog(folderNode, childCount) {
    if (childCount === 0) {
      const confirmEmpty = await Swal.fire({
        title: 'حذف پوشه',
        text: `پوشهٔ «${folderNode.name}» حذف شود؟`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'حذف',
        cancelButtonText: 'انصراف',
        confirmButtonColor: '#d33',
      });
      if (!confirmEmpty.isConfirmed) {
        return null;
      }
      return { contentPolicy: 'reject-if-not-empty' };
    }

    const policyOptions = [
      { id: 'move-to-parent', label: 'انتقال به پوشهٔ والد', disabled: false },
      { id: 'move-to-folder', label: 'انتقال به پوشهٔ دیگر', disabled: false },
      { id: 'cascade-delete', label: 'حذف کامل همراه محتوا (خطر)', disabled: false, danger: true },
    ];

    const { value: policy } = await Swal.fire({
      title: 'حذف پوشه',
      html: `
        <div class="swal-dialog-body">
          <p class="swal-dialog-lead">داخل «${escapeHtml(folderNode.name)}» ${childCount} مورد هست. با محتوا چه کنیم؟</p>
          <div class="swal-option-list">${buildSwalOptionListHtml(policyOptions, 'del-policy')}</div>
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'ادامه',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      customClass: { popup: 'swal-form-dialog' },
      preConfirm: () => {
        const selected = document.querySelector('input[name="del-policy"]:checked');
        if (!selected) {
          Swal.showValidationMessage('یک گزینه انتخاب کنید');
          return false;
        }
        return selected.value;
      },
    });

    if (!policy) {
      return null;
    }

    if (policy === 'cascade-delete') {
      const { value: confirmName } = await Swal.fire({
        title: 'تأیید حذف کامل',
        html: `<p style="text-align:right;">برای حذف همهٔ محتوا، نام پوشه را تایپ کنید:<br><strong>${escapeHtml(folderNode.name)}</strong></p>`,
        input: 'text',
        inputPlaceholder: folderNode.name,
        showCancelButton: true,
        confirmButtonText: 'حذف همه',
        cancelButtonText: 'انصراف',
        confirmButtonColor: '#d33',
      });
      if (!confirmName) {
        return null;
      }
      return { contentPolicy: 'cascade-delete', confirmName };
    }

    if (policy === 'move-to-folder') {
      return { contentPolicy: 'move-to-folder', _needsTarget: true };
    }

    return { contentPolicy: policy };
  }

  /**
   * Edit module dialog — resources, name, version, git, management password.
   * @param {object} moduleMeta - Current module metadata
   * @param {boolean} isSuperAdmin - Whether password fields are shown
   * @param {{ cardDescription?: string }} [extras] - Layout card fields
   * @returns {Promise<object|undefined>}
   */
  async function showModuleEditDialog(moduleMeta, isSuperAdmin, extras = {}) {
    const passwordFields = isSuperAdmin ? `
      <hr style="border:0; border-top:1px solid var(--card-glass-border); margin: 1.5rem 0;">
      <div class="form-group">
        <label class="form-label" for="edit-mgmt-pass">رمز Module Manager</label>
        <div style="font-size:0.75rem; color:var(--text-desc); margin-bottom:6px;">خالی = بدون تغییر</div>
        <input id="edit-mgmt-pass" type="password" class="swal2-input" placeholder="رمز جدید">
      </div>
      <div class="form-group" style="margin-bottom: 1.25rem;">
        <label class="form-checkbox-label">
          <input type="checkbox" id="edit-clear-pass"> 
          <strong>حذف رمز Module Manager</strong>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-git-repo">آدرس GitHub (gitRepo)</label>
        <input id="edit-git-repo" class="swal2-input" value="${escapeHtml(moduleMeta.gitRepo || '')}" placeholder="https://github.com/user/repo.git">
      </div>
    ` : '';

    const { value: result } = await Swal.fire({
      title: `ویرایش · ${escapeHtml(moduleMeta.name)}`,
      html: `
        <div style="text-align:right;">
          <div class="form-group">
            <label class="form-label" for="edit-name">نام</label>
            <input id="edit-name" class="swal2-input" value="${escapeHtml(moduleMeta.name)}">
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-version">نسخه</label>
            <input id="edit-version" class="swal2-input" value="${escapeHtml(moduleMeta.version)}">
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-card-desc">توضیح کارت (زیر عنوان)</label>
            <p class="form-field-hint">همین متن روی کارت دیده می‌شه — می‌تونی چند خط و مارک‌داون بنویسی.</p>
            <textarea id="edit-card-desc" class="swal2-textarea" style="height: 64px;" placeholder="روی کارت دیده می‌شود">${escapeHtml(extras.cardDescription || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-changelog">یادداشت نسخه (changelog)</label>
            <p class="form-field-hint">فقط برای خودت و تاریخچهٔ نسخه — روی کارت نیست مگر توضیح کارت خالی باشه.</p>
            <textarea id="edit-changelog" class="swal2-textarea" style="height: 80px;">${escapeHtml(moduleMeta.changelog || '')}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">CPU: <span id="edit-cpu-val" style="color:#06b6d4; font-weight:700;">${moduleMeta.resources.cpu_limit}</span></label>
            <input type="range" id="edit-cpu" class="resource-slider" min="0.1" max="2" step="0.1" value="${moduleMeta.resources.cpu_limit}">
          </div>
          <div class="form-group">
            <label class="form-label">RAM (MB): <span id="edit-ram-val" style="color:#06b6d4; font-weight:700;">${moduleMeta.resources.ram_limit_mb}</span></label>
            <input type="range" id="edit-ram" class="resource-slider" min="128" max="4096" step="64" value="${moduleMeta.resources.ram_limit_mb}">
          </div>
          ${passwordFields}
        </div>
      `,
      focusConfirm: false,
      confirmButtonText: 'ذخیره',
      cancelButtonText: 'انصراف',
      showCancelButton: true,
      preConfirm: () => {
        const payload = {
          name: document.getElementById('edit-name').value,
          version: document.getElementById('edit-version').value,
          cardDescription: document.getElementById('edit-card-desc').value,
          changelog: document.getElementById('edit-changelog').value,
          resources: {
            cpu_limit: parseFloat(document.getElementById('edit-cpu').value),
            ram_limit_mb: parseInt(document.getElementById('edit-ram').value, 10),
          },
        };
        if (isSuperAdmin) {
          const gitInput = document.getElementById('edit-git-repo');
          if (gitInput) {
            payload.gitRepo = gitInput.value.trim();
          }
          const clearPass = document.getElementById('edit-clear-pass');
          if (clearPass && clearPass.checked) {
            payload.clearManagementPassword = true;
          } else {
            const passInput = document.getElementById('edit-mgmt-pass');
            const passValue = passInput ? passInput.value : '';
            if (passValue) {
              payload.managementPasswordPlain = passValue;
            }
          }
        }
        return payload;
      },
      didOpen: () => {
        const cpuSlider = document.getElementById('edit-cpu');
        const ramSlider = document.getElementById('edit-ram');
        cpuSlider.addEventListener('input', () => {
          document.getElementById('edit-cpu-val').innerText = cpuSlider.value;
        });
        ramSlider.addEventListener('input', () => {
          document.getElementById('edit-ram-val').innerText = ramSlider.value;
        });
      },
    });
    return result;
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

  /**
   * buildGearActionButtonsHtml --- action grid buttons for gear dialogs ---
   * @param {Array<{ id: string, label: string, icon: string, danger?: boolean, fullWidth?: boolean }>} actions
   */
  function buildGearActionButtonsHtml(actions) {
    return actions.map((action) => `
      <button type="button"
        class="gear-action-btn${action.danger ? ' gear-action-danger' : ''}${action.fullWidth ? ' gear-action-btn--full' : ''}"
        data-action="${action.id}">
        <i class="fas ${action.icon}"></i>
        <span>${action.label}</span>
      </button>
    `).join('');
  }

  /** bindGearActionButtons --- wire gear grid clicks to Swal.close ---
   * @param {ParentNode} [root]
   */
  function bindGearActionButtons(root = document) {
    root.querySelectorAll('.gear-action-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const actionId = button.getAttribute('data-action');
        Swal.close({ isConfirmed: true, value: actionId });
      });
    });
  }

  /**
   * openGearActionsPopup --- shared shell for module/folder gear menus ---
   */
  async function openGearActionsPopup({
    title,
    summaryHtml,
    buttonsHtml,
    gridClass = 'gear-actions-grid',
    width = '420px',
  }) {
    const result = await Swal.fire({
      title,
      html: `<div class="swal-dialog-body">${summaryHtml}<div class="${gridClass}">${buttonsHtml}</div></div>`,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'بستن',
      width,
      customClass: { popup: 'swal-gear-dialog' },
      didOpen: (popup) => bindGearActionButtons(popup),
    });
    return result.isConfirmed ? (result.value || null) : null;
  }

  /**
   * buildFolderGearSummaryHtml --- meta block matching module gear dialog density ---
   */
  function buildFolderGearSummaryHtml(folderNode) {
    const childCount = folderNode.children?.length ?? 0;
    const childLabel = childCount === 0
      ? 'پوشه خالی'
      : `${childCount} مورد داخل پوشه`;
    const descriptionLine = folderNode.cardDescription
      ? `<p class="gear-dialog-summary__desc">${escapeHtml(folderNode.cardDescription)}</p>`
      : '<p class="gear-dialog-summary__desc gear-dialog-summary__desc--muted">توضیح کارت تنظیم نشده</p>';

    return `
      <div class="gear-dialog-summary gear-dialog-summary--folder">
        <div class="gear-dialog-summary__icon" aria-hidden="true">
          <i class="fas fa-folder"></i>
        </div>
        <div class="gear-dialog-summary__content">
          <p class="gear-dialog-summary__line">
            <span class="gear-dialog-summary__badge">${childLabel}</span>
            <span class="gear-dialog-summary__sep">·</span>
            <span>پوشه مجازی</span>
          </p>
          ${descriptionLine}
        </div>
      </div>`;
  }

  /**
   * buildSwalOptionListHtml --- styled radio list for move/policy pickers ---
   */
  function buildSwalOptionListHtml(options, inputName) {
    return options.map((opt) => `
      <label class="swal-option-item${opt.disabled ? ' is-disabled' : ''}${opt.danger ? ' is-danger' : ''}">
        <input type="radio" name="${inputName}" value="${escapeHtml(opt.id)}" ${opt.disabled ? 'disabled' : ''}>
        <span class="swal-option-item__text">${escapeHtml(opt.label)}</span>
      </label>
    `).join('');
  }

  return {
    showWizardStep1Dialog,
    showResourceAndIconDialog,
    showLogLevelPickerDialog,
    showLogsDialog,
    showCacheInfoDialog,
    showAuthRequiredDialog,
    showGearActionsDialog,
    showCardDescriptionHelpDialog,
    showFolderGearActionsDialog,
    showFolderEditMetaDialog,
    showFolderMovePickerDialog,
    showFolderDeleteWizardDialog,
    showModuleEditDialog,
  };
})();
