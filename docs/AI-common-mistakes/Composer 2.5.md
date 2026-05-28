<div dir="rtl" style="text-align:right;">

# ModuleHub CMS — Composer 2.5 (پروژه‌ای)

> عمومی: [`AI learning docs/.../Composer 2.5.md`](../../../AI%20learning%20docs/AI%20common%20mistakes/Composer%202.5.md)

---

### [DEPLOY-001] `MODULEHUB_DEV_SUPER_ADMIN` فقط در `.env` سرور
- **اشتباه:** فرض کارت + بدون خط در `/opt/modulehub-cms/.env`
- **درست:** `MODULEHUB_DEV_SUPER_ADMIN=1` در `.env` + `sudo systemctl restart modulehub-cms`
- **زمینه:** phase 8 قبل · admin UI

### [DEPLOY-002] metric toggler crash — deploy با کد قدیمی
- **اشتباه:** ادامه deploy وقتی `ip route add` در toggler قدیمی fail شده
- **درست:** `export MODULEHUB_SKIP_WAN=1` → `git reset --hard origin/main` → `install-to-opt` → `deploy-on-server.sh --skip-pull`
- **زمینه:** dual-wan · ash@192.168.88.50

### [DEPLOY-003] `tsc: not found` — build قبل از prune
- **اشتباه:** فقط `npm ci --omit=dev` سپس `npm run build`
- **درست:** deploy جدید: `npm ci` (با dev) → `build` → `npm prune --omit=dev`
- **زمینه:** /opt/modulehub-cms

### [OK-001] مسیر deploy موفق (تأیید شده)
- **راه‌حل:** `MODULEHUB_SKIP_WAN=1` + `reset --hard origin/main` + `install-to-opt.sh` + `deploy-on-server.sh --skip-pull` + health OK
- **تأیید:** `Deploy finished successfully` · `curl http://127.0.0.1:4000/health`
- **زمینه:** e47aa4e+

### [DEPLOY-004] `install-to-opt` — خط DEV از `.env` می‌افتد
- **اشتباه:** فرض `MODULEHUB_DEV_SUPER_ADMIN=1` بعد از هر install-to-opt
- **درست:** `enable-dev-admin-on-server.sh` (drop-in systemd + `.env`) یا دستی خط را دوباره بگذار
- **زمینه:** rsync `--exclude .env` · 2026-05-28

### [DEPLOY-005] فرانت قدیمی در `/opt` — فقط backend deploy
- **اشتباه:** فقط `dist/` یا core deploy؛ `public/script.js` در opt قدیمی می‌ماند
- **درست:** `install-to-opt` + restart · یا SCP `public/*.js` سپس install-to-opt
- **زمینه:** دکمه Start در UI · 2026-05-28

### [OK-002] فعال‌سازی ادمین موقت
- **راه‌حل:** `broker-sudo.py` + `enable-dev-admin-on-server.sh` → `curl /api/auth/status` → `"isSuperAdmin":true`
- **تأیید:** کارت + و Start روی haderbash.ir
- **زمینه:** تا فاز ۸

### [DEPLOY-006] package-cache — `npm: not found` تحت systemd
- **اشتباه:** فرض `npm` در PATH سرویس (`ExecStart=/usr/bin/node` بدون nvm)
- **درست:** کد `resolveNpmExecutablePath()` از `~/.nvm/versions/node/` یا `MODULEHUB_NPM_PATH` در `.env`
- **زمینه:** POST `/admin/upload` · 2026-05-28

### [DEPLOY-007] SCP چند فایل — مسیر اشتباه
- **اشتباه:** `scp file1 file2 user@host:~/.../bootstrap/` — همه در یک پوشه
- **درست:** هر فایل جدا به مسیر target: `.../config/paths.ts` · `.../module-upload-wizard/upload-routes.ts`
- **زمینه:** deploy فاز ۴ · tsc error در bootstrap

### [OK-003] smoke کش پکیج روی سرور
- **راه‌حل:** `deploy-on-server.sh --skip-pull` + `broker-sudo.py systemctl restart` + `bash scripts/test-package-cache-manual.sh`
- **تأیید:** upload2 → `"message":"Linked from package cache"` · `/var/cache/modulehub/pkg/<hash>/`
- **زمینه:** openspec 5.11 · 2026-05-28

### [DOC-001] ZIP با پوشه تو در تو — manifest دیده نمی‌شود
- **اشتباه:** ZIP کردن خود پوشه `phase4-cache-test/` → `package.json` در `mod/` نه ریشه
- **درست:** flat zip — `build-phase4-test-zip.ps1` یا داخل پوشه «انتخاب همه → فشرده‌سازی»
- **زمینه:** upload · dependencies.skipped · 2026-05-28

</div>
