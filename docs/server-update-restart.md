<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol {
  font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important;
  direction: rtl;
  text-align: right;
}
pre, code { direction: ltr; text-align: left; }
table { direction: rtl; text-align: right; width: 100%; border-collapse: collapse; }
thead th, tbody td { text-align: right; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; text-align: left; display: inline-block; }
</style>

<div dir="rtl" style="text-align:right;">

# راه‌اندازی مجدد سرور بعد از به‌روزرسانی کد

راهنمای ساده برای وقتی کد جدید را روی Ubuntu کپی کردید و می‌خواهید سایت نسخهٔ تازه را نشان دهد.

---

## قبل از شروع — دو پوشه مهم

| پوشه | نقش |
|------|-----|
| `~/ModuleHub-cms` | جایی که معمولاً کد را کپی یا git pull می‌کنید (کارگاه) |
| `/opt/modulehub-cms` | جایی که **systemd واقعاً از آن اجرا می‌کند** (ویترین) |

> فقط کپی کردن فایل‌ها کافی نیست — باید **build** و **restart** هم انجام شود.

---

## گام ۱ — اتصال به سرور

```bash
ssh ash@192.168.88.50
```

---

## گام ۲ — رفتن به پوشه پروژه

```bash
cd ~/ModuleHub-cms
```

---

## گام ۳ — نصب وابستگی‌ها

اگر `node_modules` ندارید یا پاک شده:

```bash
npm ci
```

> `npm ci` = نصب دقیق پکیج‌ها طبق `package-lock.json`

---

## گام ۴ — ساخت نسخه اجرایی (build)

```bash
npm run build
```

> TypeScript → JavaScript در پوشه `dist/`

اگر خطا داد، build را متوقف کنید و خطا را رفع کنید.

---

## گام ۵ — انتقال به مسیر production

```bash
rsync -a --exclude node_modules ~/ModuleHub-cms/ /opt/modulehub-cms/
```

---

## گام ۶ — build دوباره در `/opt`

```bash
cd /opt/modulehub-cms
npm ci
npm run build
```

---

## وقتی به **اینترنت آزاد** نیاز دارید

سرور دو کارت شبکه دارد؛ **metric پایین‌تر = مسیر پیش‌فرض**.  
اگر Docker به `docker.io` نرسد (`connection refused`)، اول metric را موقت عوض کنید.

| رابط | IP نمونه | نقش معمول |
|------|----------|-----------|
| `ens4` | `192.168.10.100` | شبکهٔ داخلی (metric بالاتر) |
| `enp63s0` | `192.168.88.50` | اینترنت آزادتر |

### روش A — Python (`NetworkMetricToggler` در `~/3x-ui`)

```bash
cd ~/3x-ui
python3 << 'PY'
import sys
sys.path.insert(0, "server_diagnostics")
from core.network_metric_toggler import NetworkMetricToggler

FREE_IFACE = "enp63s0"  # روی سرور شما — با ip route show default چک کنید
toggler = NetworkMetricToggler(FREE_IFACE)
if not toggler.set_free_internet_primary():
    raise SystemExit(1)
print("اینترنت آزاد فعال. docker pull / apt را بزنید.")
input("Enter = برگرداندن metric...")
toggler.restore_default_metrics()
PY
```

> بعد از کار حتماً **restore** — وگرنه ترافیک همان مسیر می‌ماند.

### روش B — دستی (`ip route` موقت)

```bash
sudo ip route add default via 192.168.88.1 dev enp63s0 metric 50
curl -I https://auth.docker.io
docker pull node:20-alpine
sudo ip route del default via 192.168.88.1 dev enp63s0 metric 50
```

### روش C — CLI تعاملی (پایدار / netplan)

```bash
cd ~/3x-ui/api
python3 network_metrics_cli.py
```

### با sudo broker

```bash
python3 ~/3x-ui/run_via_broker.py 'ip route add default via 192.168.88.1 dev enp63s0 metric 50'
# docker pull ...
python3 ~/3x-ui/run_via_broker.py 'ip route del default via 192.168.88.1 dev enp63s0 metric 50'
```

### چه کارهایی اینترنت می‌خواهند؟

| کار | اینترنت آزاد |
|-----|--------------|
| `docker pull` / `compose up --build` | **بله** |
| `git pull` (repo خارجی) | **بله** |
| `npm ci` (پکیج جدید) | گاهی |
| `npm run build` / restart CMS | خیر |
| آپلود ZIP | خیر (ولی **Start** بعدش Docker می‌خواهد) |

---

## گام ۷ — ری‌استارت سرویس

**روش A — با sudo broker (سرور شما):**

```bash
python3 ~/3x-ui/run_via_broker.py 'systemctl restart modulehub-cms'
```

**روش B — مستقیم (اگر sudo دارید):**

```bash
sudo systemctl restart modulehub-cms
```

---

## گام ۸ — بررسی که سرویس بالا آمده

```bash
systemctl is-active modulehub-cms
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:4000/
```

باید ببینید: `active` و `HTTP 200`

---

## گام ۹ — در مرورگر

1. باز کنید: `http://192.168.88.50:4000/`
2. **Ctrl+F5** (hard refresh — کش مرورگر را دور می‌زند)
3. برای دیدن UI admin: اول `/admin` → login → برگردید `/`

---

## اسکریپت یک‌جا (کپی-پیست)

```bash
cd ~/ModuleHub-cms
npm ci
npm run build
rsync -a --exclude node_modules ~/ModuleHub-cms/ /opt/modulehub-cms/
cd /opt/modulehub-cms && npm ci && npm run build
python3 ~/3x-ui/run_via_broker.py 'systemctl restart modulehub-cms'
systemctl is-active modulehub-cms
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:4000/
```

---

## اگر تغییر UI نمی‌بینید

| علت | راه‌حل |
|-----|--------|
| login admin نکردید | `/admin` → login |
| کش مرورگر | Ctrl+F5 |
| دکمه ⚙ فقط روی **standalone** | مثلاً `demo-api` — نه builtin |
| کارت **+** فقط برای admin | بعد از login |
| سرویس restart نشده | گام ۷ را دوباره بزنید |

---

## فایل‌هایی که معمولاً **نباید** overwrite شوند

| فایل | چرا |
|------|-----|
| `/opt/modulehub-cms/.env` | رمز admin و مسیرهای production |
| `~/.local/share/modulehub/modules.json` | لیست ماژول‌های نصب‌شده روی سرور |
| `standalone-modules/*` | محتوای واقعی instanceها |

`rsync` بالا `.env` را overwrite می‌کند اگر در home هم `.env` دارید — مراقب باشید.

---

## لاگ — مشاهده و پاک‌سازی

### دیدن لاگ

```bash
# ۵۰ خط آخر
journalctl -u modulehub-cms -n 50 --no-pager

# دنبال کردن زنده
journalctl -u modulehub-cms -f

# فقط خطاها (امروز)
journalctl -u modulehub-cms -p err --since today
```

### پاک‌کردن / کوچک‌کردن لاگ‌های قدیمی

لاگ‌ها در **journald** ذخیره می‌شوند — سرویس را stop نمی‌کنند.

```bash
# نگه‌داشتن فقط ۷ روز اخیر (پیشنهادی)
sudo journalctl --vacuum-time=7d

# یا محدود کردن حجم کل (مثلاً 200MB)
sudo journalctl --vacuum-size=200M

# چرخش فایل لاگ (بدون حذف همه)
sudo journalctl --rotate
```

> **توجه:** `--vacuum` روی **همهٔ سرویس‌های systemd** اثر دارد، نه فقط modulehub-cms.  
> حذف انتخابی فقط یک unit در journald استاندارد نیست.

### بعد از پاک‌سازی — چک

```bash
journalctl -u modulehub-cms -n 5 --no-pager
systemctl status modulehub-cms
```

---

## خطای رایج: `manifest.json not found` (آپلود ZIP)

ZIP باید **`manifest.json` در ریشه** archive باشد، نه داخل یک پوشه.

```bash
unzip -l thankio.zip | head -20
# درست:  manifest.json
# غلط:  thankio/manifest.json  (بدون flatten)
```

---

## مراجع

- [ubuntu-deployment.md](ubuntu-deployment.md) — نصب اولیه
- [.env.example](../.env.example) — متغیرهای محیطی
- `~/3x-ui/server_diagnostics/core/network_metric_toggler.py` — عوض‌کردن موقت metric

</div>
