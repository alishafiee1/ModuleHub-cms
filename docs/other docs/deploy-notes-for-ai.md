<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
th, td { text-align: right; padding: 0.35em 0.5em; }
</style>

<div dir="rtl" style="text-align:right;">

# استقرار — نکات برای AI (فشرده)

> **مرجع اصلی عملیات:** [`dev-workflow.md`](dev-workflow.md) — قبل از پیشنهاد SSH/deploy آن را بخوان.  
> خطاهای این پروژه: [`AI-common-mistakes/`](AI-common-mistakes/readme.md)

---

## دستور استاندارد deploy (کپی)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms
bash scripts/run-with-free-wan.sh git pull origin main
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull
curl -sf http://127.0.0.1:4000/health
```

**بازیابی:** `export MODULEHUB_SKIP_WAN=1` + `git reset --hard origin/main` → همان deploy — [`dev-workflow.md` §۵](dev-workflow.md)

**ادمین موقت (تا فاز ۸):** `python3 ~/ModuleHub-cms/scripts/run_via_broker.py 'bash /home/ash/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'` → `isSuperAdmin:true`

**`install-to-opt`:** `.env` در `/opt` را **overwrite نمی‌کند** (rsync `--exclude .env`)

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
| metric toggler crash | `MODULEHUB_SKIP_WAN=1` + همگام‌سازی git |
| `npm: not found` در package-cache (systemd) | `MODULEHUB_NPM_PATH` در `.env` یا auto از `~/.nvm/versions/node/` |
| restart بعد deploy بدون TTY | `python3 ~/ModuleHub-cms/scripts/run_via_broker.py 'systemctl restart modulehub-cms'` |

---

## backup-restore (فاز ۶)

- مسیر: `/opt/modulehub-cms/storage/backups/` — هر `POST /admin/backup` یک فایل جدید
- لیست: `curl -s http://127.0.0.1:4000/admin/backup/list`
- restore: `curl -X POST …/admin/restore -F backup=@…/modulehub-full-….zip -F confirm=true` (pre-restore خودکار)
- **UI:** دکمهٔ بکاپ کل نیست — ⚙ «پشتیبان ZIP» = تکی

---

## package-cache (فاز ۴)

- کش: `/var/cache/modulehub/pkg/<hash>/` — symlink به `node_modules` / `venv` / `vendor`
- smoke: `bash scripts/test-package-cache-manual.sh` (ZIP باید `package.json` در **ریشه** zip باشد، نه داخل `mod/`)
- اسکریپت از ویندوز → قبل از اجرا: `sed -i 's/\r$//' scripts/test-package-cache-manual.sh`

---

## فایل‌های محلی سرور (git overwrite نکند)

`.env` · `storage/*` · `standalone-modules/`

</div>
