<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
    font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
    direction: rtl;
    text-align: right;
}
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
thead th, tbody td { text-align: right; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: left; display: inline-block; }
</style>

<div dir="rtl" style="text-align:right;">

# کار روزانه — لوکال، push، deploy

> سرور: `ash@192.168.88.50` · اجرا: **`/opt/modulehub-cms`** · pull: معمولاً **`~/ModuleHub-cms`**  
> اسکریپت‌ها: [`server-scripts.md`](server-scripts.md) · برای AI: [`deploy-notes-for-ai.md`](deploy-notes-for-ai.md)

---

## نمای کلی

```
[Windows] → git push → [GitHub] → git pull (home) → install-to-opt → deploy-on-server
```

---

## لوکال (قبل از push)

```powershell
npm run lint
npm run test
git add .
git commit -m "feat: ..."
git push origin main
```

**حتماً** `package-lock.json` در repo باشد. `.env` و `storage/` را push نکن.

---

## نصب اولیه سرور (یک‌بار)

ترمینال SSH **تعاملی** (sudo broker روشن باشد):

```bash
source ~/.nvm/nvm.sh
nvm use 20

git clone https://github.com/alishafiee1/ModuleHub-cms.git ~/ModuleHub-cms
cd ~/ModuleHub-cms
cp .env.example .env
nano .env   # SESSION_SECRET + ADMIN_PASSWORD_HASH

bash scripts/setup-server-dirs.sh    # sudo
npm ci && npm run build

bash scripts/install-to-opt.sh       # sync + npm ci در opt
cd /opt/modulehub-cms
bash scripts/install-systemd.sh      # sudo
curl http://127.0.0.1:4000/health
```

اگر `/opt` خالی بود: `sudo mkdir -p /opt/modulehub-cms && sudo chown ash:ash /opt/modulehub-cms`

---

## به‌روزرسانی (هر بار بعد از push)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms
git pull origin main

# اگر pull گفت untracked overwrite — فایل محلی سرور را پاک کن یا: git stash -u
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull
```

یا همه‌چیز در opt (اگر آنجا git داری):

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd /opt/modulehub-cms
git pull
bash scripts/deploy-on-server.sh --skip-pull
```

از Windows (با prompt sudo):

```powershell
ssh -t ash@192.168.88.50 "source ~/.nvm/nvm.sh && nvm use 20 && cd ~/ModuleHub-cms && git pull && bash scripts/install-to-opt.sh && cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull"
```

---

## چک بعد از deploy

```bash
curl -s http://127.0.0.1:4000/health    # {"status":"ok"}
sudo systemctl status modulehub-cms
```

سایت از بیرون: `https://haderbash.ir` (Nginx → localhost:4000). **باز کردن پورت 4000 در فایروال لازم نیست.**

---

## عیب‌یابی سریع

| مشکل | کار |
|------|-----|
| `pipefail: invalid option` | `sed -i 's/\r$//' scripts/*.sh` یا `bash scripts/...` |
| `Permission denied` روی `./` | `bash scripts/foo.sh` |
| `Cannot find module 'express'` | `cd /opt/modulehub-cms && npm ci --omit=dev` |
| `npm: command not found` | `source ~/.nvm/nvm.sh && nvm use 20` |
| `sudo: terminal required` | SSH با `-t` یا sudo broker — نه از agent بدون TTY |
| `git pull` overwrite | فایل‌های ویرایش‌شده روی سرور را بردار؛ فقط از git بیاید |
| health قطع | `cd /opt/modulehub-cms && npm ci --omit=dev && sudo systemctl restart modulehub-cms` |

---

## روی سرور دست نزن (با git)

`.env` · `storage/site-layout.json` · `storage/system-settings.json` · `standalone-modules/`

---

## ارجاع

[`design plan.md`](design%20plan.md) · [`code-rolls.md`](code-rolls.md) · [`tasks.md`](tasks.md)

</div>
