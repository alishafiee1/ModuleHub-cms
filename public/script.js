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
   * purpose --- escapes a string for safe use in an HTML attribute value ---
   * @param {string} str
   * @returns {string}
   */
  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

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
   * purpose --- merges saved folder card order/grid/backgrounds into in-memory siteLayout ---
   * @param {string} folderId - Folder node id
   * @param {Array<{ nodeId: string, cardGrid?: object, cardBackground?: object|null }>} cards - Saved payload
   */
  function applyFolderCardsToLocalLayout(folderId, cards) {
    if (!siteLayout?.tree) {
      return;
    }
    const folderNode = findNodeById(siteLayout.tree, folderId);
    if (!folderNode || folderNode.type !== 'folder' || !folderNode.children) {
      return;
    }
    const existingById = new Map(folderNode.children.map((child) => [child.id, child]));
    folderNode.children = cards.map((entry) => {
      const original = existingById.get(entry.nodeId);
      if (!original) {
        return null;
      }
      const updated = { ...original };
      if (entry.cardGrid) {
        updated.cardGrid = entry.cardGrid;
        delete updated.cardSpan;
      }
      if (entry.cardBackground === null) {
        delete updated.cardBackground;
      } else if (entry.cardBackground !== undefined) {
        updated.cardBackground = entry.cardBackground;
      }
      return updated;
    }).filter(Boolean);
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
  async function navigateToFolder(folderId, options = {}) {
    if (!siteLayout?.tree) {
      return;
    }
    const validFolderId = resolveValidFolderId(folderId);
    if (!options.replace && validFolderId === currentFolderId) {
      return;
    }
    const isFolderChange = validFolderId !== currentFolderId;

    if (isFolderChange && window.CardLayoutEditor?.flushAndReset) {
      await window.CardLayoutEditor.flushAndReset();
    } else if (isFolderChange && window.CardLayoutEditor) {
      window.CardLayoutEditor.reset();
    }

    currentFolderId = validFolderId;
    const url = buildFolderUrl(validFolderId);
    const state = { folderId: validFolderId };
    if (options.replace) {
      history.replaceState(state, '', url);
    } else {
      history.pushState(state, '', url);
    }

    if (!options.replace && isFolderChange && !prefersReducedMotion) {
      if (window.CardCanvas) {
        window.CardCanvas.setNavigating(true);
      }
      window.setTimeout(() => {
        if (window.CardCanvas) {
          window.CardCanvas.setNavigating(false);
        }
        renderAll();
      }, 120);
      return;
    }
    renderAll();
  }

  /**
   * Scrolls to top when breadcrumb/canvas height changes (avoids stray scroll offset).
   */
  function maybeScrollToTopAfterLayout() {
    const breadcrumb = document.getElementById('breadcrumbArea');
    const canvas = document.getElementById('cardCanvas');
    const contentHeight = (breadcrumb?.offsetHeight || 0) + (canvas?.offsetHeight || 0);
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
    if (window.CardLayoutEditor) {
      window.CardLayoutEditor.setAdminToolbarVisible(authStatus.isSuperAdmin);
    }
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
    const folderNode = findNodeById(siteLayout.tree, currentFolderId);
    if (!window.CardCanvas) {
      return;
    }
    if (!folderNode || folderNode.type !== 'folder') {
      window.CardCanvas.showEmptyState('پوشه یافت نشد.');
      return;
    }

    const children = folderNode.children || [];
    const path = buildBreadcrumbPath(currentFolderId);
    const context = currentFolderId !== ROOT_ID
      ? {
        showBackCard: true,
        parentFolderId: getParentFolderId(currentFolderId),
        parentName: path[path.length - 2]?.name || 'خانه',
      }
      : {};

    if (children.length === 0 && !context.showBackCard) {
      window.CardCanvas.showEmptyState('این پوشه خالی است.');
    } else {
      window.CardCanvas.refresh(children, context);
    }

    requestAnimationFrame(() => maybeScrollToTopAfterLayout());
    if (window.CardLayoutEditor) {
      window.CardLayoutEditor.refresh();
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
    void navigateToFolder(folderId, { replace: true });
  });

  window.addEventListener('modulehub:folder-cards-saved', (event) => {
    const detail = event.detail || {};
    if (detail.folderId && detail.cards) {
      applyFolderCardsToLocalLayout(detail.folderId, detail.cards);
    }
  });

  window.addEventListener('modulehub:add-content', () => {
    void openAddMenu();
  });

  initDarkMode();
  if (window.HomeFloatingBackground) {
    window.HomeFloatingBackground.init();
  }
  AdminMenu.mount('adminAuthMenuHost', { onAfterLogout: refreshFromServer });

  function initCardCanvasHooks() {
    if (!window.CardCanvas) {
      return;
    }
    window.CardCanvas.init({
      getModules: () => siteLayout?.modules || {},
      getAuthStatus: () => authStatus,
      canManageModule,
      onNavigateBack: (folderId) => { void navigateToFolder(folderId); },
      onNavigateFolder: (nodeId) => { void navigateToFolder(nodeId); },
      onNavigateModule: (moduleId) => {
        window.location.href = `/modules/${moduleId}/`;
      },
      onGearClick: (nodeId) => {
        const element = window.CardCanvas.getCardElement(nodeId);
        if (element) {
          void openGearMenu(element);
        }
      },
      onCardSettled: () => {
        if (window.CardLayoutEditor?.scheduleSaveFromCanvas) {
          window.CardLayoutEditor.scheduleSaveFromCanvas();
        }
      },
      onOpenBackground: (element) => {
        if (window.CardLayoutEditor?.openBackgroundForCard) {
          void window.CardLayoutEditor.openBackgroundForCard(element);
        }
      },
      onAddContent: () => { void openAddMenu(); },
    });
  }

  function bootHomePage() {
    initCardCanvasHooks();
    if (window.CardLayoutEditor) {
      window.CardLayoutEditor.mount({
        getFolderId: () => currentFolderId,
      });
    }
    refreshFromServer()
      .then(() => {
        navigateToFolder(resolveValidFolderId(getFolderIdFromUrl() || ROOT_ID), { replace: true });
        updateAdminLoginLink();
      })
      .catch((error) => {
        if (window.CardCanvas) {
          window.CardCanvas.showEmptyState(`خطا در بارگذاری: ${error.message}`);
        }
      });
  }

  if (window.CardCanvas) {
    bootHomePage();
  } else {
    window.addEventListener('modulehub:card-canvas-ready', bootHomePage, { once: true });
  }
})();
