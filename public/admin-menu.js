/**
 * admin-menu.js — Shared Super Admin header dropdown (settings, change password, logout).
 */
const AdminMenu = (function createAdminMenu() {
  let hostElement = null;
  let menuOpen = false;
  let onAfterLogout = null;
  let globalListenersAttached = false;

  /**
   * Wires eye toggle buttons for password fields inside a container.
   * @param {ParentNode} container - Element containing .password-input-group blocks
   */
  function wirePasswordToggles(container) {
    if (!container) {
      return;
    }
    container.querySelectorAll('.password-input-group').forEach((group) => {
      const input = group.querySelector('input[type="password"], input[type="text"]');
      const toggleBtn = group.querySelector('.password-toggle-btn');
      const eyeIcon = toggleBtn?.querySelector('i');
      if (!input || !toggleBtn || !eyeIcon) {
        return;
      }
      toggleBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        eyeIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });
  }

  /**
   * Validates new password on the client (mirrors server rules).
   * @param {string} password - Plain password
   * @returns {string|null} Error message or null when valid
   */
  function validateClientPassword(password) {
    if (password.length < 8) {
      return 'رمز جدید باید حداقل ۸ کاراکتر باشد';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'رمز جدید باید حداقل یک حرف داشته باشد';
    }
    if (!/\d/.test(password)) {
      return 'رمز جدید باید حداقل یک رقم داشته باشد';
    }
    return null;
  }

  /**
   * Closes the dropdown menu.
   */
  function closeMenu() {
    menuOpen = false;
    const menu = hostElement?.querySelector('.admin-dropdown-menu');
    const toggle = hostElement?.querySelector('.admin-dropdown-toggle');
    if (menu) {
      menu.hidden = true;
      menu.classList.remove('is-open');
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Opens the dropdown menu.
   */
  function openMenu() {
    menuOpen = true;
    const menu = hostElement?.querySelector('.admin-dropdown-menu');
    const toggle = hostElement?.querySelector('.admin-dropdown-toggle');
    if (menu) {
      menu.hidden = false;
      menu.classList.add('is-open');
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  /**
   * Shows SweetAlert form for Super Admin password change.
   */
  async function showChangePasswordDialog() {
    closeMenu();
    const result = await Swal.fire({
      title: 'تغییر رمز عبور',
      html: `
        <div class="swal-password-field password-input-group">
          <input type="password" id="adminCurrentPassword" class="swal2-input" placeholder="رمز فعلی" autocomplete="current-password">
          <button type="button" class="password-toggle-btn" aria-label="نمایش رمز فعلی"><i class="fas fa-eye"></i></button>
        </div>
        <div class="swal-password-field password-input-group">
          <input type="password" id="adminNewPassword" class="swal2-input" placeholder="رمز جدید" autocomplete="new-password">
          <button type="button" class="password-toggle-btn" aria-label="نمایش رمز جدید"><i class="fas fa-eye"></i></button>
        </div>
        <div class="swal-password-field password-input-group">
          <input type="password" id="adminConfirmPassword" class="swal2-input" placeholder="تکرار رمز جدید" autocomplete="new-password">
          <button type="button" class="password-toggle-btn" aria-label="نمایش تکرار رمز"><i class="fas fa-eye"></i></button>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'ذخیره',
      cancelButtonText: 'انصراف',
      didOpen: () => {
        wirePasswordToggles(Swal.getHtmlContainer());
      },
      preConfirm: () => {
        const currentPassword = document.getElementById('adminCurrentPassword')?.value ?? '';
        const newPassword = document.getElementById('adminNewPassword')?.value ?? '';
        const confirmPassword = document.getElementById('adminConfirmPassword')?.value ?? '';
        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('همه فیلدها الزامی هستند');
          return false;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('رمز جدید و تکرار آن یکسان نیستند');
          return false;
        }
        const validationError = validateClientPassword(newPassword);
        if (validationError) {
          Swal.showValidationMessage(validationError);
          return false;
        }
        return { currentPassword, newPassword, confirmPassword };
      },
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    try {
      const changeResult = await ModuleHubApi.changeSuperAdminPassword(
        result.value.currentPassword,
        result.value.newPassword,
        result.value.confirmPassword,
      );
      await Swal.fire({
        icon: 'success',
        title: 'رمز تغییر کرد',
        text: 'لطفاً دوباره وارد شوید.',
        timer: 2500,
        showConfirmButton: false,
      });
      window.location.href = changeResult.redirect || '/admin/login';
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  /**
   * Logs out Super Admin and runs optional callback.
   */
  async function handleLogout() {
    closeMenu();
    try {
      await ModuleHubApi.logoutSuperAdmin();
      await Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: 'با موفقیت خارج شدید',
        showConfirmButton: false,
        timer: 3000,
      });
      if (typeof onAfterLogout === 'function') {
        await onAfterLogout();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'خطا', text: error.message });
    }
  }

  /**
   * Handles menu item clicks via event delegation.
   * @param {MouseEvent} event - Click event
   */
  function handleMenuClick(event) {
    const action = event.target.closest('[data-admin-menu-action]')?.getAttribute('data-admin-menu-action');
    if (!action) {
      return;
    }
    event.preventDefault();
    if (action === 'settings') {
      closeMenu();
      window.location.href = '/admin/settings';
      return;
    }
    if (action === 'change-password') {
      void showChangePasswordDialog();
      return;
    }
    if (action === 'logout') {
      void handleLogout();
    }
  }

  /**
   * Toggles dropdown open state.
   * @param {Event} event - Click event on toggle button
   */
  function handleToggleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Closes menu when clicking outside.
   * @param {MouseEvent} event - Document click
   */
  function handleDocumentClick(event) {
    if (!hostElement || !menuOpen) {
      return;
    }
    const target = event.target;
    if (target instanceof Node && !hostElement.contains(target)) {
      closeMenu();
    }
  }

  /**
   * Closes menu on Escape key.
   * @param {KeyboardEvent} event - Keydown event
   */
  function handleDocumentKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }

  /**
   * Renders guest login link or Super Admin dropdown.
   * @param {boolean} isSuperAdmin - Whether user has Super Admin session
   */
  function render(isSuperAdmin) {
    if (!hostElement) {
      return;
    }
    closeMenu();

    if (!isSuperAdmin) {
      hostElement.innerHTML = `
        <a class="admin-login-link" href="/admin/login">
          <i class="fas fa-user-shield"></i> ورود ادمین
        </a>`;
      return;
    }

    hostElement.innerHTML = `
      <div class="admin-dropdown">
        <button type="button" class="admin-login-link admin-dropdown-toggle" aria-expanded="false" aria-haspopup="true">
          <i class="fas fa-user-check"></i> Super Admin
          <i class="fas fa-chevron-down admin-dropdown-chevron"></i>
        </button>
        <div class="admin-dropdown-menu" hidden>
          <a href="/admin/settings" class="admin-dropdown-item" data-admin-menu-action="settings">
            <i class="fas fa-cogs"></i> تنظیمات سراسری
          </a>
          <button type="button" class="admin-dropdown-item" data-admin-menu-action="change-password">
            <i class="fas fa-key"></i> تغییر رمز عبور
          </button>
          <button type="button" class="admin-dropdown-item admin-dropdown-item-danger" data-admin-menu-action="logout">
            <i class="fas fa-sign-out-alt"></i> خروج
          </button>
        </div>
      </div>`;

    hostElement.querySelector('.admin-dropdown-toggle')?.addEventListener('click', handleToggleClick);
    hostElement.addEventListener('click', handleMenuClick);
  }

  return {
    /**
     * Mounts admin menu into a host element and wires global listeners once.
     * @param {string} containerId - Host element id
     * @param {{ onAfterLogout?: () => void|Promise<void> }} [options] - Callbacks
     */
    mount(containerId, options = {}) {
      hostElement = document.getElementById(containerId);
      onAfterLogout = options.onAfterLogout ?? null;
      if (!hostElement) {
        return;
      }
      if (!globalListenersAttached) {
        document.addEventListener('click', handleDocumentClick, true);
        document.addEventListener('keydown', handleDocumentKeydown);
        globalListenersAttached = true;
      }
    },

    /**
     * Updates menu visibility based on auth state.
     * @param {boolean} isSuperAdmin - Super Admin session flag
     */
    update(isSuperAdmin) {
      render(Boolean(isSuperAdmin));
    },

    /** Opens change-password dialog (for settings page form button). */
    showChangePasswordDialog,

    /** Wires password visibility toggles in a container (settings form). */
    wirePasswordToggles,
  };
})();
