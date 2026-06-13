<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
  font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
  direction: rtl;
  text-align: right;
}
pre, code {
  direction: ltr;
  text-align: left;
}
.markdown-body table,
.markdown-preview-section table,
table {
  direction: rtl !important;
  text-align: right !important;
  width: 100%;
  border-collapse: collapse;
  margin-inline-start: 0;
  margin-inline-end: auto;
}
.markdown-body th,
.markdown-body td,
.markdown-preview-section th,
.markdown-preview-section td,
table thead th,
table tbody td,
table th,
table td {
  text-align: right !important;
  direction: rtl;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
.task-list-item input[type="checkbox"],
input.task-list-item-checkbox {
  margin: 0 0.5em 0 0 !important;
}
</style>

# استقرار — نکات برای AI (فشرده)

> **مرجع اصلی عملیات:** [`deploy-guide.md`](deploy-guide.md) — قبل از پیشنهاد SSH/deploy آن را بخوان.  
> خطاهای این پروژه: [`AI-common-mistakes/`](AI-common-mistakes/readme.md)

---

## دستور استاندارد deploy (کپی)

**توصیه‌شده:**

```bash
source ~/.nvm/nvm.sh && nvm use 20
bash ~/ModuleHub-cms/scripts/deploy-full.sh --yes
```

**دستی (مرحله‌به‌مرحله):**

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms
bash scripts/run-with-free-wan.sh git pull origin main
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull
curl -sf http://127.0.0.1:4000/health
```

### deploy-full flags

| Flag | کار |
|------|-----|
| `--yes` | تأیید خودکار سؤالات |
| `--force-reset` | reset به origin/main بدون سؤال |
| `--force-rebuild` | build حتی وقتی marker برابر است |
| `--skip-wan` | فقط git — بدون metric toggle (npm همچنان toggler) |
| `--skip-wan-all` | git + npm بدون toggler (legacy — روی registry فیلترشده build می‌شکند) |
| `--dry-run` | فقط چاپ مراحل |
| `--no-restart` | build بدون restart |

**سؤالات تعاملی deploy-full (پیش‌فرض N):**

| سؤال | y یعنی |
|------|--------|
| Install/update logrotate config? | کپی `config/logrotate/modulehub-cms` → `/etc/logrotate.d/modulehub-cms` |
| Restart nginx? | `nginx -t` + reload/restart |
| Enable dev Super Admin? | `enable-dev-admin-on-server.sh` تا فاز ۸ |

برای non-interactive: `--yes`

### env

| متغیر | پیش‌فرض | کار |
|--------|---------|-----|
| `MODULEHUB_WAN_INTERFACES` | از settings + default routes | لیست NIC برای git/npm (comma-separated) |
| `MODULEHUB_SKIP_WAN` | — | `1` = بدون toggler |
| `MODULEHUB_SOURCE` | `~/ModuleHub-cms` | home clone |
| `MODULEHUB_APP_DIR` | `/opt/modulehub-cms` | live app |

Marker: `/opt/modulehub-cms/storage/.deploy-commit`

**بازیابی / discard تغییرات clone home:**

```bash
cd ~/ModuleHub-cms
git fetch origin
git reset --hard origin/main
git clean -fd
bash scripts/deploy-full.sh
```

`deploy-full` بعد از fetch به‌جای `git pull` از **`reset --hard` + `clean -fd`** استفاده می‌کند تا فایل‌های SCP/untracked مانع نشوند.

**SCP از ویندوز:** فایل‌های untracked روی clone با pull تداخل دارند — یا فقط از git استفاده کن، یا بعد از SCP حتماً `reset --hard` بزن.

**ادمین موقت (تا فاز ۸):** `python3 ~/ModuleHub-cms/scripts/run_via_broker.py 'bash ~/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'` → `isSuperAdmin:true`

**`install-to-opt`:** `.env` در `/opt` را **overwrite نمی‌کند** (rsync `--exclude .env`)

**logrotate (تأیید سرور 2026-05-29):** `logrotate 3.22.0` · `/etc/logrotate.d/modulehub-cms` — rotate 14 روز · daily · compress

---

## اشتباهات — تکرار نکن

| اشتباه | درست |
|--------|------|
| `$env:VAR` در SSH Ubuntu | `export VAR=1` یا `.env` |
| `npm run dev` در `/opt` | `deploy-on-server` / systemd — `tsx` نیست |
| `npm ci --omit=dev` سپس build | deploy: `npm ci` → build → `npm prune --omit=dev` |
| `./scripts/x.sh` از clone ویندوز | `bash scripts/x.sh` |
| deploy بدون `install-to-opt` | rsync home → opt + npm در `/opt` |
| `ufw allow 4000` | فقط Nginx :443 |
| SSH + `sudo systemctl` بدون TTY | `ssh -t` یا sudo broker |
| ویرایش `scripts/` روی سرور | لوکال + push |
| metric toggler crash | git: auto SKIP_WAN وقتی default=enp63s0 · npm: `run-with-free-wan` · **نه** `--skip-wan-all` روی registry فیلتر |
| کپی unit با `User=deploy` | `deploy-full` از `install-systemd.sh` با `MODULEHUB_SERVICE_USER` استفاده می‌کند |
| `npm: not found` در package-cache (systemd) | `MODULEHUB_NPM_PATH` در `.env` یا auto از `~/.nvm/versions/node/` |
| SCP اسکریپت به clone + pull | `git push` + `deploy-full` · یا `reset --hard && git clean -fd` |
| CRLF در `.sh` از ویندوز | `.gitattributes` · `sed -i 's/\r$//'` · LF قبل از SCP |
| restart بعد deploy بدون TTY | `deploy-full.sh` (broker داخلی) یا `run_via_broker.py` |
| deploy دستی چند مرحله | `bash scripts/deploy-full.sh` |

---

## backup-restore (فاز ۶)

- مسیر: `/opt/modulehub-cms/storage/backups/` — هر `POST /admin/backup` یک فایل جدید
- لیست: `curl -s http://127.0.0.1:4000/admin/backup/list`
- restore: `curl -X POST …/admin/restore -F backup=@…/modulehub-full-….zip -F confirm=true` (pre-restore خودکار)
- **UI:** دکمهٔ بکاپ کل نیست — ⚙ «پشتیبان ZIP» = تکی

---

## package-cache (فاز ۴)

- کش: `/var/cache/modulehub/pkg/<hash>/` — symlink به `node_modules` / `venv` / `vendor`
- smoke: `bash scripts/smoke/test-package-cache.sh` (ZIP باید `package.json` در **ریشه** zip باشد، نه داخل `mod/`)
- اسکریپت از ویندوز → قبل از اجرا: `sed -i 's/\r$//' scripts/smoke/test-package-cache.sh`

---

## فایل‌های محلی سرور (git overwrite نکند)

`.env` · `storage/*` · `standalone-modules/`


