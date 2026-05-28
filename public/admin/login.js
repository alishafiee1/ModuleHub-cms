(function initAdminLoginPage() {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');

  /**
   * Shows login error message to the user.
   * @param {string} message - Error text
   */
  function showError(message) {
    errorBox.textContent = message;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showError('');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      await ModuleHubApi.ensureCsrfToken();
      const result = await ModuleHubApi.loginSuperAdmin(username, password);
      window.location.href = result.redirect || '/';
    } catch (error) {
      showError(error.message || 'ورود ناموفق بود');
    }
  });

  ModuleHubApi.ensureCsrfToken().catch(() => {
    showError('خطا در آماده‌سازی نشست. صفحه را رفرش کنید.');
  });
})();
