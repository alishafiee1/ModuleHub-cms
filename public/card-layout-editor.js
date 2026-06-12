// card-layout-editor.js — cart-view edit mode: drag/resize + background + PATCH cardGrid
// purpose --- Super Admin toolbar; enables CardCanvas edit mode and debounced save ---
(function initCardLayoutEditor() {
  const SAVE_DEBOUNCE_MS = 500;

  let editModeActive = false;
  let saveTimer = null;
  let currentFolderIdFn = () => 'root';
  let mountedToolbar = null;
  let addButtonEl = null;

  /**
   * persistLayout --- save current canvas state to server ---
   * @returns {Promise<boolean>}
   */
  async function persistLayout() {
    const folderId = currentFolderIdFn();
    const cards = window.CardCanvas?.collectCardPayload?.() || [];
    const savingIndicator = document.getElementById('layoutEditSaving');
    if (savingIndicator) {
      savingIndicator.classList.add('is-visible');
    }
    try {
      await ModuleHubApi.saveFolderCards(folderId, cards);
      window.dispatchEvent(new CustomEvent('modulehub:folder-cards-saved', {
        detail: { folderId, cards },
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ذخیره ناموفق';
      if (window.Swal) {
        void Swal.fire({ icon: 'error', title: 'ذخیره چیدمان', text: message });
      }
      return false;
    } finally {
      if (savingIndicator) {
        savingIndicator.classList.remove('is-visible');
      }
    }
  }

  function scheduleSaveFromCanvas() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void persistLayout();
    }, SAVE_DEBOUNCE_MS);
  }

  async function flushSave() {
    clearTimeout(saveTimer);
    saveTimer = null;
    return persistLayout();
  }

  /**
   * openBackgroundForCard --- SweetAlert background picker for one card ---
   * @param {HTMLElement} card
   */
  async function openBackgroundForCard(card) {
    let currentBg = null;
    const bgRaw = card.dataset.cardBackground;
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
        opacitySlider.addEventListener('input', () => { opacityVal.textContent = opacitySlider.value; });
        overlaySlider.addEventListener('input', () => { overlayVal.textContent = overlaySlider.value; });

        fileInput.addEventListener('change', async () => {
          const file = fileInput.files[0];
          if (!file) return;
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
        if (selectedType === 'none') return null;
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

    if (result.isDismissed) return;

    const newBg = result.value;
    card.dataset.cardBackground = JSON.stringify(newBg);
    if (!newBg || newBg.type === 'none') {
      card.setAttribute('data-card-background-cleared', '1');
    } else {
      card.removeAttribute('data-card-background-cleared');
    }

    card.classList.remove('card--has-bg', 'card--bg-color', 'card--bg-image');
    const bgLayer = card.querySelector('.card-bg-layer');
    const overlay = card.querySelector('.card-overlay');

    if (!newBg || newBg.type === 'none') {
      card.style.removeProperty('--card-bg-color');
      card.style.removeProperty('--card-bg-image');
      card.style.removeProperty('--card-bg-opacity');
      card.style.removeProperty('--card-overlay-opacity');
      if (bgLayer) bgLayer.remove();
      if (overlay) overlay.remove();
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
        card.querySelector('.card-bg-layer')?.insertAdjacentElement('afterend', newOverlay);
      }
    }

    scheduleSaveFromCanvas();
  }

  const CARD_TOOLBAR_PLACEHOLDERS = [
    { id: 'cardAlign', icon: 'fa-border-all', label: 'تراز گرید' },
    { id: 'cardTheme', icon: 'fa-fill-drip', label: 'استایل کارت' },
    { id: 'cardUndo', icon: 'fa-undo', label: 'بازگردانی' },
  ];

  function syncEditToggleLabel(editBtn) {
    if (!editBtn) return;
    const label = editBtn.querySelector('span');
    const text = editModeActive ? 'پایان ویرایش' : 'ویرایش';
    if (label) {
      label.textContent = text;
    } else {
      editBtn.textContent = text;
    }
    editBtn.classList.toggle('is-active', editModeActive);
    editBtn.setAttribute('aria-pressed', editModeActive ? 'true' : 'false');
  }

  function buildToolbar() {
    const existing = document.getElementById('layoutEditToolbar');
    if (existing) return existing;

    const canvas = document.getElementById('cardCanvas');
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
    editBtn.innerHTML = '<i class="fas fa-th-large"></i><span>ویرایش</span>';
    toolsGroup.appendChild(editBtn);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.id = 'layoutAddContentBtn';
    addBtn.className = 'layout-edit-tool-btn';
    addBtn.innerHTML = '<i class="fas fa-plus-circle"></i><span>افزودن محتوا</span>';
    toolsGroup.appendChild(addBtn);
    addButtonEl = addBtn;

    CARD_TOOLBAR_PLACEHOLDERS.forEach((tool) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'layout-edit-tool-btn layout-edit-tool-btn--placeholder';
      btn.disabled = true;
      btn.title = `${tool.label} (به‌زودی)`;
      btn.innerHTML = `<i class="fas ${tool.icon}"></i><span>${tool.label}</span>`;
      toolsGroup.appendChild(btn);
    });

    const saving = document.createElement('span');
    saving.id = 'layoutEditSaving';
    saving.className = 'layout-edit-saving';
    saving.textContent = 'ذخیره...';

    toolbar.appendChild(toolsGroup);
    toolbar.appendChild(saving);
    canvas?.insertAdjacentElement('beforebegin', toolbar);

    return toolbar;
  }

  async function setAdminToolbarVisible(isVisible) {
    if (!mountedToolbar) return;
    mountedToolbar.hidden = !isVisible;
    if (addButtonEl) {
      addButtonEl.hidden = !isVisible;
    }
    if (!isVisible && editModeActive) {
      await flushSave();
      reset();
    }
  }

  function mount({ getFolderId }) {
    currentFolderIdFn = getFolderId;
    mountedToolbar = buildToolbar();
    const editBtn = document.getElementById('layoutEditToggleBtn');

    async function exitEditMode() {
      await flushSave();
      editModeActive = false;
      mountedToolbar.classList.remove('is-editing');
      window.CardCanvas?.setEditMode(false);
      syncEditToggleLabel(editBtn);
    }

    async function enterEditMode() {
      editModeActive = true;
      mountedToolbar.classList.add('is-editing');
      window.CardCanvas?.setEditMode(true);
      syncEditToggleLabel(editBtn);
    }

    if (editBtn && !editBtn.dataset.bound) {
      editBtn.dataset.bound = '1';
      editBtn.addEventListener('click', async () => {
        if (editModeActive) {
          await exitEditMode();
        } else {
          await enterEditMode();
        }
      });
    }

    if (addButtonEl && !addButtonEl.dataset.bound) {
      addButtonEl.dataset.bound = '1';
      addButtonEl.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('modulehub:add-content'));
      });
    }
  }

  function refresh() {
    if (editModeActive) {
      window.CardCanvas?.setEditMode(true);
    }
  }

  async function flushAndReset() {
    if (editModeActive) {
      await flushSave();
    }
    reset();
  }

  function reset() {
    editModeActive = false;
    clearTimeout(saveTimer);
    saveTimer = null;
    if (mountedToolbar) {
      mountedToolbar.classList.remove('is-editing');
    }
    syncEditToggleLabel(document.getElementById('layoutEditToggleBtn'));
    window.CardCanvas?.setEditMode(false);
  }

  window.CardLayoutEditor = {
    mount,
    refresh,
    reset,
    flushAndReset,
    setAdminToolbarVisible,
    scheduleSaveFromCanvas,
    openBackgroundForCard,
  };
})();
