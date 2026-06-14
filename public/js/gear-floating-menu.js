// gear-floating-menu.js — circular floating action icons beside card gear
const GearFloatingMenu = (function createGearFloatingMenu() {
  const MENU_Z_INDEX = 320;
  const BUTTON_SIZE_PX = 42;
  const BUTTON_GAP_PX = 10;
  const ANCHOR_GAP_PX = 10;

  /** @type {HTMLElement|null} */
  let activeMenu = null;
  /** @type {HTMLElement|null} */
  let activeBackdrop = null;
  /** @type {((value: string|null) => void)|null} */
  let activeResolve = null;
  /** @type {HTMLElement|null} */
  let activeAnchor = null;

  /**
   * close --- dismiss open menu without selection ---
   */
  function close() {
    finish(null);
  }

  /**
   * finish --- teardown menu and resolve promise ---
   * @param {string|null} actionId
   */
  function finish(actionId) {
    if (activeAnchor) {
      activeAnchor.classList.remove('gear-icon--active');
      activeAnchor = null;
    }

    if (activeMenu) {
      activeMenu.classList.remove('is-open');
      activeMenu.classList.add('is-closing');
      const menuToRemove = activeMenu;
      setTimeout(() => menuToRemove.remove(), 220);
      activeMenu = null;
    }

    if (activeBackdrop) {
      const backdropToRemove = activeBackdrop;
      activeBackdrop.classList.add('is-closing');
      setTimeout(() => backdropToRemove.remove(), 220);
      activeBackdrop = null;
    }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('scroll', close, true);
    window.removeEventListener('resize', close);

    if (activeResolve) {
      activeResolve(actionId);
      activeResolve = null;
    }
  }

  /**
   * onKeyDown --- Escape closes menu ---
   * @param {KeyboardEvent} event
   */
  function onKeyDown(event) {
    if (event.key === 'Escape') {
      close();
    }
  }

  /**
   * positionMenu --- place vertical stack to the right of gear (flip if needed) ---
   * @param {HTMLElement} menu
   * @param {DOMRect} anchorRect
   * @param {number} actionCount
   */
  function positionMenu(menu, anchorRect, actionCount) {
    const totalHeight = (actionCount * BUTTON_SIZE_PX) + ((actionCount - 1) * BUTTON_GAP_PX);
    let top = anchorRect.top + (anchorRect.height / 2) - (totalHeight / 2);
    let left = anchorRect.right + ANCHOR_GAP_PX;
    const menuWidth = BUTTON_SIZE_PX;

    if (left + menuWidth > window.innerWidth - 8) {
      left = anchorRect.left - ANCHOR_GAP_PX - menuWidth;
      menu.classList.add('gear-floating-menu--flip');
    }

    top = Math.max(8, Math.min(top, window.innerHeight - totalHeight - 8));
    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
  }

  /**
   * show --- open animated circular actions beside gear ---
   * @param {HTMLElement} anchorElement - .gear-icon node
   * @param {Array<{ id: string, label: string, icon: string, danger?: boolean }>} actions
   * @returns {Promise<string|null>}
   */
  function show(anchorElement, actions) {
    if (!anchorElement || actions.length === 0) {
      return Promise.resolve(null);
    }

    if (activeMenu) {
      close();
    }

    return new Promise((resolve) => {
      activeResolve = resolve;
      activeAnchor = anchorElement;
      activeAnchor.classList.add('gear-icon--active');

      const backdrop = document.createElement('div');
      backdrop.className = 'gear-floating-backdrop';
      backdrop.style.zIndex = String(MENU_Z_INDEX - 1);
      backdrop.addEventListener('click', close);

      const menu = document.createElement('div');
      menu.className = 'gear-floating-menu';
      menu.setAttribute('role', 'menu');
      menu.style.zIndex = String(MENU_Z_INDEX);

      actions.forEach((action, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `gear-float-btn${action.danger ? ' gear-float-btn--danger' : ''}${action.active ? ' gear-float-btn--active' : ''}`;
        button.dataset.action = action.id;
        button.title = action.hint || action.label;
        button.setAttribute('aria-label', action.hint || action.label);
        button.style.setProperty('--float-index', String(index));
        button.innerHTML = `<i class="fas ${action.icon}" aria-hidden="true"></i>`;
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          finish(action.id);
        });
        menu.appendChild(button);
      });

      document.body.appendChild(backdrop);
      document.body.appendChild(menu);

      positionMenu(menu, anchorElement.getBoundingClientRect(), actions.length);

      activeBackdrop = backdrop;
      activeMenu = menu;

      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);

      requestAnimationFrame(() => {
        menu.classList.add('is-open');
        backdrop.classList.add('is-open');
      });
    });
  }

  return { show, close };
})();
