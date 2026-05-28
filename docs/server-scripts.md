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
| `install-to-opt.sh` | از home می‌برتت به `/opt` |
| `network-metric-toggler.py` | برای دو تا کارت شبکه — موقع npm install از اینترنت آزاد استفاده می‌کنه (بعداً) |

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

اول توی home کار کردی و حالا می‌خوای جای استاندارد؟ این اسکریپت sync می‌کنه به `/opt/modulehub-cms` (بدون `node_modules` و شلوغی اضافه).

```bash
cd ~/ModuleHub-cms
dos2unix scripts/*.sh    # اگر خطای pipefail دیدی
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
npm ci && npm run build   # بدون lock: npm install && npm run build
bash scripts/install-systemd.sh
```

---

## `network-metric-toggler.py` — برای dual-WAN

روی سرورت دو تا کارت شبکه داری (`ens4` فیلتر، `enp63s0` آزاد). وقتی ماژولی `npm install` می‌خواد، این اسکریپت موقتاً ترافیک رو از کارت آزاد رد می‌کنه و بعد برمی‌گردونه به حالت قبل.

```bash
python3 scripts/network-metric-toggler.py --interface enp63s0 --command "npm install"
```

فعلاً فاز اول CMS بهش نیاز نداره — بعداً با ماژول‌ها کار می‌کنیم.

---

## از صفر تا بالا اومدن — همین ترتیب

```
۱) کد بره /opt/modulehub-cms  (یا فعلاً ~/ModuleHub-cms)
۲) .env رو درست پر کن
۳) bash scripts/setup-server-dirs.sh
۴) npm ci && npm run build
۵) bash scripts/install-systemd.sh
۶) curl http://127.0.0.1:4000/health   → باید {"status":"ok"} بده
```

همین. بعد از این هر بار کد عوض شد → `deploy-on-server.sh`.

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
| `config/systemd/modulehub-cms.service` | نمونه با مسیر `/opt` — ولی unit واقعی رو `install-systemd.sh` می‌سازه |
| `config/nginx/modulehub-cms.conf.example` | وقتی بخوای از بیرون با `haderbash.ir` بیای تو CMS |
| `.env.example` | الگوی `SESSION_SECRET` و `ADMIN_PASSWORD_HASH` |

سوالی موند؟ اول [`dev-workflow.md`](dev-workflow.md) رو ببین، بعد توی ترمینال سرور همون دستورهای بالا رو بزن.

