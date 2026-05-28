// script.js — home page: layout from API, breadcrumb, cards, theme, auth-aware admin UI
(function initModuleHubHome() {
  const ROOT_ID = 'root';
  let siteLayout = null;
  let currentFolderId = ROOT_ID;
  let authStatus = { isSuperAdmin: false, managedModuleIds: [] };

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
    const [layout, status] = await Promise.all([
      ModuleHubApi.loadLayout(),
      ModuleHubApi.loadAuthStatus(),
    ]);
    siteLayout = layout;
    authStatus = status;
    updateAdminLoginLink();
    renderAll();
  }

  function updateAdminLoginLink() {
    const link = document.getElementById('adminLoginLink');
    if (authStatus.isSuperAdmin) {
      link.innerHTML = '<i class="fas fa-user-check"></i> Super Admin';
      link.href = '/admin/settings';
    } else {
      link.innerHTML = '<i class="fas fa-user-shield"></i> ورود ادمین';
      link.href = '/admin/login';
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
          currentFolderId = folderId;
          renderAll();
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

      const description = isFolder
        ? 'پوشه مجازی'
        : (moduleMeta?.changelog || 'ماژول مستقل');

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
            <div class="card-desc">${description}</div>
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
            <div class="card-desc">پوشه جدید / آپلود ZIP</div>
          </div>
        </div>`;
    }

    container.innerHTML = html || '<div class="loading-state">این پوشه خالی است.</div>';

    container.querySelectorAll('.card:not(.add-card)').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('.gear-icon')) {
          return;
        }
        const nodeId = card.getAttribute('data-id');
        const nodeType = card.getAttribute('data-type');
        if (nodeType === 'folder') {
          currentFolderId = nodeId;
          renderAll();
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
        Swal.fire({
          icon: 'info',
          title: 'رمز ماژول',
          text: 'احراز هویت Module Manager در فاز ۸ پیاده‌سازی می‌شود.',
        });
      }
      return;
    }

    const statusDisplay = getStatusDisplay(moduleMeta.status);
    const canStart = moduleMeta.status !== 'running';
    const canStop = moduleMeta.status === 'running';

    const result = await Swal.fire({
      title: `مدیریت · ${moduleMeta.name}`,
      html: `<div style="text-align:right;">
        <p>وضعیت: <span class="${statusDisplay.cssClass}">${statusDisplay.label}</span></p>
        <p>نسخه: ${moduleMeta.version}</p>
        <p>CPU: ${moduleMeta.resources.cpu_limit} | RAM: ${moduleMeta.resources.ram_limit_mb} MB</p>
      </div>`,
      icon: 'info',
      showDenyButton: canStop,
      showConfirmButton: canStart,
      confirmButtonText: canStart ? 'Start' : 'بستن',
      denyButtonText: 'Stop',
      showCancelButton: true,
      cancelButtonText: 'بستن',
    });

    if (result.isConfirmed && canStart) {
      try {
        await ModuleHubApi.startModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول استارت شد', timer: 1200, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
      }
    } else if (result.isDenied && canStop) {
      try {
        await ModuleHubApi.stopModule(moduleId);
        await refreshFromServer();
        Swal.fire({ icon: 'success', title: 'ماژول متوقف شد', timer: 1200, showConfirmButton: false });
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
      }
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
    const isDark = localStorage.getItem('modulehub-theme') === 'dark';

    if (isDark) {
      document.body.classList.add('dark');
      label.textContent = 'لایت مود';
    }

    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const nowDark = document.body.classList.contains('dark');
      localStorage.setItem('modulehub-theme', nowDark ? 'dark' : 'light');
      label.textContent = nowDark ? 'لایت مود' : 'دارک مود';
    });
  }

  document.getElementById('cacheInfoChip').addEventListener('click', () => {
    void ModuleDialogs.showCacheInfoDialog();
  });

  initDarkMode();

  refreshFromServer().catch((error) => {
    document.getElementById('cardsGrid').innerHTML =
      `<div class="loading-state">خطا در بارگذاری: ${error.message}</div>`;
  });
})();
