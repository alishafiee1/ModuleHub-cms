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
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    const response = await fetch('/admin/upload', {
      method: 'POST',
      credentials: 'same-origin',
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
   * Starts a module by id (auth required — phase 4).
   * @param {string} moduleId - Module id
   * @returns {Promise<object>}
   */
  async function startModule(moduleId) {
    return requestJson(`/admin/module/${moduleId}/start`, { method: 'POST' });
  }

  /**
   * Stops a module by id (auth required).
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
   * @returns {Promise<{ content: string, maxLines: number }>}
   */
  async function fetchModuleLogs(moduleId) {
    return requestJson(`/admin/module/${moduleId}/logs`);
  }

  /**
   * Opens full module log download in a new tab.
   * @param {string} moduleId - Module id
   */
  function downloadModuleLogs(moduleId) {
    window.open(`/admin/module/${moduleId}/logs/download`, '_blank');
  }

  /**
   * Updates module settings (Super Admin).
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

  return {
    loadLayout,
    loadAuthStatus,
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
  };
})();
