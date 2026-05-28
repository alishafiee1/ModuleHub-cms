<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
th, td { text-align: right; padding: 0.35em 0.5em; }
</style>

<div dir="rtl" style="text-align:right;">

# استقرار سرور — نکات برای AI (خلاصه)

> منبع عملیاتی کاربر: [`dev-workflow.md`](dev-workflow.md) · [`server-scripts.md`](server-scripts.md)  
> سرور: `ash@192.168.88.50` · مسیر اجرا: **`/opt/modulehub-cms`** · clone/pull معمولاً در **`~/ModuleHub-cms`**

---

## جریان درست (خلاصه)

1. لوکال: `lint` + `test` + `git push` (حتماً **`package-lock.json`** commit شود)
2. سرور: `source ~/.nvm/nvm.sh && nvm use 20`
3. `cd ~/ModuleHub-cms && git pull` (نه ویرایش دستی اسکریپت روی سرور)
4. `bash scripts/run-with-free-wan.sh git pull origin main` — **قبل از pull** اگر GitHub از ens4 نمی‌آید
5. `bash scripts/install-to-opt.sh` → rsync + **`npm ci` با free WAN** در opt
6. `cd /opt/modulehub-cms && bash scripts/install-systemd.sh` (نیاز **ترمینال تعاملی** / sudo broker)
7. `curl http://127.0.0.1:4000/health` → `{"status":"ok"}`

به‌روزرسانی روزانه: `cd /opt/modulehub-cms && git pull` یا pull در home + `install-to-opt` + `bash scripts/deploy-on-server.sh`

---

## اشتباهات رایج — AI تکرار نکند

| اشتباه | واقعیت / اصلاح |
|--------|----------------|
| `ssh` بدون `-t` + `sudo systemctl` | `sudo: A terminal is required` — deploy را در SSH تعاملی یا sudo broker بزن |
| `npm` در SSH غیرتعاملی بدون nvm | `npm: command not found` — همیشه `source ~/.nvm/nvm.sh` |
| rsync به `/opt` بدون `npm ci` در opt | `Cannot find module 'express'` — `node_modules` عمداً exclude است؛ **`npm ci` در `/opt` الزامی** |
| `./scripts/foo.sh` بعد از clone ویندوز | CRLF → `set: pipefail: invalid option` — `bash scripts/...` یا `sed -i 's/\r$//' scripts/*.sh`؛ در git: LF + `.editorconfig` |
| `git pull` با فایل untracked هم‌نام | خطای overwrite — حذف/انتقال فایل‌های محلی سرور (`docs/server-scripts.md` و …) یا `git stash -u` |
| ویرایش `scripts/` روی سرور | conflict با pull — فقط لوکال + push |
| `ufw allow 4000` برای دسترسی سایت | CMS فقط **`127.0.0.1:4000`** — بیرون از **Nginx :443** |
| `git pull` / `npm` بدون free WAN | `Failed to connect to github.com` — **`bash scripts/run-with-free-wan.sh <cmd>`** |
| فرض سرویس قدیمی روی 4000 = CMS جدید | ممکن است پروسه/کد قدیمی باشد؛ بعد از deploy حتماً **restart** + health |
| `npm ci` بدون `package-lock.json` | از `npm install` یا commit کردن lock در repo |
| deploy فقط در home بدون opt | systemd و `deploy-on-server.sh` فرض **`/opt/modulehub-cms`** دارند |

---

## دستورات امن (کپی برای agent)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms
bash scripts/run-with-free-wan.sh git pull origin main
sed -i 's/\r$//' scripts/*.sh 2>/dev/null || true
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/install-systemd.sh   # فقط در session با sudo
curl -sf http://127.0.0.1:4000/health
```

---

## فایل‌های سرور که git دست نمی‌زند

`.env` · `storage/*` · `standalone-modules/` — pull/deploy نباید آن‌ها را overwrite کند.

</div>
