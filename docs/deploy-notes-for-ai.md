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

---

## فایل‌های محلی سرور (git overwrite نکند)

`.env` · `storage/*` · `standalone-modules/`

</div>
