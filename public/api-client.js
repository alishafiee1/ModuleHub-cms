/**
 * ModuleHub CMS frontend API client — fetch layout and admin actions.
 */
const ModuleHubApi = (function createModuleHubApi() {
  /**
   * Performs JSON fetch with session cookies.
   * @param {string} url - Request URL
   * @param {RequestInit} [options] - Fetch options
   * @returns {Promise<any>} Parsed JSON body
   */
  async function requestJson(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.error || `Request failed (${response.status})`;
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
   * Loads current auth session status.
   * @returns {Promise<{ isSuperAdmin: boolean, managedModuleIds: string[] }>}
   */
  async function loadAuthStatus() {
    return requestJson('/api/auth/status');
  }

  /**
   * Creates a virtual folder (Super Admin — phase 3).
   * @param {string} parentId - Parent folder id
   * @param {string} name - Folder display name
   * @param {string} csrfToken - CSRF token
   * @returns {Promise<object>}
   */
  async function createFolder(parentId, name, csrfToken) {
    return requestJson('/admin/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ parentId, name }),
    });
  }

  /**
   * Starts a module by id (auth required — phase 4).
   * @param {string} moduleId - Module id
   * @param {string} csrfToken - CSRF token
   * @returns {Promise<object>}
   */
  async function startModule(moduleId, csrfToken) {
    return requestJson(`/admin/module/${moduleId}/start`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }

  /**
   * Stops a module by id (auth required — phase 4).
   * @param {string} moduleId - Module id
   * @param {string} csrfToken - CSRF token
   * @returns {Promise<object>}
   */
  async function stopModule(moduleId, csrfToken) {
    return requestJson(`/admin/module/${moduleId}/stop`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    });
  }

  return {
    loadLayout,
    loadAuthStatus,
    createFolder,
    startModule,
    stopModule,
  };
})();
