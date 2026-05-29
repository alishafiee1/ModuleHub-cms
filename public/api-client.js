/**
 * ModuleHub CMS frontend API client — fetch layout and admin actions with session + CSRF.
 */
const ModuleHubApi = (function createModuleHubApi() {
  let csrfToken = null;

  /**
   * Returns headers for mutating admin requests including CSRF when available.
   * @param {Record<string, string>} [extraHeaders] - Additional headers
   * @returns {Record<string, string>}
   */
  function buildHeaders(extraHeaders = {}) {
    const headers = {
      Accept: 'application/json',
      ...extraHeaders,
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    return headers;
  }

  /**
   * Loads or refreshes CSRF token from auth status or dedicated endpoint.
   * @returns {Promise<string|null>}
   */
  async function ensureCsrfToken() {
    const statusResponse = await fetch('/api/auth/status', { credentials: 'same-origin' });
    if (statusResponse.ok) {
      const statusBody = await statusResponse.json();
      if (statusBody.csrfToken) {
        csrfToken = statusBody.csrfToken;
        return csrfToken;
      }
    }

    const csrfResponse = await fetch('/api/auth/csrf-token', { credentials: 'same-origin' });
    if (!csrfResponse.ok) {
      throw new Error('Failed to load CSRF token');
    }
    const csrfBody = await csrfResponse.json();
    csrfToken = csrfBody.csrfToken;
    return csrfToken;
  }

  /**
   * Performs JSON fetch with session cookies and CSRF for mutating methods.
   * @param {string} url - Request URL
   * @param {RequestInit} [options] - Fetch options
   * @returns {Promise<any>} Parsed JSON body
   */
  async function requestJson(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (isMutation && !csrfToken) {
      await ensureCsrfToken();
    }

    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: buildHeaders(options.headers || {}),
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.error || `Request failed (${response.status})`;
      if (
        isMutation
        && response.status === 403
        && !options._csrfRetried
        && String(message).toLowerCase().includes('csrf')
      ) {
        await ensureCsrfToken();
        return requestJson(url, { ...options, _csrfRetried: true });
      }
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Loads site layout from backend.
   * @returns {Promise<object>} Layout tree and modules
   */
  async function loadLayout() {
    return requestJson('/api/layout');
  }

  /**
   * Loads current auth session status and caches CSRF token.
   * @returns {Promise<{ isSuperAdmin: boolean, managedModuleIds: string[], csrfToken?: string }>}
   */
  async function loadAuthStatus() {
    const status = await requestJson('/api/auth/status');
    if (status.csrfToken) {
      csrfToken = status.csrfToken;
    }
    return status;
  }

  /**
   * Logs in as Super Admin.
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<{ redirect?: string, message: string }>}
   */
  async function loginSuperAdmin(username, password) {
    return requestJson('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  }

  /**
   * Logs out current session.
   * @returns {Promise<{ message: string }>}
   */
  async function logoutSuperAdmin() {
    return requestJson('/admin/logout', { method: 'POST' });
  }

  /**
   * Authenticates Module Manager for a specific module.
   * @param {string} moduleId - Module id
   * @param {string} password - Module management password
   * @returns {Promise<{ moduleId: string, message: string }>}
   */
  async function authenticateModule(moduleId, password) {
    return requestJson(`/admin/module/${moduleId}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  }

  /**
   * Creates a virtual folder (Super Admin).
   * @param {string} parentId - Parent folder id
   * @param {string} name - Folder display name
   * @returns {Promise<object>}
   */
  async function createFolder(parentId, name) {
    return requestJson('/admin/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, name }),
    });
  }

  /**
   * Uploads a module ZIP archive.
   * @param {File} zipFile - ZIP file from file input
   * @returns {Promise<{ moduleId: string }>}
   */
  async function uploadZip(zipFile) {
    if (!csrfToken) {
      await ensureCsrfToken();
    }
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    const response = await fetch('/admin/upload', {
      method: 'POST',
      credentials: 'same-origin',
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      body: formData,
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Upload failed (${response.status})`);
    }
    return response.json();
  }

  /**
   * Completes wizard and registers module in site-layout.
   * @param {object} payload - Wizard save body
   * @returns {Promise<object>}
   */
  async function saveWizard(payload) {
    return requestJson('/admin/wizard/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Starts a module by id.
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function startModule(moduleId) {
    return requestJson(`/admin/module/${moduleId}/start`, { method: 'POST' });
  }

  /**
   * Stops a module by id.
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function stopModule(moduleId) {
    return requestJson(`/admin/module/${moduleId}/stop`, { method: 'POST' });
  }

  /**
   * Restarts a module (stop if running, then start).
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function restartModule(moduleId) {
    return requestJson(`/admin/module/${moduleId}/restart`, { method: 'POST' });
  }

  /**
   * Fetches tail of module log lines.
   * @param {string} moduleId - Module id
   * @param {string|null} level - Optional level filter: debug | info | error
   * @returns {Promise<{ content: string, maxLines: number, level: string|null }>}
   */
  async function fetchModuleLogs(moduleId, level = null) {
    const query = level ? `?level=${encodeURIComponent(level)}` : '';
    return requestJson(`/admin/module/${moduleId}/logs${query}`);
  }

  /**
   * Opens full module log download in a new tab.
   * @param {string} moduleId - Module id
   */
  function downloadModuleLogs(moduleId) {
    window.open(`/admin/module/${moduleId}/logs/download`, '_blank');
  }

  /**
   * Updates module settings.
   * @param {string} moduleId - Module id
   * @param {object} payload - PATCH body
   * @returns {Promise<object>}
   */
  async function updateModule(moduleId, payload) {
    return requestJson(`/admin/module/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Deletes a module permanently (Super Admin).
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function deleteModule(moduleId) {
    return requestJson(`/admin/module/${moduleId}`, { method: 'DELETE' });
  }

  /**
   * Triggers browser download of module backup ZIP.
   * @param {string} moduleId - Module id
   */
  function downloadModuleBackup(moduleId) {
    window.open(`/admin/module/${moduleId}/backup`, '_blank');
  }

  /**
   * Runs git pull and dependency reinstall for a module.
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function syncModuleGitHub(moduleId) {
    return requestJson(`/admin/module/${moduleId}/github-sync`, { method: 'POST' });
  }

  /**
   * Loads system settings for the admin settings page.
   * @returns {Promise<{ settings: object, networkInterfaces: string[], showNicSelector: boolean }>}
   */
  async function loadSystemSettings() {
    return requestJson('/admin/settings/data');
  }

  /**
   * Saves partial system settings (Super Admin).
   * @param {object} payload - Settings fields to update
   * @returns {Promise<{ settings: object, message: string }>}
   */
  async function saveSystemSettings(payload) {
    return requestJson('/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  return {
    ensureCsrfToken,
    loadLayout,
    loadAuthStatus,
    loginSuperAdmin,
    logoutSuperAdmin,
    authenticateModule,
    createFolder,
    uploadZip,
    saveWizard,
    startModule,
    stopModule,
    restartModule,
    fetchModuleLogs,
    downloadModuleLogs,
    updateModule,
    deleteModule,
    downloadModuleBackup,
    syncModuleGitHub,
    loadSystemSettings,
    saveSystemSettings,
  };
})();
