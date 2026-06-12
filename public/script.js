// script.js — home page: layout from API, breadcrumb, cards, theme, auth-aware admin UI
(function initModuleHubHome() {
  const ROOT_ID = 'root';
  let siteLayout = null;
  let siteAppearance = { backgroundMode: 'none', iconTheme: 'mixed' };
  let currentFolderId = ROOT_ID;
  let authStatus = { isSuperAdmin: false, managedModuleIds: [] };
  let lastContentHeight = 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Finds a node in the layout tree by id.
   * @param {object} node - Tree node
   * @param {string} nodeId - Target id
   * @returns {object|null}
   */
  function findNodeById(node, nodeId) {
    if (node.id === nodeId) {
      return node;
    }
    if (!node.children) {
      return null;
    }
    for (const child of node.children) {
      const match = findNodeById(child, nodeId);
      if (match) {
        return match;
      }
    }
    return null;
  }

  /**
   * Builds breadcrumb segments from root to folder.
   * @param {string} folderId - Current folder id
   * @returns {Array<{id: string, name: string}>}
   */
  function buildBreadcrumbPath(folderId) {
    const path = [];

    function walk(node, trail) {
      const nextTrail = [...trail, { id: node.id, name: node.name }];
      if (node.id === folderId) {
        path.push(...nextTrail);
        return true;
      }
      if (!node.children) {
        return false;
      }
      for (const child of node.children) {
        if (walk(child, nextTrail)) {
          return true;
        }
      }
      return false;
    }

    walk(siteLayout.tree, []);
    return path;
  }

  /**
   * Reads folder id from URL query string.
   * @returns {string|null}
   */
  function getFolderIdFromUrl() {
    const folderId = new URLSearchParams(window.location.search).get('folder');
    return folderId?.trim() || null;
  }

  /**
   * Builds browser URL for a folder view.
   * @param {string} folderId - Target folder id
   * @returns {string}
   */
  function buildFolderUrl(folderId) {
    if (!folderId || folderId === ROOT_ID) {
      return '/';
    }
    return `/?folder=${encodeURIComponent(folderId)}`;
  }

  /**
   * Returns folder id if it exists in layout, otherwise root.
   * @param {string} folderId - Candidate folder id
   * @returns {string}
   */
  function resolveValidFolderId(folderId) {
    if (!siteLayout?.tree || !folderId || folderId === ROOT_ID) {
      return ROOT_ID;
    }
    const node = findNodeById(siteLayout.tree, folderId);
    return node?.type === 'folder' ? folderId : ROOT_ID;
  }

  /**
   * Returns parent folder id for breadcrumb back navigation.
   * @param {string} folderId - Current folder id
   * @returns {string}
   */
  function getParentFolderId(folderId) {
    const path = buildBreadcrumbPath(folderId);
    if (path.length < 2) {
      return ROOT_ID;
    }
    return path[path.length - 2].id;
  }

  /**
   * Navigates to a folder and syncs browser history.
   * @param {string} folderId - Target folder id
   * @param {{ replace?: boolean }} [options] - Use replaceState instead of pushState
   */
  function navigateToFolder(folderId, options = {}) {
    if (!siteLayout?.tree) {
      return;
    }
    const validFolderId = resolveValidFolderId(folderId);
    if (!options.replace && validFolderId === currentFolderId) {
      return;
    }
    const isFolderChange = validFolderId !== currentFolderId;
    currentFolderId = validFolderId;
    const url = buildFolderUrl(validFolderId);
    const state = { folderId: validFolderId };
    if (options.replace) {
      history.replaceState(state, '', url);
    } else {
      history.pushState(state, '', url);
    }

    if (!options.replace && isFolderChange && !prefersReducedMotion) {
      const grid = document.getElementById('cardsGrid');
      grid.classList.add('grid-cards--navigating');
      window.setTimeout(() => {
        grid.classList.remove('grid-cards--navigating');
        renderAll();
      }, 120);
      return;
    }
    renderAll();
  }

  /**
   * Staggered enter animation for cards after grid render.
   * @param {HTMLElement} container - Cards grid element
   */
  function applyCardEnterAnimations(container) {
    if (prefersReducedMotion) {
      return;
    }
    const cards = container.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.classList.add('card-enter');
      card.style.animationDelay = `${index * 40}ms`;
    });
  }

  /**
   * Scrolls to top when breadcrumb/grid height changes (avoids stray scroll offset).
   */
  function maybeScrollToTopAfterLayout() {
    const breadcrumb = document.getElementById('breadcrumbArea');
    const grid = document.getElementById('cardsGrid');
    const contentHeight = (breadcrumb?.offsetHeight || 0) + (grid?.offsetHeight || 0);
    if (contentHeight !== lastContentHeight) {
      lastContentHeight = contentHeight;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  /**
   * Returns localized status label and CSS class.
   * @param {string} status - running | stopped | crashed
   * @returns {{ label: string, cssClass: string }}
   */
  function getStatusDisplay(status) {
    if (status === 'running') {
      return { label: 'فعال', cssClass: 'status-running' };
    }
    if (status === 'crashed') {
      return { label: 'خطا', cssClass: 'status-crashed' };
    }
    return { label: 'متوقف', cssClass: 'status-stopped' };
  }

  /**
   * Checks if user can manage a specific module.
   * @param {string} moduleId - Module id
   * @returns {boolean}
   */
  function canManageModule(moduleId) {
    if (authStatus.isSuperAdmin) {
      return true;
    }
    return authStatus.managedModuleIds.includes(moduleId);
  }

  /**
   * Reloads layout and auth state from backend.
   */
  async function refreshFromServer() {
    authStatus = await ModuleHubApi.loadAuthStatus();
    siteLayout = await ModuleHubApi.loadLayout();
    if (siteLayout.appearance) {
      siteAppearance = siteLayout.appearance;
    }
    if (window.HomeFloatingBackground) {
      window.HomeFloatingBackground.updateAppearance(siteAppearance);
    }
    updateAdminLoginLink();
    currentFolderId = resolveValidFolderId(currentFolderId);
    renderAll();
  }

  function updateAdminLoginLink() {
    AdminMenu.update(authStatus.isSuperAdmin);
  }

  function renderBreadcrumb() {
    const container = document.getElementById('breadcrumbArea');
    const path = buildBreadcrumbPath(currentFolderId);
    const rootNode = siteLayout.tree;

    let html = `<div class="breadcrumb-list">
      <div class="breadcrumb-item" data-folder="${rootNode.id}">
        <i class="fas fa-home"></i> ${rootNode.name}
      </div>`;

    for (const segment of path.slice(1)) {
      html += `<span class="separator"> / </span>
        <div class="breadcrumb-item" data-folder="${segment.id}">${segment.name}</div>`;
    }
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.breadcrumb-item').forEach((element) => {
      element.addEventListener('click', () => {
        const folderId = element.getAttribute('data-folder');
        const folderNode = findNodeById(siteLayout.tree, folderId);
        if (folderNode && folderNode.type === 'folder') {
          navigateToFolder(folderId);
        }
      });
    });
  }

  function renderCards() {
    const container = document.getElementById('cardsGrid');
    const folderNode = findNodeById(siteLayout.tree, currentFolderId);
    if (!folderNode || folderNode.type !== 'folder') {
      container.innerHTML = '<div class="loading-state">پوشه یافت نشد.</div>';
      return;
    }

    const children = folderNode.children || [];
    let html = '';

    if (currentFolderId !== ROOT_ID) {
      const parentFolderId = getParentFolderId(currentFolderId);
      const parentPath = buildBreadcrumbPath(currentFolderId);
      const parentName = parentPath[parentPath.length - 2]?.name || 'خانه';
      html += `
        <div class="card back-card" data-type="back" data-folder="${parentFolderId}">
          <div class="card-content">
            <div class="card-icon">
              <div class="card-icon-img"><i class="fas fa-arrow-right"></i></div>
            </div>
            <div class="card-title">بازگشت</div>
            <div class="card-desc">${parentName}</div>
          </div>
        </div>`;
    }

    for (const child of children) {
      const isFolder = child.type === 'folder';
      const moduleMeta = !isFolder && child.moduleId ? siteLayout.modules[child.moduleId] : null;
      const displayName = isFolder ? child.name : (moduleMeta?.name || child.name);
      const iconClass = isFolder ? 'fas fa-folder' : (moduleMeta?.icon || 'fas fa-puzzle-piece');
      const thumbnail = moduleMeta?.thumbnail || '';
      const iconHtml = thumbnail
        ? `<img src="${thumbnail}" class="thumbnail-icon" alt="">`
        : `<i class="${iconClass}"></i>`;

      let statusHtml = '';
      if (moduleMeta) {
        const statusDisplay = getStatusDisplay(moduleMeta.status);
        statusHtml = `<div class="status-badge ${statusDisplay.cssClass}">
          <i class="fas fa-circle"></i> ${statusDisplay.label}
        </div>`;
      }

      const resourceHint = moduleMeta?.resources
        ? `<div style="font-size:0.65rem; margin-top:4px;">
            CPU: ${moduleMeta.resources.cpu_limit} | RAM: ${moduleMeta.resources.ram_limit_mb}MB
          </div>`
        : '';

      const descriptionHtml = !isFolder && moduleMeta?.changelog
        ? `<div class="card-desc">${moduleMeta.changelog}</div>`
        : '';

      html += `
        <div class="card ${isFolder ? 'folder-card' : 'module-card'}" data-id="${child.id}" data-type="${child.type}" data-module-id="${child.moduleId || ''}">
          <div class="card-content">
            <div class="card-icon">
              <div class="card-icon-img">${iconHtml}</div>
              <div class="gear-icon" data-gear-id="${child.id}" data-module-id="${child.moduleId || ''}">
                <i class="fas fa-cog"></i>
              </div>
            </div>
            <div class="card-title">${displayName}</div>
            ${descriptionHtml}
            ${statusHtml}
            ${resourceHint}
          </div>
        </div>`;
    }

    if (authStatus.isSuperAdmin) {
      html += `
        <div class="card add-card" id="addNewCardBtn">
          <div class="card-content">
            <i class="fas fa-plus-circle"></i>
            <div class="card-title">افزودن محتوا</div>
          </div>
        </div>`;
    }

    container.innerHTML = html || '<div class="loading-state">این پوشه خالی است.</div>';
    applyCardEnterAnimations(container);
    requestAnimationFrame(() => maybeScrollToTopAfterLayout());

    container.querySelectorAll('.card:not(.add-card)').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.gear-icon')) {
          return;
        }
        const nodeType = card.getAttribute('data-type');
        if (nodeType === 'back') {
          navigateToFolder(card.getAttribute('data-folder'));
          return;
        }
        const nodeId = card.getAttribute('data-id');
        if (nodeType === 'folder') {
          navigateToFolder(nodeId);
          return;
        }
        const targetModuleId = card.getAttribute('data-module-id');
        if (targetModuleId) {
          window.location.href = `/modules/${targetModuleId}/`;
        }
      });

      const gear = card.querySelector('.gear-icon');
      if (gear) {
        gear.addEventListener('click', (event) => {
          event.stopPropagation();
          void openGearMenu(card);
        });
      }
    });

    const addButton = document.getElementById('addNewCardBtn');
    if (addButton) {
      addButton.addEventListener('click', () => { void openAddMenu(); });
    }
  }

  async function openGearMenu(cardElement) {
    const moduleId = cardElement.getAttribute('data-module-id');
    const nodeType = cardElement.getAttribute('data-type');

    if (nodeType === 'folder') {
      if (!authStatus.isSuperAdmin) {
        await promptLogin();
      } else {
        Swal.fire({ icon: 'info', title: 'پوشه', text: 'مدیریت پوشه در فاز بعدی.' });
      }
      return;
    }

    const moduleMeta = siteLayout.modules[moduleId];
    if (!moduleMeta) {
      return;
    }

    if (!canManageModule(moduleId)) {
      const action = await ModuleDialogs.showAuthRequiredDialog(moduleMeta.hasManagementPassword);
      if (action === 'login') {
        window.location.href = '/admin/login';
      } else if (action === 'module-password') {
        const { value: modulePassword } = await Swal.fire({
          title: 'رمز Module Manager',
          input: 'password',
          inputPlaceholder: 'رمز مدیریت ماژول',
          showCancelButton: true,
          confirmButtonText: 'ورود',
          cancelButtonText: 'انصراف',
        });
        if (!modulePassword) {
          return;
        }
        try {
          await ModuleHubApi.authenticateModule(moduleId, modulePassword);
          await refreshFromServer();
          await openGearMenu(cardElement);
        } catch (error) {
          Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
        }
      }
      return;
    }

    const statusDisplay = getStatusDisplay(moduleMeta.status);
    const action = await ModuleDialogs.showGearActionsDialog(moduleMeta, {
      isSuperAdmin: authStatus.isSuperAdmin,
      statusLabel: statusDisplay.label,
      statusClass: statusDisplay.cssClass,
    });

    if (!action) {
      return;
    }

    await handleGearAction(moduleId, moduleMeta, action);
  }

  /**
   * Executes a gear menu action for a module.
   * @param {string} moduleId - Module id
   * @param {object} moduleMeta - Module metadata
   * @param {string} action - Action id from gear dialog
   */
  async function handleGearAction(moduleId, moduleMeta, action) {
    try {
      if (action === 'start') {
        await ModuleHubApi.startModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول استارت شد', timer: 1200, showConfirmButton: false });
        return;
      }
      if (action === 'stop') {
        await ModuleHubApi.stopModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول متوقف شد', timer: 1200, showConfirmButton: false });
        return;
      }
      if (action === 'restart') {
        await ModuleHubApi.restartModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول ری‌استارت شد', timer: 1200, showConfirmButton: false });
        return;
      }
      if (action === 'logs') {
        const levelFilter = await ModuleDialogs.showLogLevelPickerDialog();
        if (levelFilter === undefined) {
          return;
        }
        const logResult = await ModuleHubApi.fetchModuleLogs(moduleId, levelFilter);
        const content = logResult.content || '(لاگ خالی است)';
        await ModuleDialogs.showLogsDialog(moduleMeta.name, content, levelFilter);
        const downloadChoice = await Swal.fire({
          title: 'دانلود لاگ کامل؟',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'دانلود',
          cancelButtonText: 'بستن',
        });
        if (downloadChoice.isConfirmed) {
          ModuleHubApi.downloadModuleLogs(moduleId);
        }
        return;
      }
      if (action === 'edit') {
        const editPayload = await ModuleDialogs.showModuleEditDialog(
          moduleMeta,
          authStatus.isSuperAdmin,
        );
        if (!editPayload) {
          return;
        }
        await ModuleHubApi.updateModule(moduleId, editPayload);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'تنظیمات ذخیره شد', timer: 1200, showConfirmButton: false });
        return;
      }
      if (action === 'backup') {
        ModuleHubApi.downloadModuleBackup(moduleId);
        Swal.fire({ icon: 'success', title: 'دانلود پشتیبان شروع شد', timer: 1500, showConfirmButton: false });
        return;
      }
      if (action === 'github') {
        Swal.fire({ title: 'همگام‌سازی GitHub...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const syncResult = await ModuleHubApi.syncModuleGitHub(moduleId);
        Swal.close();
        await refreshFromServer();
        Swal.fire({
          icon: 'success',
          title: 'همگام‌سازی انجام شد',
          html: `<pre style="text-align:left; direction:ltr; font-size:0.75rem;">${syncResult.gitOutput || ''}</pre>`,
        });
        return;
      }
      if (action === 'delete') {
        const confirmDelete = await Swal.fire({
          title: 'حذف ماژول',
          text: `آیا از حذف «${moduleMeta.name}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'حذف',
          cancelButtonText: 'انصراف',
          confirmButtonColor: '#d33',
        });
        if (!confirmDelete.isConfirmed) {
          return;
        }
        await ModuleHubApi.deleteModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول حذف شد', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  async function promptLogin() {
    const result = await Swal.fire({
      title: 'ورود Super Admin',
      text: 'برای افزودن یا مدیریت محتوا باید وارد شوید.',
      icon: 'info',
      confirmButtonText: 'ورود',
      showCancelButton: true,
      cancelButtonText: 'انصراف',
    });
    if (result.isConfirmed) {
      window.location.href = '/admin/login';
    }
  }

  async function openAddMenu() {
    const choice = await Swal.fire({
      title: 'افزودن محتوا',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'آپلود ZIP',
      denyButtonText: 'پوشه جدید',
      cancelButtonText: 'انصراف',
    });

    if (choice.isConfirmed) {
      await runUploadWizard();
    } else if (choice.isDenied) {
      await runCreateFolderFlow();
    }
  }

  async function runCreateFolderFlow() {
    const { value: name } = await Swal.fire({
      title: 'پوشه جدید',
      input: 'text',
      inputPlaceholder: 'نام پوشه',
      showCancelButton: true,
      confirmButtonText: 'ایجاد',
      cancelButtonText: 'انصراف',
    });
    if (!name) {
      return;
    }
    try {
      await ModuleHubApi.createFolder(currentFolderId, name);
      await refreshFromServer();
      Swal.fire({ icon: 'success', title: 'پوشه ایجاد شد', timer: 1200, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  async function runUploadWizard() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      try {
        Swal.fire({ title: 'در حال آپلود...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const uploadResult = await ModuleHubApi.uploadZip(file);
        Swal.close();

        const step1 = await ModuleDialogs.showWizardStep1Dialog();
        if (!step1) {
          return;
        }

        const step2 = await ModuleDialogs.showResourceAndIconDialog({ moduleName: file.name.replace(/\.zip$/i, '') });
        if (!step2) {
          return;
        }

        const needsProcess = step1.needsProcess;
        const manualPort = step1.port ? parseInt(step1.port, 10) : null;

        await ModuleHubApi.saveWizard({
          moduleId: uploadResult.moduleId,
          parentId: currentFolderId,
          name: step2.moduleName || file.name,
          changelog: step2.moduleDesc || 'نسخه اولیه',
          docker: step1.docker,
          port: needsProcess && manualPort ? manualPort : null,
          permissions: step1.permissions,
          needsProcess,
          resources: {
            cpu_limit: step2.cpu_limit,
            ram_limit_mb: step2.ram_limit_mb,
            swap_limit_mb: step2.swap_limit_mb,
            disk_iops: 100,
            net_mbps: 10,
          },
          icon: step2.icon,
          thumbnail: '',
        });

        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول ثبت شد', text: 'وضعیت: متوقف — از ⚙ استارت کنید', timer: 2500 });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
      }
    };
  }

  function renderAll() {
    renderBreadcrumb();
    renderCards();
  }

  function initDarkMode() {
    const darkToggle = document.getElementById('darkModeToggle');
    const label = document.getElementById('darkModeLabel');
    if (!darkToggle || !label) {
      return;
    }

    const isDark = window.ModuleHubTheme?.isDark() ?? document.body.classList.contains('dark');
    label.textContent = isDark ? 'لایت مود' : 'دارک مود';

    darkToggle.addEventListener('click', () => {
      const nowDark = window.ModuleHubTheme
        ? window.ModuleHubTheme.toggle()
        : document.body.classList.toggle('dark');
      label.textContent = nowDark ? 'لایت مود' : 'دارک مود';
      if (window.HomeFloatingBackground) {
        window.HomeFloatingBackground.updateTheme();
      }
    });
  }

  window.addEventListener('popstate', (event) => {
    if (!siteLayout?.tree) {
      return;
    }
    const folderId = event.state?.folderId ?? getFolderIdFromUrl() ?? ROOT_ID;
    currentFolderId = resolveValidFolderId(folderId);
    renderAll();
  });

  initDarkMode();
  if (window.HomeFloatingBackground) {
    window.HomeFloatingBackground.init();
  }
  AdminMenu.mount('adminAuthMenuHost', { onAfterLogout: refreshFromServer });

  refreshFromServer()
    .then(() => {
      navigateToFolder(resolveValidFolderId(getFolderIdFromUrl() || ROOT_ID), { replace: true });
    })
    .catch((error) => {
      document.getElementById('cardsGrid').innerHTML =
        `<div class="loading-state">خطا در بارگذاری: ${error.message}</div>`;
    });
})();
