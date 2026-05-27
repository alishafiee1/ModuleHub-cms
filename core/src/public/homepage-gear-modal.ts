/**
 * Gear control on module card (admin only).
 */
export function renderGearButton(moduleId: string, moduleName: string, status: string): string {
  return `<button type="button" class="card-gear" aria-label=${JSON.stringify(`مدیریت ${moduleName}`)}
    onclick="event.stopPropagation(); event.preventDefault(); openGearModal(${JSON.stringify(moduleId)}, ${JSON.stringify(moduleName)}, ${JSON.stringify(status)})">
    <i class="fas fa-cog" aria-hidden="true"></i>
  </button>`;
}

/**
 * Shared gear admin modal markup.
 */
export function renderGearModalMarkup(): string {
  return `<div id="gear-modal" class="gear-modal" onclick="if(event.target===this) closeGearModal()">
    <div class="gear-modal-panel" role="dialog" aria-labelledby="gear-modal-title">
      <header class="gear-modal-header">
        <h2 id="gear-modal-title">مدیریت ماژول</h2>
        <button type="button" class="gear-close secondary" onclick="closeGearModal()" aria-label="بستن">×</button>
      </header>
      <p id="gear-module-meta" class="gear-meta"></p>
      <section class="gear-section">
        <h3>وضعیت</h3>
        <div id="gear-stats" class="gear-stats">—</div>
      </section>
      <section class="gear-section gear-controls">
        <h3>کنترل</h3>
        <div class="gear-actions">
          <button type="button" onclick="gearStartModule()">Start</button>
          <button type="button" class="secondary" onclick="gearStopModule()">Stop</button>
          <button type="button" class="secondary" onclick="gearLoadLogs()">Logs</button>
          <button type="button" class="secondary" onclick="gearShowSettings()">Settings</button>
          <button type="button" class="danger" onclick="gearDeleteModule()">Delete</button>
        </div>
      </section>
      <section class="gear-section">
        <h3>Logs</h3>
        <pre id="gear-logs" class="gear-logs">—</pre>
      </section>
      <section id="gear-settings-section" class="gear-section hidden">
        <h3>تنظیمات</h3>
        <label class="gear-field">پورت‌ها (با کاما)
          <input id="gear-settings-ports" type="text" dir="ltr" />
        </label>
        <div class="gear-field-row">
          <label class="gear-field">internalPort
            <input id="gear-settings-internal-port" type="number" dir="ltr" />
          </label>
          <label class="gear-field">proxy prefix
            <input id="gear-settings-proxy-prefix" type="text" dir="ltr" />
          </label>
        </div>
        <label class="gear-field">proxy paths
          <input id="gear-settings-proxy-paths" type="text" dir="ltr" placeholder="api" />
        </label>
        <label class="gear-field">iconClass
          <input id="gear-settings-icon-class" type="text" dir="ltr" />
        </label>
        <label class="gear-field">GitHub repo
          <input id="gear-settings-github-repo" type="url" dir="ltr" placeholder="https://github.com/org/repo" />
        </label>
        <label class="gear-field">GitHub branch
          <input id="gear-settings-github-branch" type="text" dir="ltr" placeholder="main" />
        </label>
        <div class="gear-actions">
          <button type="button" onclick="gearSaveSettings()">ذخیره Settings</button>
        </div>
        <p id="gear-settings-msg" class="gear-msg"></p>
      </section>
      <section class="gear-section">
        <h3>پیشرفته</h3>
        <div class="gear-actions">
          <button type="button" class="secondary" onclick="gearGitPull()">Git Pull</button>
          <button type="button" class="secondary" onclick="gearPickPartialZip()">Partial ZIP</button>
          <input id="gear-partial-zip" type="file" accept=".zip" class="hidden" onchange="gearPartialUpload(event)" />
        </div>
        <p class="gear-hint">Git Pull نیاز به <code>manifest.github.repo</code> دارد. Partial ZIP حداکثر ۵۰ فایل.</p>
        <p id="gear-advanced-msg" class="gear-msg"></p>
      </section>
    </div>
  </div>`;
}

/**
 * Client-side gear modal behavior (inline script block).
 */
export function renderGearModalScript(): string {
  return `
    let gearModuleId = null;
    let gearStatsTimer = null;

    function openGearModal(id, name, status) {
      gearModuleId = id;
      document.getElementById('gear-modal')?.classList.add('open');
      document.getElementById('gear-module-meta').textContent = name + ' · ' + status;
      document.getElementById('gear-logs').textContent = '—';
      document.getElementById('gear-settings-msg').textContent = '';
      document.getElementById('gear-settings-section')?.classList.add('hidden');
      gearPollStats();
      if (gearStatsTimer) clearInterval(gearStatsTimer);
      gearStatsTimer = setInterval(gearPollStats, 5000);
    }

    function closeGearModal() {
      document.getElementById('gear-modal')?.classList.remove('open');
      if (gearStatsTimer) { clearInterval(gearStatsTimer); gearStatsTimer = null; }
      gearModuleId = null;
    }

    async function gearPollStats() {
      if (!gearModuleId) return;
      const el = document.getElementById('gear-stats');
      if (!el) return;
      try {
        const { stats } = await api('/modules/' + gearModuleId + '/stats');
        if (stats) {
          el.textContent = 'CPU: ' + stats.cpuPercent + ' · RAM: ' + stats.memoryUsage + '/' + stats.memoryLimit;
        } else {
          el.textContent = 'آمار در دسترس نیست (کانتینر متوقف یا settings_pending)';
        }
      } catch {
        el.textContent = 'خطا در دریافت آمار';
      }
    }

    async function gearStartModule() {
      if (!gearModuleId) return;
      try {
        const r = await api('/modules/' + gearModuleId + '/start', { method: 'POST' });
        if (r.firewallWarning) alert(r.firewallWarning);
        location.reload();
      } catch (e) {
        if (e.payload?.needsSettings) gearShowSettings();
        else alert('خطا در Start');
      }
    }

    async function gearStopModule() {
      if (!gearModuleId) return;
      try {
        await api('/modules/' + gearModuleId + '/stop', { method: 'POST' });
        location.reload();
      } catch { alert('خطا در Stop'); }
    }

    async function gearLoadLogs() {
      if (!gearModuleId) return;
      try {
        const { logs } = await api('/modules/' + gearModuleId + '/logs');
        document.getElementById('gear-logs').textContent = logs || '(خالی)';
      } catch {
        document.getElementById('gear-logs').textContent = 'خطا در دریافت Logs';
      }
    }

    async function gearShowSettings() {
      if (!gearModuleId) return;
      document.getElementById('gear-settings-section')?.classList.remove('hidden');
      try {
        const { settings } = await api('/modules/' + gearModuleId + '/settings');
        document.getElementById('gear-settings-ports').value = (settings.ports || []).join(', ');
        document.getElementById('gear-settings-internal-port').value = settings.internalPort ?? '';
        document.getElementById('gear-settings-proxy-prefix').value = settings.proxyPrefix ?? '';
        document.getElementById('gear-settings-proxy-paths').value = (settings.proxyPaths || ['api']).join(', ');
        document.getElementById('gear-settings-icon-class').value = settings.layoutIconClass ?? '';
        document.getElementById('gear-settings-github-repo').value = settings.github?.repo ?? '';
        document.getElementById('gear-settings-github-branch').value = settings.github?.branch ?? '';
      } catch {
        document.getElementById('gear-settings-msg').textContent = 'خطا در بارگذاری Settings';
      }
    }

    async function gearSaveSettings() {
      if (!gearModuleId) return;
      const portsRaw = document.getElementById('gear-settings-ports').value.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !Number.isNaN(n));
      const proxyPaths = document.getElementById('gear-settings-proxy-paths').value.split(',').map(v => v.trim()).filter(Boolean);
      const githubRepo = document.getElementById('gear-settings-github-repo')?.value?.trim();
      const githubBranch = document.getElementById('gear-settings-github-branch')?.value?.trim();
      const payload = {
        ports: portsRaw,
        internalPort: parseInt(document.getElementById('gear-settings-internal-port').value, 10),
        proxyPrefix: document.getElementById('gear-settings-proxy-prefix').value.trim(),
        proxyPaths: proxyPaths.length ? proxyPaths : ['api'],
        layoutIconClass: document.getElementById('gear-settings-icon-class').value.trim() || undefined,
        github: githubRepo ? { repo: githubRepo, branch: githubBranch || undefined } : undefined,
      };
      try {
        await api('/modules/' + gearModuleId + '/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        location.reload();
      } catch (e) {
        document.getElementById('gear-settings-msg').textContent = e.payload?.errors?.join(', ') || 'خطا در Save';
      }
    }

    async function gearDeleteModule() {
      if (!gearModuleId) return;
      if (!confirm('حذف ماژول «' + gearModuleId + '»؟')) return;
      try {
        await api('/modules/' + gearModuleId, { method: 'DELETE' });
        location.reload();
      } catch { alert('خطا در Delete'); }
    }

    async function gearGitPull() {
      if (!gearModuleId) return;
      if (!confirm('Git Pull ممکن است فایل‌های محلی را بازنویسی کند. پوشه‌های images/markdown/uploads حفظ می‌شوند. ادامه؟')) return;
      const msg = document.getElementById('gear-advanced-msg');
      try {
        const result = await api('/modules/' + gearModuleId + '/git-pull', { method: 'POST' });
        if (msg) msg.textContent = result.output ? 'Pull OK' : 'Pull completed';
        location.reload();
      } catch (e) {
        if (msg) msg.textContent = e.payload?.errors?.join(', ') || e.message;
      }
    }

    function gearPickPartialZip() {
      document.getElementById('gear-partial-zip')?.click();
    }

    async function gearPartialUpload(event) {
      if (!gearModuleId) return;
      const file = event.target?.files?.[0];
      if (!file) return;
      const msg = document.getElementById('gear-advanced-msg');
      const fd = new FormData();
      fd.append('partial', file);
      try {
        const res = await fetch('/api/modules/' + gearModuleId + '/partial-upload', {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw Object.assign(new Error('upload failed'), { payload: data });
        if (msg) msg.textContent = 'Updated: ' + (data.replacedFiles || []).join(', ');
        event.target.value = '';
        location.reload();
      } catch (e) {
        if (msg) msg.textContent = e.payload?.errors?.join(', ') || 'خطا در Partial ZIP';
      }
    }
  `;
}
