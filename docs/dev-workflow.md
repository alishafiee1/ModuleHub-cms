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

/* جدول‌های markdown — RTL + راست‌چین همهٔ سلول‌ها (پیش‌نمایش VS Code / Cursor) */
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
/* نام فایل داخل سلول — LTR ولی چسبیده به راست سلول */
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
</style>


# کار روزانه — از PC تا haderbash.ir

## این فایل برای چیست؟

این سند **راهنمای عملی روزانه** است — نه طراحی سیستم، نه چک‌لیست فازهای توسعه.

وقتی روی PC کد را عوض کردی و می‌خواهی همان نسخه روی **haderbash.ir** برود، از همین فایل استفاده کن: چه دستوری بزنی، کدام پوشه روی سرور مهم است، اگر `git pull` یا ادمین یا `sudo` گیر کرد چه کار کنی.

**برای AI در Cursor:** همان مسیر به‌صورت خطی در [`.cursor/commands/deploy-server.md`](../.cursor/commands/deploy-server.md) (`/deploy-server`) — فشرده و انگلیسی.

---

## روش کار — یک نگاه

۱. **لوکال (ویندوز):** تست و build → `git push`  
۲. **سرور — clone:** `git pull` داخل `~/ModuleHub-cms` (گاهی با اینترنت آزاد / `run-with-free-wan`)  
۳. **سرور — اجرا:** کپی به `/opt` → build → restart سرویس → `curl /health`

```
[PC]  lint · test · build · push
         ↓
[سرور home]  git pull
         ↓
[سرور opt]   install-to-opt  →  deploy-on-server  →  سایت
```

| می‌خواهی… | برو به |
|-----------|--------|
| **هر بار بعد از push** — همان روتین | **§۲** |
| بفهمی `home` و `/opt` چرا دو تا هستند | **§۱** |
| `git pull` خطای overwrite داد | **§۵** |
| دکمه + / Start کار نکرد | **§۴** (ادمین موقت) |
| `sudo` یا broker | **§۴** · **§۹** · **§۱۰** |
| نصب اولیهٔ سرور (یک‌بار) | **§۸** |

> **یادت باشد:** دادهٔ واقعی سایت (`storage/`، ماژول‌ها، `.env` در `/opt`) با deploy معمولی **پاک نمی‌شود** — فقط **کد** عوض می‌شود.

---

> سرور: `ash@192.168.88.50`  
> **کد از Git:** `~/ModuleHub-cms`  
> **برنامه واقعی:** `/opt/modulehub-cms` (systemd همین را اجرا می‌کند)  
> چک‌لیست فازها: [`openspec/.../tasks.md`](../openspec/changes/modulehub-cms-v1/tasks.md) · [`tasks.md`](tasks.md)

---

## وضعیت فازها (خلاصه)

| فاز | چه چیزی | وضعیت |
|-----|---------|--------|
| 0–1 | صفحه اصلی، کارت‌ها | ✅ |
| 2 | آپلود ZIP، پوشه مجازی | ✅ |
| 3 | Start/Stop، باز شدن `/modules/...` | ✅ |
| 4 | کش پکیج (npm/pip/composer) | ✅ |
| 5 | مدیریت ماژول (⚙ gear) | ✅ |
| 6+ | backup کامل، login واقعی، … | ⏳ |

بخش‌های قدیمی این فایل که فقط «فاز ۲» می‌گفتند، در **§۴ (ادمین موقت)** و **§۳ (deploy)** ادغام شده‌اند.

---

## ۱. دو پوشه روی سرور — حتماً بدان

| مسیر | نقش | با git |
|------|-----|--------|
| `~/ModuleHub-cms` | کلون GitHub؛ اینجا `git pull` می‌زنی | بله |
| `/opt/modulehub-cms` | جایی که Nginx و systemd سرویس را می‌بینند | خیر (کپی با rsync) |

**نتیجه:** push از PC → روی سرور اول **home** به‌روز می‌شود → بعد اسکریپت همان را به **opt** می‌برد.

```
[ویندوز] تست → commit → push
    ↓
[سرور home] git pull (گاهی discard لازم)
    ↓
install-to-opt  →  کپی به /opt
    ↓
deploy-on-server  →  build + restart
    ↓
https://haderbash.ir
```

---

## ۲. روتین استاندارد (هر بار که روی PC push کردی)

### الف) روی PC (ویندوز)

```powershell
cd "...\ModuleHub-cms"
npm run lint
npm run test
npm run build
git add .
git commit -m "feat: توضیح کوتاه"
git push origin main
```

**push نکن:** `.env` · `storage/*` · `standalone-modules/*` · `thumbnails/*` (در `.gitignore` هستند).

**push کن:** `package-lock.json` · کد · `public/` · `scripts/`

### ب) روی سرور — روش توصیه‌شده (یک دستور)

```bash
source ~/.nvm/nvm.sh && nvm use 20
bash ~/ModuleHub-cms/scripts/deploy-full.sh
```

اسکریپت **`deploy-full.sh`** این کارها را خودکار می‌کند:
- fetch با fallback اینترفیس (dual-WAN)
- **هم‌راستا با origin:** `reset --hard` + `clean -fd` روی clone home (تغییرات/SCP/untracked دور ریخته می‌شود)
- مقایسه commit با marker در `/opt/storage/.deploy-commit`
- rsync → build → restart (sudo broker یا پسورد)
- health check + سؤالات اختیاری (logrotate، nginx، dev-admin)

> **روی سرور کد ننویس** — دادهٔ واقعی در `/opt` است. SCP اسکript به clone معمولاً لازم نیست؛ `git push` + `deploy-full` کافی است.

**flags:** `--yes` · `--force-reset` · `--force-rebuild` · `--skip-wan` · `--dry-run` · `--no-restart`

### ب۲) روی سرور — دستی (مرحله‌به‌مرحله)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms

bash scripts/run-with-free-wan.sh git pull origin main

bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull

curl -sf http://127.0.0.1:4000/health
```

در مرورگر: **Ctrl+Shift+R** روی `haderbash.ir`

---

## ۳. هر دستور چه کار می‌کند؟ (ساده)

| دستور | یک جمله |
|--------|---------|
| `source ~/.nvm/nvm.sh && nvm use 20` | Node 20 را برای این ترمینال فعال می‌کند |
| `git pull origin main` | آخرین کد GitHub را داخل `~/ModuleHub-cms` می‌آورد |
| `bash scripts/deploy-full.sh` | **توصیه‌شده** — کل زنجیره deploy با WAN fallback و sudo broker |
| `bash scripts/run-with-free-wan.sh ...` | موقت اینترنت آزاد (`enp63s0`) برای git/npm؛ بعد برمی‌گرداند |
| `bash scripts/install-to-opt.sh` | rsync از home به `/opt` — **`.env` سرور پاک نمی‌شود** |
| `bash scripts/deploy-on-server.sh --skip-pull` | در `/opt`: نصب پکیج → `tsc` build → حذف devDeps → restart سرویس |
| `--skip-pull` | یعنی pull را همین الان زدی؛ دوباره pull نزن |
| `curl .../health` | اگر `{"status":"ok"}` → برنامه زنده است |

**اجرا:** همیشه `bash scripts/....sh` — نه `./script.sh` (ممکن است از ویندوز CRLF داشته باشد).

---

## ۴. ادمین موقت (تا فاز ۸ — login واقعی)

بدون این، پیام می‌گیری: `Super Admin session required` و کارت **+** / **Start** کار نمی‌کند.

### یک‌بار (یا بعد از deploy عجیب)

```bash
# با sudo broker (پسورد یک‌بار در ترمینال broker):
python3 ~/ModuleHub-cms/scripts/run_via_broker.py \
  'bash /home/ash/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'
```

یا دستی: در `/opt/modulehub-cms/.env` خط `MODULEHUB_DEV_SUPER_ADMIN=1` + restart:

```bash
python3 ~/ModuleHub-cms/scripts/run_via_broker.py 'systemctl restart modulehub-cms'
```

### چک

```bash
curl -s http://127.0.0.1:4000/api/auth/status
# باید: "isSuperAdmin":true
```

**روی سایت:** کارت **+** · ⚙ با **Start/Stop** · کلیک کارت → `/modules/<id>/` (بعد از Start)

> فاز ۸: این حالت dev را در production حذف کن و login واقعی بگذار.

---

## ۵. چرا روی سرور اغلب باید تغییرات Git را دور بریزی؟

گاهی روی `~/ModuleHub-cms` فایلی **دستی** عوض شده (تست، SCP، ویرایش اشتباه). آنوقت `git pull` می‌گوید: *Would be overwritten*.

**ساده‌ترین راه:** `bash scripts/deploy-full.sh` — بعد از fetch خودش می‌پرسد و `reset --hard` + `clean -fd` می‌زند.

**روتین دستی (دادهٔ سایت از بین نمی‌رود):**

| محل | با `reset --hard` پاک می‌شود؟ |
|-----|------------------------------|
| `~/ModuleHub-cms` (clone) | بله — فقط کد clone |
| `/opt/modulehub-cms/.env` | خیر — جداست + در rsync exclude |
| `/opt/.../storage/` · `standalone-modules/` | خیر — در rsync exclude |

```bash
source ~/.nvm/nvm.sh && nvm use 20
export MODULEHUB_SKIP_WAN=1

cd ~/ModuleHub-cms
git fetch origin
git reset --hard origin/main    # فقط clone home — نه opt و نه .env
git clean -fd                 # untracked که با pull تداخل داشت (مثلاً بعد از SCP)

bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull

# اگر ادمین قطع شد:
python3 ~/ModuleHub-cms/scripts/run_via_broker.py \
  'bash /home/ash/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'

curl -sf http://127.0.0.1:4000/health
curl -s http://127.0.0.1:4000/api/auth/status
```

**`git stash`** — اگر چیز محلی را نگه می‌داری: `git stash -u` → pull → `git stash pop` (ممکن است conflict بدهد).

---

## ۶. dual-WAN (خلاصه)

| کارت | کار |
|------|-----|
| `ens4` | پیش‌فرض؛ ترافیک عادی سایت |
| `enp63s0` | موقت برای `git pull` / `npm install` |

اگر `run-with-free-wan` crash کرد (`ip route add`): همان deploy را با `MODULEHUB_SKIP_WAN=1` بزن (§۵).

---

## ۷. روی سرور دست نزن (با git جایگزین نمی‌شوند)

- `/opt/modulehub-cms/.env` — رمز و `MODULEHUB_DEV_SUPER_ADMIN`
- `storage/site-layout.json` — لیست ماژول‌ها و کارت‌ها
- `storage/system-settings.json`
- `standalone-modules/` — فایل‌های ZIP شده
- `thumbnails/`

ویرایش **اسکریپت** فقط روی PC → push → deploy.

---

## ۸. نصب اولیه (یک‌بار)

```bash
source ~/.nvm/nvm.sh && nvm use 20
git clone https://github.com/alishafiee1/ModuleHub-cms.git ~/ModuleHub-cms
cd ~/ModuleHub-cms
cp .env.example .env && nano .env

bash scripts/setup-server-dirs.sh
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/install-systemd.sh
bash scripts/deploy-on-server.sh --skip-pull

python3 ~/ModuleHub-cms/scripts/run_via_broker.py \
  'bash /home/ash/ModuleHub-cms/scripts/enable-dev-admin-on-server.sh'
```

---

## ۹. دستورهای جایگزین

| به‌جای | استفاده کن وقتی |
|--------|------------------|
| `git pull` + deploy کامل | فقط یک فایل را با `scp` بردی → حتماً `install-to-opt` + restart |
| `deploy-on-server.sh` | `--skip-build` اگر فقط `public/` عوض شده |
| `deploy-on-server.sh` | `--skip-pull` همیشه وقتی تازه pull زدی |
| `MODULEHUB_SKIP_WAN=1` | toggler شبکه خراب شد |
| `enable-dev-admin-on-server.sh` | بعد از deploy ادمین / Start کار نکرد |
| `npm run dev` | **فقط PC** — روی سرور ممنوع |
| `ssh -t ash@...` | وقتی `sudo` می‌خواهد پسورد و broker نیست |

**SCP سریع (مثال):**

```powershell
scp public/script.js ash@192.168.88.50:~/ModuleHub-cms/public/
```

```bash
bash ~/ModuleHub-cms/scripts/install-to-opt.sh
python3 ~/ModuleHub-cms/scripts/run_via_broker.py 'systemctl restart modulehub-cms'
```

---

## ۱۰. دیباگ — علامت → کار

| علامت | کار |
|--------|-----|
| `Super Admin session required` | §۴ — `enable-dev-admin-on-server.sh` |
| `isSuperAdmin:false` در `/api/auth/status` | همان §۴ + restart |
| فقط دکمه «بستن»، بدون Start | `script.js` قدیمی → install-to-opt + hard refresh |
| `git pull` overwrite | §۵ — `reset --hard origin/main` روی **home** |
| `ip route add` / toggler | `export MODULEHUB_SKIP_WAN=1` + §۵ |
| `tsc: not found` | deploy قدیمی — `deploy-on-server.sh` جدید (اول `npm ci` کامل) |
| `npm: command not found` | `source ~/.nvm/nvm.sh && nvm use 20` |
| `Cannot find module 'express'` | `cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull` |
| `pipefail: invalid option` | `sed -i 's/\r$//' ~/ModuleHub-cms/scripts/*.sh` |
| `sudo: terminal required` | `ssh -t` یا sudo broker |
| health OK ولی سایت قدیمی | Ctrl+Shift+R · کش Nginx/CDN |
| ماژول باز نمی‌شود | اول ⚙ **Start** · بعد کلیک کارت |
| `$env:VAR` در SSH | اشتباه — روی Ubuntu: `export VAR=1` |

**لاگ‌ها:**

```bash
journalctl -u modulehub-cms -n 50 --no-pager
sudo systemctl status modulehub-cms --no-pager
```

---

## ۱۱. ارجاع

| موضوع | فایل |
|--------|------|
| اسکریپت‌ها | [`server-scripts.md`](server-scripts.md) |
| AI کوتاه | [`deploy-notes-for-ai.md`](deploy-notes-for-ai.md) |
| خطاهای تکراری | [`AI-common-mistakes/`](AI-common-mistakes/readme.md) |
| سازنده ماژول | [`developer-guide.md`](developer-guide.md) |

