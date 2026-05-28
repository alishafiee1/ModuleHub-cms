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


# اسکریپت‌های سرور — یه راهنمای ساده

این داکیومنت فقط می‌گه هر اسکریپت **کی** و **برای چی** اجرا می‌شه.  
اگه می‌خوای کل فرایند روزانه (git pull، تست، …) رو ببینی → [`dev-workflow.md`](dev-workflow.md)

سرور ما: `ash@192.168.88.50` — جایی که قراره CMS بیاد بالا.

---

## اول کد رو کجا بذاریم؟

**جای درست و استاندارد:**

```text
/opt/modulehub-cms
```

یعنی همون جایی که معمولاً برنامه‌های سروری می‌نشینن. کد، `npm build`، فایل `.env` و اجرای سرویس همه اینجاست.

**اگه فعلاً توی home کپی کردی (`~/ModuleHub-cms`)؟**

اشکالی نداره — برای شروع و تست خوبه. اسکریپت‌های جدید خودشون می‌فهمن کجایی؛ وقتی حوصله کردی با `install-to-opt.sh` می‌بریشون توی `/opt`.

**چیزایی که توی git نیستن ولی سرور لازمشون داره:**

| کجا | برای چی |
|-----|---------|
| `storage/`، `standalone-modules/`، `thumbnails/` | داخل خود پروژه — داده و ماژول‌ها |
| `/var/log/modulehub/modules/` | لاگ هر ماژول جدا |
| `/var/cache/modulehub/pkg/` | کش npm و بقیه — که هر بار از اول دانلود نکنی |

---

## یه نگاه سریع به اسکریپت‌ها

| اسکریپت | یک جمله |
|---------|---------|
| `setup-server-dirs.sh` | پوشه‌های `/var/...` رو یک‌بار می‌سازه |
| `install-systemd.sh` | CMS رو سرویس systemd می‌کنه که با روشن شدن سرور بالا بیاد |
| `deploy-on-server.sh` | بعد از هر آپدیت کد: pull، build، restart، چک سلامت |
| `install-to-opt.sh` | home → `/opt` + **`npm ci` در opt** |
| `run-with-free-wan.sh` | هر دستور (git/npm) را موقت از `enp63s0` می‌فرستد و برمی‌گرداند |
| `network-metric-toggler.py` | موتور پایین — معمولاً مستقیم صدا نزن |

---

## `setup-server-dirs.sh` — یک‌بار بزن، تمام

قبل از هر چیز، سرور باید بدونه لاگ و کش ماژول‌ها کجا بره. این اسکریپت همون پوشه‌ها رو زیر `/var` درست می‌کنه.

```bash
bash scripts/setup-server-dirs.sh
```

`sudo` می‌خواد — عادیه، چون داره زیر `/var` می‌سازه.

---

## `install-systemd.sh` — CMS همیشه روشن بمونه

این یکی سرویس systemd رو نصب می‌کنه. مهم: **قبلش** حتماً `npm run build` زده باشی و `.env` رو پر کرده باشی.

خوبیش اینه که اگه توی home نصب کردی، خودش مسیر درست رو توی فایل سرویس می‌نویسه — لازم نیست دستی `/opt` رو جا بندازی.

```bash
cd ~/ModuleHub-cms    # یا /opt/modulehub-cms
npm ci && npm run build
cp .env.example .env   # SESSION_SECRET و hash رمز رو پر کن
bash scripts/install-systemd.sh
```

بعدش با `systemctl status modulehub-cms` می‌تونی ببینی زنده‌ست یا نه.

---

## `deploy-on-server.sh` — هر بار کد عوض شد

این همونیه که هر بار `git pull` می‌زنی باید بیاد:

```bash
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh
```

کارش: pull → نصب پکیج → build → restart → یه `curl` به `/health` که مطمئن بشی بالا اومده.

اگه فقط restart می‌خوای: `--skip-pull` و `--skip-build` هم داره — توی help اسکریپت هست.

---

## `install-to-opt.sh` — وقتی از home می‌خوای بری opt

اول توی home کار کردی؟ این اسکریپت sync می‌کنه به `/opt` و **خودش `npm ci --omit=dev` در opt** می‌زنه (`node_modules` عمداً کپی نمی‌شود).

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms
git pull
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/install-systemd.sh   # ترمینال با sudo
```

---

## `run-with-free-wan.sh` — git و npm از اینترنت آزاد

روی `ens4` گیت‌هاب و npm registry گیر می‌کند. این wrapper موقت route را از **`enp63s0`** می‌گذارد و **بعد از تمام دستور** برمی‌گرداند.

```bash
cd ~/ModuleHub-cms
bash scripts/run-with-free-wan.sh git pull origin main
bash scripts/run-with-free-wan.sh npm ci
```

NIC پیش‌فرض: `enp63s0` — یا `storage/system-settings.json` → `packageInstallInterface`

`deploy-on-server.sh` و `install-to-opt.sh` خودکار از همین wrapper استفاده می‌کنند.

---

## `network-metric-toggler.py` — برای dual-WAN (پایین‌لایه)

روی سرورت دو تا کارت شبکه داری (`ens4` فیلتر، `enp63s0` آزاد). وقتی ماژولی `npm install` می‌خواد، این اسکریپت موقتاً ترافیک رو از کارت آزاد رد می‌کنه و بعد برمی‌گردونه به حالت قبل.

```bash
python3 scripts/network-metric-toggler.py --interface enp63s0 --command "npm install"
```

فعلاً فاز اول CMS بهش نیاز نداره — بعداً با ماژول‌ها کار می‌کنیم.

---

## از صفر تا بالا اومدن — همین ترتیب

```
۱) clone در ~/ModuleHub-cms + .env
۲) nvm use 20 + npm ci && npm run build (در home)
۳) bash scripts/setup-server-dirs.sh   (sudo)
۴) bash scripts/install-to-opt.sh    (opt + npm ci)
۵) bash scripts/install-systemd.sh   (sudo)
۶) curl http://127.0.0.1:4000/health
```

بعد از هر push: `git pull` در home → `install-to-opt` → `deploy-on-server.sh` در opt.

---

## خطای `set: pipefail: invalid option` یا `install-to-opt.sh: invalid option`

یعنی فایل `.sh` با **خط پایان ویندوزی (CRLF)** روی سرور رفته. روی Ubuntu:

```bash
sudo apt install -y dos2unix
dos2unix scripts/*.sh
bash scripts/install-to-opt.sh
```

یا بعد از `git pull` جدید (اسکریپت‌ها با LF در git) دوباره sync کن.

---

## `./script.sh` گفت Permission denied؟

یعنی فایل اجازه اجرا نداره — با git clone زیاد پیش میاد.

```bash
chmod +x scripts/*.sh
```

یا ساده‌تر: همیشه با `bash` بزن:

```bash
bash scripts/setup-server-dirs.sh
```

---

## چند فایل دیگه که گاهی لازم می‌شن

| فایل | چیه |
|------|-----|
| `scripts/test-package-cache-manual.sh` | smoke فاز ۴ — دو upload با fixture ZIP |
| `scripts/build-phase4-test-zip.sh` | ساخت ZIP تست از `tests/fixtures/modules/phase4-cache-test/` |
| `scripts/verify-phase4-cache.sh` | بررسی symlink، left-pad، diagnostics HTTP |
| `config/systemd/modulehub-cms.service` | نمونه با مسیر `/opt` — ولی unit واقعی رو `install-systemd.sh` می‌سازه |
| `config/nginx/modulehub-cms.conf.example` | وقتی بخوای از بیرون با `haderbash.ir` بیای تو CMS |
| `.env.example` | الگوی `SESSION_SECRET` و `ADMIN_PASSWORD_HASH` |

سوالی موند؟ اول [`dev-workflow.md`](dev-workflow.md) رو ببین، بعد توی ترمینال سرور همون دستورهای بالا رو بزن.

