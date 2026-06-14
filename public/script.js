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
   * purpose --- viewport breakpoint (mirrors card-canvas config.js) ---
   */
  function resolveViewportBreakpoint() {
    if (window.CardCanvas?.resolveViewportBreakpoint) {
      return window.CardCanvas.resolveViewportBreakpoint();
    }
    const width = window.innerWidth;
    if (width >= 1024) return 'desktop';
    if (width >= 641) return 'tablet';
    return 'mobile';
  }

  /**
   * purpose --- canvas row count for folder at a device breakpoint ---
   */
  function resolveCanvasGridRowsForFolder(folderNode, breakpoint) {
    if (window.CardCanvas?.resolveStoredCanvasRows) {
      return window.CardCanvas.resolveStoredCanvasRows(folderNode?.folderCanvas, breakpoint);
    }
    const canvas = folderNode?.folderCanvas;
    if (!canvas) {
      return 9;
    }
    if (breakpoint === 'mobile') {
      return canvas.gridRowsMobile ?? canvas.gridRowsTablet ?? canvas.gridRows ?? 9;
    }
    if (breakpoint === 'tablet') {
      return canvas.gridRowsTablet ?? canvas.gridRows ?? 9;
    }
    return canvas.gridRows ?? 9;
  }

  /**
   * purpose --- merges saved folder card order/grid/backgrounds into in-memory siteLayout ---
   * @param {string} folderId - Folder node id
   * @param {Array<object>} cards - Saved payload
   * @param {number|object} [canvasOptions] - Legacy row count or per-breakpoint canvas options
   */
  function applyFolderCardsToLocalLayout(folderId, cards, canvasOptions) {
    if (!siteLayout?.tree) {
      return;
    }
    const folderNode = findNodeById(siteLayout.tree, folderId);
    if (!folderNode || folderNode.type !== 'folder' || !folderNode.children) {
      return;
    }

    const options = typeof canvasOptions === 'number'
      ? { canvasGridRows: canvasOptions }
      : (canvasOptions || {});

    if (
      typeof options.canvasGridRows === 'number'
      || typeof options.canvasGridRowsTablet === 'number'
      || typeof options.canvasGridRowsMobile === 'number'
    ) {
      folderNode.folderCanvas = {
        ...(folderNode.folderCanvas || { gridRows: 9 }),
        ...(typeof options.canvasGridRows === 'number' ? { gridRows: options.canvasGridRows } : {}),
        ...(typeof options.canvasGridRowsTablet === 'number'
          ? { gridRowsTablet: options.canvasGridRowsTablet } : {}),
        ...(typeof options.canvasGridRowsMobile === 'number'
          ? { gridRowsMobile: options.canvasGridRowsMobile } : {}),
      };
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
      if (entry.cardGridTablet) {
        updated.cardGridTablet = entry.cardGridTablet;
      }
      if (entry.cardGridMobile) {
        updated.cardGridMobile = entry.cardGridMobile;
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

  const CANVAS_FULL_TOAST_TITLE = 'ارتفاع بوم به حداکثر (۱۸۰ ردیف) رسیده — امکان افزودن کارت جدید نیست';

  function showCanvasFullToast() {
    if (!window.Swal) {
      return;
    }
    void Swal.fire({
      toast: true,
      position: 'top',
      icon: 'warning',
      title: CANVAS_FULL_TOAST_TITLE,
      showConfirmButton: false,
      timer: 3200,
    });
  }

  function isCanvasFullError(error) {
    return error?.code === 'CANVAS_FULL' || error?.status === 409;
  }

  function showLayoutMutationError(error) {
    if (isCanvasFullError(error)) {
      showCanvasFullToast();
      return;
    }
    void Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
  }

  /**
   * Reloads layout and auth state from backend.
   * @param {{ force?: boolean }} [options] - force re-render cards even in layout edit mode
   */
  async function refreshFromServer(options = {}) {
    authStatus = await ModuleHubApi.loadAuthStatus();
    siteLayout = await ModuleHubApi.loadLayout();
    if (siteLayout.appearance) {
      siteAppearance = siteLayout.appearance;
    }
    if (siteLayout.derivedLayoutsSaved && authStatus.isSuperAdmin && window.Swal) {
      void Swal.fire({
        toast: true,
        position: 'top',
        icon: 'warning',
        title: 'چیدمان تبلت/موبایل از روی PC ساخته و ذخیره شد — در صورت نیاز ویرایش کنید.',
        showConfirmButton: false,
        timer: 4000,
      });
    }
    if (window.HomeFloatingBackground) {
      window.HomeFloatingBackground.updateAppearance(siteAppearance);
    }
    updateAdminLoginLink();
    currentFolderId = resolveValidFolderId(currentFolderId);
    renderAll(options);
  }

  function updateDevModeBanner() {
    let banner = document.getElementById('devModeBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'devModeBanner';
      banner.className = 'dev-mode-banner';
      banner.setAttribute('role', 'alert');
      document.body.prepend(banner);
    }
    if (authStatus.isDevSuperAdmin) {
      banner.hidden = false;
      banner.textContent = 'حالت توسعه فعال است — ورود ادمین bypass شده. قبل از go-live غیرفعال کنید.';
    } else {
      banner.hidden = true;
    }
  }

  function updateAdminLoginLink() {
    AdminMenu.update(authStatus.isSuperAdmin);
    updateDevModeBanner();
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

  function renderCards(options = {}) {
    if (!options.force && window.CardLayoutEditor?.isEditModeActive?.()) {
      return;
    }
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
    const breakpoint = window.CardCanvas?.getEffectiveBreakpoint?.()
      || resolveViewportBreakpoint();
    context.breakpoint = breakpoint;
    context.canvasGridRows = resolveCanvasGridRowsForFolder(folderNode, breakpoint);

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

  function isFolderDescendant(ancestorId, nodeId) {
    if (ancestorId === nodeId) {
      return true;
    }
    const ancestor = findNodeById(siteLayout.tree, ancestorId);
    if (!ancestor) {
      return false;
    }
    return Boolean(findNodeById(ancestor, nodeId));
  }

  /**
   * buildLayoutEditGearAction --- shared floating item for layout edit toggle ---
   */
  function buildLayoutEditGearAction() {
    const isEditing = window.CardLayoutEditor?.isEditModeActive?.() ?? false;
    return {
      id: 'layout-edit',
      label: isEditing ? 'پایان ویرایش' : 'ویرایش چیدمان',
      hint: isEditing ? 'ذخیره و خروج از حالت ویرایش چیدمان' : 'جابجایی و اندازه کارت‌ها روی گرید',
      icon: isEditing ? 'fa-check' : 'fa-th-large',
      active: isEditing,
      show: true,
    };
  }

  /**
   * buildCardBackgroundGearAction --- shared floating item for card background picker ---
   */
  function buildCardBackgroundGearAction() {
    return {
      id: 'card-background',
      label: 'پس‌زمینه',
      hint: 'رنگ یا عکس پس‌زمینه این کارت',
      icon: 'fa-palette',
      show: true,
    };
  }

  /**
   * handleSharedGearActions --- layout edit toggle and card background from gear menu ---
   * @param {string} action
   * @param {HTMLElement|null} cardElement
   * @returns {Promise<boolean>}
   */
  async function handleSharedGearActions(action, cardElement) {
    if (action === 'layout-edit') {
      await window.CardLayoutEditor?.toggleEditMode?.();
      return true;
    }
    if (action === 'card-background') {
      if (cardElement) {
        await window.CardLayoutEditor?.openBackgroundForCard?.(cardElement);
      }
      return true;
    }
    return false;
  }

  /**
   * buildFolderGearActions --- floating menu items for folder gear ---
   * @param {object} folderNode
   */
  function buildFolderGearActions(folderNode) {
    const actions = [
      {
        id: 'help',
        label: 'راهنما',
        hint: 'چطور با پوشه کار کنی — حذف، جابجایی و ...',
        icon: 'fa-circle-question',
        show: true,
      },
    ];

    if (authStatus.isSuperAdmin) {
      actions.push(buildLayoutEditGearAction(), buildCardBackgroundGearAction());
    }

    actions.push(
      {
        id: 'edit-meta',
        label: 'اسم و توضیح',
        hint: 'اسم پوشه و خط زیرش روی کارت رو عوض کن',
        icon: 'fa-edit',
        show: true,
      },
      {
        id: 'move',
        label: 'جابجایی',
        hint: 'ببرش تو یه پوشهٔ دیگه',
        icon: 'fa-folder-open',
        show: folderNode.id !== 'root',
      },
      {
        id: 'delete',
        label: 'حذف',
        hint: 'کل پوشه رو پاک می‌کنه — با احتیاط!',
        icon: 'fa-trash',
        show: folderNode.id !== 'root',
        danger: true,
      },
    );

    return actions.filter((action) => action.show);
  }

  /**
   * buildModuleGearActions --- floating menu items for module gear ---
   * @param {string} layoutNodeId
   */
  function buildModuleGearActions(layoutNodeId) {
    const actions = [
      {
        id: 'help',
        label: 'راهنما',
        hint: 'چطور با ماژول کار کنی — مدیریت، جابجایی و ...',
        icon: 'fa-circle-question',
        show: true,
      },
    ];

    if (authStatus.isSuperAdmin) {
      actions.push(
        buildLayoutEditGearAction(),
        buildCardBackgroundGearAction(),
        {
          id: 'move',
          label: 'جابجایی',
          hint: 'ببرش تو یه پوشهٔ دیگه',
          icon: 'fa-folder-open',
          show: Boolean(layoutNodeId),
        },
      );
    }

    actions.push({
      id: 'manage',
      label: 'مدیریت',
      hint: 'Start/Stop، لاگ، تنظیمات و ...',
      icon: 'fa-sliders-h',
      show: true,
    });

    return actions.filter((action) => action.show);
  }

  /**
   * Executes a folder gear action (edit / move / delete).
   * @param {string} folderId
   * @param {object} folderNode
   * @param {string} action
   * @param {HTMLElement|null} cardElement
   */
  async function executeFolderGearAction(folderId, folderNode, action, cardElement) {
    try {
      if (await handleSharedGearActions(action, cardElement)) {
        return;
      }

      if (action === 'help') {
        await ModuleDialogs.showFolderAdminHelpDialog();
        return;
      }

      if (action === 'edit-meta') {
        const payload = await ModuleDialogs.showFolderEditMetaDialog(folderNode);
        if (!payload) {
          return;
        }
        await ModuleHubApi.patchFolder(folderId, payload);
        await refreshFromServer({ force: true });
        Swal.fire({ icon: 'success', title: 'پوشه به‌روز شد', timer: 1200, showConfirmButton: false });
        return;
      }

      if (action === 'move') {
        const targetId = await ModuleDialogs.showFolderMovePickerDialog(
          siteLayout.tree,
          folderId,
          isFolderDescendant,
        );
        if (!targetId) {
          return;
        }
        await ModuleHubApi.patchFolder(folderId, { parentId: targetId });
        await refreshFromServer({ force: true });
        Swal.fire({ icon: 'success', title: 'پوشه جابجا شد', timer: 1200, showConfirmButton: false });
        return;
      }

      if (action === 'delete') {
        const childCount = folderNode.children?.length ?? 0;
        const deleteBody = await ModuleDialogs.showFolderDeleteWizardDialog(folderNode, childCount);
        if (!deleteBody) {
          return;
        }
        if (deleteBody._needsTarget) {
          const targetId = await ModuleDialogs.showFolderMovePickerDialog(
            siteLayout.tree,
            folderId,
            isFolderDescendant,
          );
          if (!targetId) {
            return;
          }
          deleteBody.targetFolderId = targetId;
          delete deleteBody._needsTarget;
        }
        await ModuleHubApi.deleteFolder(folderId, deleteBody);
        if (currentFolderId === folderId) {
          currentFolderId = resolveValidFolderId(getParentFolderId(folderId));
          const url = currentFolderId === ROOT_ID ? '/' : `/?folder=${encodeURIComponent(currentFolderId)}`;
          window.history.replaceState({ folder: currentFolderId }, '', url);
        }
        await refreshFromServer({ force: true });
        Swal.fire({ icon: 'success', title: 'پوشه حذف شد', timer: 1200, showConfirmButton: false });
      }
    } catch (error) {
      const message = error.message === 'FOLDER_NOT_EMPTY'
        ? 'پوشه خالی نیست — ابتدا محتوا را منتقل کنید یا سیاست حذف را انتخاب کنید.'
        : error.message;
      Swal.fire({ icon: 'error', title: 'خطا', text: message });
    }
  }

  /**
   * Opens the module management dialog (Start/Stop/logs/settings grid).
   * @param {HTMLElement} cardElement
   * @param {string} moduleId
   * @param {object} moduleMeta
   */
  async function openModuleManageDialog(cardElement, moduleId, moduleMeta) {
    const statusDisplay = window.CardCanvas?.getStatusDisplay?.(moduleMeta.status)
      ?? { label: 'متوقف', cssClass: 'status-stopped' };
    const action = await ModuleDialogs.showGearActionsDialog(moduleMeta, {
      isSuperAdmin: authStatus.isSuperAdmin,
      statusLabel: statusDisplay.label,
      statusClass: statusDisplay.cssClass,
    });

    if (!action) {
      return;
    }

    await handleGearAction(moduleId, moduleMeta, action, cardElement);
  }

  /**
   * Executes a module floating gear action.
   * @param {string} moduleId
   * @param {object} moduleMeta
   * @param {string} layoutNodeId
   * @param {HTMLElement} cardElement
   * @param {string} action
   */
  async function executeModuleGearAction(moduleId, moduleMeta, layoutNodeId, cardElement, action) {
    try {
      if (action === 'help') {
        await ModuleDialogs.showModuleAdminHelpDialog();
        return;
      }

      if (await handleSharedGearActions(action, cardElement)) {
        return;
      }

      if (action === 'move') {
        const targetId = await ModuleDialogs.showFolderMovePickerDialog(
          siteLayout.tree,
          layoutNodeId,
          () => false,
        );
        if (!targetId) {
          return;
        }
        await ModuleHubApi.moveLayoutNode(layoutNodeId, { parentId: targetId });
        await refreshFromServer({ force: true });
        Swal.fire({ icon: 'success', title: 'ماژول جابجا شد', timer: 1200, showConfirmButton: false });
        return;
      }

      if (action === 'manage') {
        await openModuleManageDialog(cardElement, moduleId, moduleMeta);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  /**
   * Opens floating gear actions beside folder card gear icon.
   * @param {string} folderId
   * @param {object} folderNode
   * @param {HTMLElement} gearElement
   * @param {HTMLElement} cardElement
   */
  async function handleFolderGearAction(folderId, folderNode, gearElement, cardElement) {
    const actions = buildFolderGearActions(folderNode);
    const action = await GearFloatingMenu.show(gearElement, actions);
    if (!action) {
      return;
    }
    await executeFolderGearAction(folderId, folderNode, action, cardElement);
  }

  /**
   * Opens floating gear actions beside module card gear icon.
   * @param {string} moduleId
   * @param {object} moduleMeta
   * @param {HTMLElement} cardElement
   */
  async function handleModuleGearAction(moduleId, moduleMeta, cardElement) {
    const gearElement = cardElement.querySelector('.gear-icon');
    if (!gearElement) {
      return;
    }
    const layoutNodeId = cardElement.dataset.id || '';
    const actions = buildModuleGearActions(layoutNodeId);
    const action = await GearFloatingMenu.show(gearElement, actions);
    if (!action) {
      return;
    }
    await executeModuleGearAction(moduleId, moduleMeta, layoutNodeId, cardElement, action);
  }

  async function openGearMenu(cardElement) {
    const moduleId = cardElement.getAttribute('data-module-id');
    const nodeType = cardElement.getAttribute('data-type');
    const nodeId = cardElement.getAttribute('data-id');

    if (nodeType === 'folder') {
      if (!authStatus.isSuperAdmin) {
        await promptLogin();
        return;
      }
      const folderNode = findNodeById(siteLayout.tree, nodeId);
      if (!folderNode || folderNode.type !== 'folder') {
        return;
      }
      const gearElement = cardElement.querySelector('.gear-icon');
      if (!gearElement) {
        return;
      }
      await handleFolderGearAction(nodeId, folderNode, gearElement, cardElement);
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
          if (error.status === 429) {
            const waitText = error.retryAfterSeconds
              ? `لطفاً ${error.retryAfterSeconds} ثانیه دیگر تلاش کنید.`
              : 'لطفاً بعداً دوباره تلاش کنید.';
            Swal.fire({ icon: 'warning', title: 'قفل موقت', text: waitText });
          } else {
            Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
          }
        }
      }
      return;
    }

    await handleModuleGearAction(moduleId, moduleMeta, cardElement);
  }

  /**
   * Executes a gear menu action for a module.
   * @param {string} moduleId - Module id
   * @param {object} moduleMeta - Module metadata
   * @param {string} action - Action id from gear dialog
   */
  async function handleGearAction(moduleId, moduleMeta, action, cardElement) {
    try {
      if (action === 'start') {
        await ModuleHubApi.startModule(moduleId);
        await refreshFromServer();
        if (cardElement) {
          await openModuleManageDialog(cardElement, moduleId, moduleMeta);
        }
        return;
      }
      if (action === 'stop') {
        await ModuleHubApi.stopModule(moduleId);
        await refreshFromServer();
        if (cardElement) {
          await openModuleManageDialog(cardElement, moduleId, moduleMeta);
        }
        return;
      }
      if (action === 'restart') {
        await ModuleHubApi.restartModule(moduleId);
        await refreshFromServer();
        if (cardElement) {
          await openModuleManageDialog(cardElement, moduleId, moduleMeta);
        }
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
        const layoutNode = findNodeById(siteLayout.tree, cardElement?.dataset?.id || '');
        const editPayload = await ModuleDialogs.showModuleEditDialog(
          moduleMeta,
          authStatus.isSuperAdmin,
          { cardDescription: layoutNode?.cardDescription || '' },
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
        await refreshFromServer({ force: true });
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
    if (window.CardLayoutEditor?.flushSave) {
      await window.CardLayoutEditor.flushSave();
    }
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
      await refreshFromServer({ force: true });
      Swal.fire({ icon: 'success', title: 'پوشه ایجاد شد', timer: 1200, showConfirmButton: false });
    } catch (error) {
      showLayoutMutationError(error);
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

        await refreshFromServer({ force: true });
        Swal.fire({ icon: 'success', title: 'ماژول ثبت شد', text: 'وضعیت: متوقف — از ⚙ استارت کنید', timer: 2500 });
      } catch (error) {
        showLayoutMutationError(error);
      }
    };
  }

  function renderAll(options = {}) {
    renderBreadcrumb();
    renderCards(options);
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
      const { folderId, cards, canvasGridRows, canvasGridRowsTablet, canvasGridRowsMobile } = detail;
      applyFolderCardsToLocalLayout(folderId, cards, {
        canvasGridRows,
        canvasGridRowsTablet,
        canvasGridRowsMobile,
      });
      if (folderId === currentFolderId && siteLayout?.tree) {
        const folderNode = findNodeById(siteLayout.tree, folderId);
        if (folderNode?.children) {
          window.CardCanvas?.updateLayoutChildren?.(folderNode.children);
        }
      }
    }
  });

  window.addEventListener('modulehub:layout-edit-ended', () => {
    window.CardCanvas?.syncViewportBreakpoint?.();
    renderCards();
  });

  window.addEventListener('modulehub:viewport-breakpoint-changed', () => {
    renderCards();
  });

  window.addEventListener('modulehub:add-content', () => {
    void openAddMenu();
  });

  initDarkMode();
  if (window.HomeFloatingBackground) {
    window.HomeFloatingBackground.init();
  }
  AdminMenu.mount('adminAuthMenuHost', { onAfterLogout: refreshFromServer });

  /**
   * Drag-transfer reparent in layout edit mode.
   * @param {{ nodeId: string, nodeType: string, targetParentId: string }} payload
   */
  async function handleLayoutTransfer(payload) {
    if (!authStatus.isSuperAdmin) {
      return;
    }
    const { nodeId, nodeType, targetParentId } = payload;
    try {
      if (nodeType === 'folder') {
        await ModuleHubApi.patchFolder(nodeId, { parentId: targetParentId });
      } else {
        await ModuleHubApi.moveLayoutNode(nodeId, { parentId: targetParentId });
      }
      if (currentFolderId === nodeId && nodeType === 'folder') {
        currentFolderId = resolveValidFolderId(targetParentId);
        const url = currentFolderId === ROOT_ID ? '/' : `/?folder=${encodeURIComponent(currentFolderId)}`;
        window.history.replaceState({ folder: currentFolderId }, '', url);
      }
      await refreshFromServer({ force: true });
      Swal.fire({ icon: 'success', title: 'انتقال انجام شد', timer: 1200, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'خطا در انتقال', text: error.message });
    }
  }

  function initCardCanvasHooks() {
    if (!window.CardCanvas) {
      return;
    }
    window.CardCanvas.init({
      getModules: () => siteLayout?.modules || {},
      getAuthStatus: () => authStatus,
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
      onCanvasRowsSettled: () => {
        if (window.CardLayoutEditor?.scheduleSaveFromCanvas) {
          window.CardLayoutEditor.scheduleSaveFromCanvas();
        }
      },
      onOpenBackground: (element) => {
        if (window.CardLayoutEditor?.openBackgroundForCard) {
          void window.CardLayoutEditor.openBackgroundForCard(element);
        }
      },
      onPlacementRejected: () => {
        if (window.Swal) {
          void Swal.fire({
            toast: true,
            position: 'top',
            icon: 'warning',
            title: 'در این محدوده امکان قرارگیری کارت نیست',
            showConfirmButton: false,
            timer: 2200,
          });
        }
      },
      onCanvasRowsAtMax: () => {
        showCanvasFullToast();
      },
      getFolderCanvas: () => {
        if (!siteLayout?.tree) {
          return undefined;
        }
        const folderNode = findNodeById(siteLayout.tree, currentFolderId);
        return folderNode?.folderCanvas;
      },
      onLayoutTransfer: (payload) => handleLayoutTransfer(payload),
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
