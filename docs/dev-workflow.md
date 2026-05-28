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

table {
    direction: rtl;
    text-align: right;
    width: 100%;
    border-collapse: collapse;
}

thead th,
tbody td {
    text-align: right;
    vertical-align: top;
    padding: 0.35em 0.5em;
}

table td code,
table th code {
    direction: ltr;
    unicode-bidi: embed;
    text-align: left;
    display: inline-block;
}
</style>

<div dir="rtl" style="text-align:right;">

# راهنمای کار روزانه — توسعه لوکال و استقرار روی سرور

> **مخزن عمومی:** [github.com/alishafiee1/ModuleHub-cms](https://github.com/alishafiee1/ModuleHub-cms)  
> **سرور:** `ash@192.168.88.50` — مسیر نصب: `/opt/modulehub-cms`  
> **اسکریپت deploy سرور:** `scripts/deploy-on-server.sh`  
> **راهنمای اسکریپت‌ها:** [`server-scripts.md`](server-scripts.md)

---

## نمای کلی

```
[Windows — Cursor]  →  git push  →  [GitHub عمومی]  →  git pull  →  [Ubuntu سرور]
     lint + test                           ↑                    deploy-on-server.sh
     (اختیاری build لوکال)                                      build + restart
```

| مرحله | کجا | چه کسی |
|--------|-----|--------|
| تغییر کد | سیستم خودت | تو + Cursor |
| تست واحد | سیستم خودت | `npm run test` |
| انتشار کد | GitHub | `git push` |
| دریافت کد | سرور | `git pull` |
| بیلد + restart | سرور | `deploy-on-server.sh` |

---

## پیش‌نیازها

### روی Windows (لوکال)

- Git
- Node.js 20+
- Cursor / VS Code
- clone مخزن:

```powershell
git clone https://github.com/alishafiee1/ModuleHub-cms.git
cd ModuleHub-cms
npm install
```

### روی سرور (یک‌بار — نصب اولیه)

```bash
ssh ash@192.168.88.50

sudo mkdir -p /opt/modulehub-cms
sudo chown ash:ash /opt/modulehub-cms

git clone https://github.com/alishafiee1/ModuleHub-cms.git /opt/modulehub-cms
cd /opt/modulehub-cms

cp .env.example .env
# ویرایش .env — SESSION_SECRET و ADMIN_PASSWORD_HASH

chmod +x scripts/*.sh
./scripts/deploy-on-server.sh
```

**اگر کپی به `/opt` خطای Permission داد** — یا مالکیت را درست کن، یا موقتاً از home اجرا کن:

```bash
# روش A — نصب در home (سریع)
cd ~/ModuleHub-cms
chmod +x scripts/*.sh    # یا: bash scripts/setup-server-dirs.sh
bash scripts/setup-server-dirs.sh
npm ci && npm run build
cp .env.example .env      # SESSION_SECRET و ADMIN_PASSWORD_HASH
bash scripts/install-systemd.sh   # مسیر home را خودکار می‌گیرد

# روش B — انتقال به /opt
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
npm ci && npm run build
MODULEHUB_APP_DIR=/opt/modulehub-cms bash scripts/install-systemd.sh
```

```bash
# مالکیت /opt برای clone مستقیم
sudo mkdir -p /opt/modulehub-cms
sudo chown ash:ash /opt/modulehub-cms
git clone https://github.com/alishafiee1/ModuleHub-cms.git /opt/modulehub-cms
```

دایرکتوری‌های داده (روی سرور، خارج از git):

```bash
mkdir -p storage/{logs,backups} standalone-modules thumbnails
mkdir -p /var/log/modulehub/modules /var/cache/modulehub/pkg
```

---

## قدم ۱ — تغییر کد در سیستم خودت

1. branch مناسب بساز (اختیاری):

```powershell
git checkout -b feat/my-change
```

2. کد را در Cursor ویرایش کن (`core/src/`, `public/`, `scripts/`).

3. قبل از push (پایان هر فاز — [`code-rolls.md`](code-rolls.md)):

```powershell
npm run lint
npm run test
# اختیاری — بیلد لوکال برای اطمینان:
npm run build
```

> **نکته:** بیلد نهایی روی **سرور** هم انجام می‌شود؛ لوکال فقط برای اطمینان است.

---

## قدم ۲ — commit و push به مخزن عمومی

```powershell
git status
git add .
git commit -m "feat: توضیح کوتاه تغییر"
git push origin main
```

| پیشوند commit | کاربرد |
|----------------|--------|
| `feat:` | قابلیت جدید |
| `fix:` | رفع باگ |
| `test:` | تست |
| `docs:` | مستندات |

**هرگز push نکن:** `.env`، `storage/`، `standalone-modules/` — در `.gitignore` هستند.

---

## قدم ۳ — اتصال به سرور و دریافت کد

```bash
ssh ash@192.168.88.50
cd /opt/modulehub-cms
git pull
```

یا **یک خط از Windows:**

```powershell
ssh ash@192.168.88.50 "cd /opt/modulehub-cms && git pull"
```

---

## قدم ۴ — deploy روی سرور (بیلد + restart)

اسکریپت `scripts/deploy-on-server.sh` این کارها را انجام می‌دهد:

1. `git pull` (مگر `--skip-pull`)
2. `npm ci --omit=dev`
3. `npm run build` → خروجی: `dist/core/src/server/index.js`
4. کپی `config/systemd/modulehub-cms.service` → `/etc/systemd/system/`
5. `systemctl daemon-reload` + `enable` + `restart`
6. `curl http://127.0.0.1:4000/health` — در صورت خطا deploy متوقف می‌شود

### اجرا

```bash
cd /opt/modulehub-cms
./scripts/deploy-on-server.sh
```

اولین بار **رمز sudo** را می‌پرسد (برای systemd). در طول `npm install` session sudo زنده می‌ماند.

### گزینه‌ها

```bash
./scripts/deploy-on-server.sh --skip-pull   # بعد از git pull دستی
./scripts/deploy-on-server.sh --skip-build  # فقط restart (کم‌کاربرد)
./scripts/deploy-on-server.sh --dry-run     # فقط نمایش مراحل
```

### یک خط از Windows (pull + deploy)

```powershell
ssh -t ash@192.168.88.50 "cd /opt/modulehub-cms && git pull && ./scripts/deploy-on-server.sh --skip-pull"
```

`-t` برای prompt رمز sudo لازم است.

---

## قدم ۵ — بررسی بعد از deploy

```bash
# وضعیت سرویس
sudo systemctl status modulehub-cms --no-pager

# health
curl -s http://127.0.0.1:4000/health

# لاگ زنده
tail -f /opt/modulehub-cms/storage/logs/cms.log
# یا
journalctl -u modulehub-cms -f
```

از مرورگر: `https://haderbash.ir` و در صورت نیاز `https://haderbash.ir/admin/login`

---

## چک‌لیست سریع (هر deploy)

- [ ] لوکال: `npm run lint` + `npm run test`
- [ ] `git push origin main`
- [ ] سرور: `git pull`
- [ ] سرور: `./scripts/deploy-on-server.sh --skip-pull`
- [ ] health → 200
- [ ] smoke test UI

---

## عیب‌یابی

| مشکل | راه‌حل |
|------|--------|
| `git pull` conflict | روی سرور `git stash` یا merge؛ دادهٔ `storage/` را دست نزن |
| `npm ci` fail | `node -v` باید 20+ باشد؛ `rm -rf node_modules && npm ci --omit=dev` |
| build fail | `npm run build` را لوکال هم اجرا کن؛ خطای TypeScript را ببین |
| health fail | `journalctl -u modulehub-cms -n 50` — `.env` و پورت 4000 |
| sudo password هر بار | یک‌بار `sudo -v` قبل از اسکریپت؛ یا NOPASSWD برای `systemctl` (اختیاری) |
| Nginx 502 | CMS down — `systemctl status modulehub-cms` |

---

## فایل‌هایی که روی سرور دست‌نخورده می‌مانند

| مسیر | دلیل |
|------|------|
| `.env` | رمز و secret — فقط روی سرور |
| `storage/site-layout.json` | دادهٔ زنده سایت |
| `storage/system-settings.json` | تنظیمات ادمین |
| `standalone-modules/` | ماژول‌های نصب‌شده |
| `thumbnails/` | تصاویر کارت‌ها |

---

## ارجاع

- معماری و مسیرها: [`design plan.md`](design%20plan.md) §۳–§۴
- قوانین کد: [`code-rolls.md`](code-rolls.md)
- چک‌لیست فازها: [`tasks.md`](tasks.md) · `openspec/changes/modulehub-cms-v1/tasks.md`
- systemd: [`config/systemd/modulehub-cms.service`](../config/systemd/modulehub-cms.service)

</div>
