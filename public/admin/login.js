(function initAdminLoginPage() {
  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');

  /**
   * Shows login error message to the user.
   * @param {string} message - Error text
   */
  function showError(message) {
    errorBox.textContent = message;
  }

  // Toggle Password Visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    eyeIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
  });

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
      if (error.status === 429) {
        const waitHint = error.retryAfterSeconds
          ? ` لطفاً ${error.retryAfterSeconds} ثانیه صبر کنید.`
          : ' لطفاً کمی صبر کنید.';
        showError(`تلاش بیش از حد برای ورود.${waitHint}`);
        return;
      }
      showError(error.message || 'ورود ناموفق بود');
    }
  });

  ModuleHubApi.ensureCsrfToken().catch(() => {
    showError('خطا در آماده‌سازی نشست. صفحه را رفرش کنید.');
  });
})();
