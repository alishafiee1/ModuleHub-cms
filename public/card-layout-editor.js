// card-layout-editor.js — drag-to-reorder and span-resize for Super Admin
// purpose --- activated only when Super Admin is logged in; SortableJS loaded on demand ---
(function initCardLayoutEditor() {
  const SORTABLE_CDN = 'https://cdn.jsdelivr.net/npm/sortablejs@1/Sortable.min.js';
  const SAVE_DEBOUNCE_MS = 500;

  let sortableInstance = null;
  let editModeActive = false;
  let saveTimer = null;
  let currentFolderIdFn = () => 'root';

  /**
   * purpose --- loads SortableJS from CDN once and resolves ---
   * @returns {Promise<void>}
   */
  function loadSortable() {
    if (window.Sortable) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SORTABLE_CDN;
      script.onload = resolve;
      script.onerror = () => reject(new Error('SortableJS failed to load'));
      document.head.appendChild(script);
    });
  }

  /**
   * purpose --- collects current card order, span, and background values from DOM ---
   * @param {HTMLElement} grid - Cards grid element
   * @returns {Array<{ nodeId: string, cardSpan?: number, cardBackground?: object|null }>}
   */
  function collectCardPayload(grid) {
    return Array.from(grid.querySelectorAll('.card[data-id]')).map((card) => {
      const nodeId = card.getAttribute('data-id');
      const activeBtn = card.querySelector('.card-span-btn.is-active');
      const cardSpan = activeBtn ? Number(activeBtn.getAttribute('data-span')) : undefined;
      const bgRaw = card.getAttribute('data-card-background');
      let cardBackground;
      try {
        cardBackground = bgRaw ? JSON.parse(bgRaw) : null;
      } catch {
        cardBackground = null;
      }
      const entry = { nodeId };
      if (cardSpan && cardSpan !== 1) {
        entry.cardSpan = cardSpan;
      }
      if (cardBackground && cardBackground.type !== 'none') {
        entry.cardBackground = cardBackground;
      } else if (cardBackground === null) {
        entry.cardBackground = null;
      }
      return entry;
    });
  }

  /**
   * purpose --- opens SweetAlert2 dialog for picking card background (color/image/none) ---
   * @param {HTMLElement} card - Target card element
   * @param {HTMLElement} grid - Grid container
   * @param {HTMLElement} savingIndicator - Saving state indicator
   */
  async function openBackgroundDialog(card, grid, savingIndicator) {
    let currentBg = null;
    const bgRaw = card.getAttribute('data-card-background');
    try {
      currentBg = bgRaw ? JSON.parse(bgRaw) : null;
    } catch {
      currentBg = null;
    }

    const currentType = currentBg?.type || 'none';
    const currentColor = currentBg?.color || '#3b82f6';
    const currentBgOpacity = currentBg?.backgroundOpacity ?? 100;
    const currentOverlayOpacity = currentBg?.overlayOpacity ?? 45;

    const htmlContent = `
      <div style="text-align:right; direction:rtl; font-size:0.9rem;">
        <p style="font-weight:700; margin-bottom:0.6rem;">نوع پس‌زمینه</p>
        <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;cursor:pointer;">
          <input type="radio" name="bg-type" value="none" ${currentType === 'none' ? 'checked' : ''}> بدون پس‌زمینه
        </label>
        <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;cursor:pointer;">
          <input type="radio" name="bg-type" value="color" ${currentType === 'color' ? 'checked' : ''}> رنگ
        </label>
        <label style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.8rem;cursor:pointer;">
          <input type="radio" name="bg-type" value="image" ${currentType === 'image' ? 'checked' : ''}> عکس
        </label>

        <div id="bgColorSection" style="display:${currentType === 'color' ? 'block' : 'none'}; margin-bottom:0.6rem;">
          <label style="font-weight:600;">رنگ:</label>
          <input type="color" id="bgColorPicker" value="${currentColor}" style="margin-right:0.5rem; height:32px; width:80px; cursor:pointer; border-radius:6px;">
        </div>

        <div id="bgImageSection" style="display:${currentType === 'image' ? 'block' : 'none'}; margin-bottom:0.6rem;">
          <label style="font-weight:600; display:block; margin-bottom:0.3rem;">انتخاب عکس (max 2MB):</label>
          <input type="file" id="bgImageFile" accept="image/jpeg,image/png,image/webp" style="width:100%;">
          <div id="bgImagePreview" style="margin-top:0.5rem; display:${currentBg?.imageUrl ? 'block' : 'none'};">
            <img src="${currentBg?.imageUrl || ''}" style="max-height:100px; border-radius:8px; object-fit:cover; width:100%;">
          </div>
        </div>

        <div id="bgOpacitySection" style="display:${currentType !== 'none' ? 'block' : 'none'};">
          <label style="font-weight:600;">شفافیت پس‌زمینه: <span id="bgOpacityVal">${currentBgOpacity}</span>%</label>
          <input type="range" id="bgOpacity" min="10" max="100" value="${currentBgOpacity}" style="width:100%; margin:0.3rem 0 0.6rem;">
          <label style="font-weight:600;">شفافیت اوورلی: <span id="bgOverlayVal">${currentOverlayOpacity}</span>%</label>
          <input type="range" id="bgOverlay" min="0" max="80" value="${currentOverlayOpacity}" style="width:100%;">
        </div>
      </div>`;

    let pendingImageUrl = currentBg?.imageUrl || null;

    const result = await Swal.fire({
      title: 'پس‌زمینه کارت',
      html: htmlContent,
      showCancelButton: true,
      confirmButtonText: 'اعمال',
      cancelButtonText: 'انصراف',
      width: '26rem',
      didOpen: () => {
        const container = Swal.getHtmlContainer();
        const radios = container.querySelectorAll('input[name="bg-type"]');
        const colorSection = container.querySelector('#bgColorSection');
        const imageSection = container.querySelector('#bgImageSection');
        const opacitySection = container.querySelector('#bgOpacitySection');
        const opacitySlider = container.querySelector('#bgOpacity');
        const opacityVal = container.querySelector('#bgOpacityVal');
        const overlaySlider = container.querySelector('#bgOverlay');
        const overlayVal = container.querySelector('#bgOverlayVal');
        const fileInput = container.querySelector('#bgImageFile');
        const previewDiv = container.querySelector('#bgImagePreview');
        const previewImg = previewDiv.querySelector('img');

        const syncSections = () => {
          const selected = container.querySelector('input[name="bg-type"]:checked')?.value;
          colorSection.style.display = selected === 'color' ? 'block' : 'none';
          imageSection.style.display = selected === 'image' ? 'block' : 'none';
          opacitySection.style.display = selected !== 'none' ? 'block' : 'none';
        };

        radios.forEach((r) => r.addEventListener('change', syncSections));

        opacitySlider.addEventListener('input', () => {
          opacityVal.textContent = opacitySlider.value;
        });
        overlaySlider.addEventListener('input', () => {
          overlayVal.textContent = overlaySlider.value;
        });

        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) {
            return;
          }
          try {
            const res = await ModuleHubApi.uploadCardBackground(file);
            pendingImageUrl = res.imageUrl;
            previewImg.src = pendingImageUrl;
            previewDiv.style.display = 'block';
          } catch (err) {
            Swal.showValidationMessage(`آپلود ناموفق: ${err.message}`);
          }
        });
      },
      preConfirm: () => {
        const container = Swal.getHtmlContainer();
        const selectedType = container.querySelector('input[name="bg-type"]:checked')?.value;
        const bgOpacityVal = Number(container.querySelector('#bgOpacity').value);
        const overlayOpacityVal = Number(container.querySelector('#bgOverlay').value);
        const colorValue = container.querySelector('#bgColorPicker').value;

        if (selectedType === 'none') {
          return null;
        }
        if (selectedType === 'color') {
          return { type: 'color', color: colorValue, backgroundOpacity: bgOpacityVal, overlayOpacity: overlayOpacityVal };
        }
        if (selectedType === 'image') {
          if (!pendingImageUrl) {
            Swal.showValidationMessage('لطفاً یک عکس انتخاب کنید');
            return false;
          }
          return { type: 'image', imageUrl: pendingImageUrl, backgroundOpacity: bgOpacityVal, overlayOpacity: overlayOpacityVal };
        }
        return null;
      },
    });

    if (result.isDismissed) {
      return;
    }

    const newBg = result.value;
    card.setAttribute('data-card-background', JSON.stringify(newBg));

    card.classList.remove('card--has-bg', 'card--bg-color', 'card--bg-image');
    const bgLayer = card.querySelector('.card-bg-layer');
    const overlay = card.querySelector('.card-overlay');

    if (!newBg || newBg.type === 'none') {
      card.style.removeProperty('--card-bg-color');
      card.style.removeProperty('--card-bg-image');
      card.style.removeProperty('--card-bg-opacity');
      card.style.removeProperty('--card-overlay-opacity');
      if (bgLayer) { bgLayer.remove(); }
      if (overlay) { overlay.remove(); }
    } else {
      const bgOpacityNum = (newBg.backgroundOpacity ?? 100) / 100;
      const overlayOpacityNum = (newBg.overlayOpacity ?? 45) / 100;
      card.style.setProperty('--card-bg-opacity', String(bgOpacityNum));
      card.style.setProperty('--card-overlay-opacity', String(overlayOpacityNum));

      if (newBg.type === 'color') {
        card.classList.add('card--has-bg', 'card--bg-color');
        card.style.setProperty('--card-bg-color', newBg.color);
        card.style.removeProperty('--card-bg-image');
      } else if (newBg.type === 'image') {
        card.classList.add('card--has-bg', 'card--bg-image');
        card.style.setProperty('--card-bg-image', `url('${newBg.imageUrl}')`);
        card.style.removeProperty('--card-bg-color');
      }

      if (!bgLayer) {
        const newLayer = document.createElement('div');
        newLayer.className = 'card-bg-layer';
        newLayer.setAttribute('aria-hidden', 'true');
        card.insertBefore(newLayer, card.firstChild);
      }
      if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'card-overlay';
        newOverlay.setAttribute('aria-hidden', 'true');
        const existingLayer = card.querySelector('.card-bg-layer');
        existingLayer.insertAdjacentElement('afterend', newOverlay);
      }
    }

    scheduleSave(grid, savingIndicator);
  }

  /**
   * purpose --- debounced persist of layout to server ---
   * @param {HTMLElement} grid - Cards grid element
   * @param {HTMLElement} savingIndicator - Element showing «ذخیره...»
   */
  function scheduleSave(grid, savingIndicator) {
    clearTimeout(saveTimer);
    savingIndicator.classList.add('is-visible');
    saveTimer = setTimeout(async () => {
      const folderId = currentFolderIdFn();
      const cards = collectCardPayload(grid);
      try {
        await ModuleHubApi.saveFolderCards(folderId, cards);
      } catch {
        // silent fail — user can try again; layout in memory is already correct
      } finally {
        savingIndicator.classList.remove('is-visible');
      }
    }, SAVE_DEBOUNCE_MS);
  }

  const SPAN_OPTIONS = [
    { span: 4, label: 'بزرگ' },
    { span: 2, label: 'متوسط' },
    { span: 1, label: 'کوچک' },
  ];

  /**
   * purpose --- returns or creates the vertical edit-controls column inside card-icon ---
   * @param {HTMLElement} card - Card DOM element
   * @returns {HTMLElement} wrapper element
   */
  function ensureEditControlsWrapper(card) {
    let wrapper = card.querySelector('.card-edit-controls');
    if (wrapper) {
      return wrapper;
    }

    wrapper = document.createElement('div');
    wrapper.className = 'card-edit-controls';

    const cardIcon = card.querySelector('.card-icon');
    const gearIcon = card.querySelector('.gear-icon');
    if (cardIcon) {
      if (gearIcon) {
        cardIcon.insertBefore(wrapper, gearIcon);
      } else {
        cardIcon.appendChild(wrapper);
      }
    } else {
      const cardContent = card.querySelector('.card-content') || card;
      cardContent.insertBefore(wrapper, cardContent.firstChild);
    }

    return wrapper;
  }

  /**
   * purpose --- moves legacy scattered edit controls into the wrapper if needed ---
   * @param {HTMLElement} card - Card DOM element
   * @param {HTMLElement} wrapper - Edit controls wrapper
   */
  function migrateScatteredEditControls(card, wrapper) {
    ['.card-drag-handle', '.card-bg-btn', '.card-span-selector'].forEach((selector) => {
      const element = card.querySelector(selector);
      if (element && element.parentElement !== wrapper) {
        wrapper.appendChild(element);
      }
    });
  }

  /**
   * purpose --- injects drag handle, span selector, and background button into one card ---
   * @param {HTMLElement} card - Card DOM element
   * @param {HTMLElement} grid - Grid container
   * @param {HTMLElement} savingIndicator - Saving indicator element
   */
  function decorateCard(card, grid, savingIndicator) {
    if (card.classList.contains('add-card')) {
      return;
    }

    const wrapper = ensureEditControlsWrapper(card);
    migrateScatteredEditControls(card, wrapper);

    if (!wrapper.querySelector('.card-drag-handle')) {
      const handle = document.createElement('div');
      handle.className = 'card-drag-handle';
      handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
      handle.setAttribute('aria-label', 'جابه‌جا کردن کارت');
      wrapper.appendChild(handle);
    }

    if (!wrapper.querySelector('.card-bg-btn')) {
      const bgBtn = document.createElement('button');
      bgBtn.type = 'button';
      bgBtn.className = 'card-bg-btn';
      bgBtn.setAttribute('aria-label', 'پس‌زمینه کارت');
      bgBtn.innerHTML = '<i class="fas fa-palette"></i>';
      bgBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const saving = document.getElementById('layoutEditSaving');
        void openBackgroundDialog(card, grid, saving);
      });
      wrapper.appendChild(bgBtn);
    }

    let selector = wrapper.querySelector('.card-span-selector');
    if (!selector) {
      const currentSpan = Number(card.getAttribute('data-card-span') || 1);
      selector = document.createElement('div');
      selector.className = 'card-span-selector';
      SPAN_OPTIONS.forEach(({ span, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'card-span-btn' + (currentSpan === span ? ' is-active' : '');
        btn.setAttribute('data-span', String(span));
        btn.textContent = label;
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          selector.querySelectorAll('.card-span-btn').forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          card.classList.remove('card--span-1', 'card--span-2', 'card--span-4');
          card.classList.add(`card--span-${span}`);
          card.setAttribute('data-card-span', String(span));
          scheduleSave(grid, savingIndicator);
        });
        selector.appendChild(btn);
      });
      wrapper.appendChild(selector);
    }
  }

  /**
   * purpose --- enables Sortable drag on grid; decorates all cards ---
   * @param {HTMLElement} grid - Cards grid element
   * @param {HTMLElement} savingIndicator - Saving indicator element
   */
  function enableEditMode(grid, savingIndicator) {
    grid.classList.add('layout-edit-active');
    grid.querySelectorAll('.card').forEach((card) => decorateCard(card, grid, savingIndicator));

    if (!sortableInstance) {
      sortableInstance = new window.Sortable(grid, {
        animation: 160,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.card-drag-handle',
        filter: '.add-card',
        onEnd() {
          scheduleSave(grid, savingIndicator);
        },
      });
    }
  }

  /**
   * purpose --- disables Sortable and removes edit-mode class ---
   * @param {HTMLElement} grid - Cards grid element
   */
  function disableEditMode(grid) {
    grid.classList.remove('layout-edit-active');
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
  }

  /** Future card-management tools — wired later */
  const CARD_TOOLBAR_PLACEHOLDERS = [
    { id: 'cardAlign', icon: 'fa-border-all', label: 'تراز گرید' },
    { id: 'cardTheme', icon: 'fa-fill-drip', label: 'استایل کارت' },
    { id: 'cardUndo', icon: 'fa-undo', label: 'بازگردانی' },
  ];

  let mountedGrid = null;
  let mountedToolbar = null;

  /**
   * purpose --- syncs edit toggle button label with current edit state ---
   * @param {HTMLButtonElement|null} editBtn - Primary edit toggle
   */
  function syncEditToggleLabel(editBtn) {
    if (!editBtn) {
      return;
    }
    editBtn.textContent = editModeActive ? 'پایان ویرایش' : 'ویرایش';
    editBtn.classList.toggle('is-active', editModeActive);
    editBtn.setAttribute('aria-pressed', editModeActive ? 'true' : 'false');
  }

  /**
   * purpose --- renders the Super Admin card toolbar above the grid (once) ---
   * @param {HTMLElement} grid - Cards grid element
   * @returns {HTMLElement} toolbar element
   */
  function buildToolbar(grid) {
    const existing = document.getElementById('layoutEditToolbar');
    if (existing) {
      return existing;
    }

    const toolbar = document.createElement('div');
    toolbar.id = 'layoutEditToolbar';
    toolbar.className = 'layout-edit-toolbar';
    toolbar.hidden = true;

    const toolsGroup = document.createElement('div');
    toolsGroup.className = 'layout-edit-toolbar-tools';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'layoutEditToggleBtn';
    editBtn.className = 'layout-edit-tool-btn layout-edit-tool-btn--primary';
    editBtn.setAttribute('aria-label', 'ویرایش چیدمان کارت‌ها');
    editBtn.setAttribute('aria-pressed', 'false');
    editBtn.innerHTML = '<i class="fas fa-th-large"></i><span>ویرایش</span>';

    toolsGroup.appendChild(editBtn);

    CARD_TOOLBAR_PLACEHOLDERS.forEach((tool) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'layout-edit-tool-btn layout-edit-tool-btn--placeholder';
      btn.dataset.toolId = tool.id;
      btn.disabled = true;
      btn.title = `${tool.label} (به‌زودی)`;
      btn.setAttribute('aria-label', tool.label);
      btn.innerHTML = `<i class="fas ${tool.icon}"></i><span>${tool.label}</span>`;
      toolsGroup.appendChild(btn);
    });

    const saving = document.createElement('span');
    saving.id = 'layoutEditSaving';
    saving.className = 'layout-edit-saving';
    saving.textContent = 'ذخیره...';

    toolbar.appendChild(toolsGroup);
    toolbar.appendChild(saving);
    grid.insertAdjacentElement('beforebegin', toolbar);

    return toolbar;
  }

  /**
   * purpose --- shows or hides the admin card toolbar ---
   * @param {boolean} isVisible - Whether Super Admin is logged in
   */
  function setAdminToolbarVisible(isVisible) {
    if (!mountedToolbar) {
      return;
    }
    mountedToolbar.hidden = !isVisible;
    if (!isVisible && editModeActive && mountedGrid) {
      editModeActive = false;
      mountedToolbar.classList.remove('is-editing');
      disableEditMode(mountedGrid);
      const editBtn = document.getElementById('layoutEditToggleBtn');
      syncEditToggleLabel(editBtn);
    }
  }

  /**
   * purpose --- public API called from script.js once on page load ---
   * @param {object} options - Configuration
   * @param {string} options.gridId - Id of the cards grid element
   * @param {() => string} options.getFolderId - Returns current folder id
   */
  function mount({ gridId, getFolderId }) {
    currentFolderIdFn = getFolderId;
    const grid = document.getElementById(gridId);
    if (!grid) {
      return;
    }

    mountedGrid = grid;
    mountedToolbar = buildToolbar(grid);
    const saving = document.getElementById('layoutEditSaving');
    const editBtn = document.getElementById('layoutEditToggleBtn');

    function exitEditMode() {
      editModeActive = false;
      mountedToolbar.classList.remove('is-editing');
      disableEditMode(grid);
      syncEditToggleLabel(editBtn);
    }

    async function enterEditMode() {
      editModeActive = true;
      mountedToolbar.classList.add('is-editing');
      syncEditToggleLabel(editBtn);
      try {
        await loadSortable();
        enableEditMode(grid, saving);
      } catch {
        editModeActive = false;
        mountedToolbar.classList.remove('is-editing');
        syncEditToggleLabel(editBtn);
      }
    }

    if (editBtn && !editBtn.dataset.bound) {
      editBtn.dataset.bound = '1';
      editBtn.addEventListener('click', async () => {
        if (editModeActive) {
          exitEditMode();
          return;
        }
        await enterEditMode();
      });
    }
  }

  /**
   * purpose --- called from renderCards after DOM is rebuilt; re-decorates if edit mode is on ---
   * @param {string} gridId - Grid element id
   */
  function refresh(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid || !editModeActive) {
      return;
    }
    const saving = document.getElementById('layoutEditSaving');
    grid.classList.add('layout-edit-active');
    grid.querySelectorAll('.card').forEach((card) => decorateCard(card, grid, saving));
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
    sortableInstance = new window.Sortable(grid, {
      animation: 160,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.card-drag-handle',
      filter: '.add-card',
      onEnd() {
        scheduleSave(grid, saving);
      },
    });
  }

  /** purpose --- resets editor state on folder navigation --- */
  function reset() {
    editModeActive = false;
    sortableInstance = null;
    clearTimeout(saveTimer);
    if (mountedToolbar) {
      mountedToolbar.classList.remove('is-editing');
    }
    syncEditToggleLabel(document.getElementById('layoutEditToggleBtn'));
    if (mountedGrid) {
      disableEditMode(mountedGrid);
    }
  }

  window.CardLayoutEditor = { mount, refresh, reset, setAdminToolbarVisible };
})();
