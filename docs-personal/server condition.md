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
  margin-inline-start: 0;
  margin-inline-end: auto;
}
thead th, tbody td {
  text-align: right;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
table td code, table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: left;
  display: inline-block;
}
</style>

<div dir="rtl" style="text-align:right;">

# وضعیت سرور — `ash@192.168.88.50`

> **آخرین بررسی:** ۱۴۰۵/۰۳/۱۱ — از SSH و تست زنده روی سرور (`hostname: ubu`)

---

## ۱. سخت‌افزار

| مورد | مقدار |
|------|--------|
| **CPU** | AMD Phenom II X4 B97 — ۴ هسته، حداکثر ۳.۲ GHz |
| **RAM** | ۶.۸ GB (مصرف ~۱.۴ GB، available ~۵.۳ GB) |
| **Swap** | ۴ GB (استفاده نشده) |
| **دیسک** | ~۲۳۳ GB فیزیکی → LVM ۱۰۰ GB روی `/` — **~۲۲ GB مصرف / ~۷۲ GB آزاد (~۲۴٪)** |
| **Boot** | `/boot` روی ۲ GB جدا |
| **Load average** | ~۰.۲۵–۰.۵ (سبک) |
| **Uptime نمونه** | ~۱ روز و ۱۸ ساعت |

---

## ۲. سیستم‌عامل و زمان

| مورد | مقدار |
|------|--------|
| **OS** | Ubuntu 26.04 LTS — kernel `7.0.0-15-generic` (x86_64) |
| **Timezone** | UTC — ساعت همگام (`chrony` فعال) |
| **Node.js** | v22.22.1 (`/usr/bin/node` — production CMS و shell) |
| **Docker** | 29.5.0 |
| **Nginx** | 1.28.3 |

---

## ۳. شبکه — Dual-WAN

سرور **دو کارت شبکه فیزیکی** دارد. مسیر پیش‌فرض با **metric پایین‌تر** انتخاب می‌شود.

| رابط | IP | Gateway | Metric | نقش |
|------|-----|---------|--------|-----|
| **`ens4`** | `192.168.10.100/24` | `192.168.10.1` | **100** (اول) | ADSL / اینترنت **فیلترشده** — ورود کاربران LAN |
| **`enp63s0`** | `192.168.88.50/24` | `192.168.88.1` | **200** (دوم) | اینترنت **آزادتر** — خروجی Xray و `docker pull` |

```
مسیر پیش‌فرض سرور (خود Ubuntu):
  ens4 (192.168.10.100) metric 100  ←  ترافیک سیستم‌عامل از ADSL

خروجی کاربران Xray (sendThrough):
  enp63s0 (192.168.88.50)           ←  ترافیک پروکسی از اینترنت آزاد
```

### مسیرهای اضافی DHCP (metric 1024)

`ip route show default` ممکن است **۴ خط** نشان دهد — دو تا metric 100/200 (فعال) و دو تا metric **1024** (پشتیبان DHCP).

> **رابطه با مشکل Outbound:** این مسیرهای 1024 **همان تنظیم موقت `ip route add … metric 50` نیستند**. metric 1024 اولویت پایین دارد و معمولاً استفاده نمی‌شود. مشکل خروجی فیلترشدهٔ Xray با **`sendThrough: 192.168.88.50`** حل شد (ترافیک کاربر از `enp63s0` خارج می‌شود بدون عوض کردن default route سیستم). برای `docker pull` و apt هنوز باید موقتاً metric 50 اضافه کنی (§۹).

### DNS (`/etc/resolv.conf`) — سیستم‌عامل

```
192.168.10.1      ← مودم/ISP (سریع، محلی)
178.22.122.100    ← شکن DNS (Docker/GitHub/npm)
8.8.8.8           ← پشتیبان
```

### DNS داخل Xray (`config.json`) — جدا از سیستم

Xray برای resolve دامنه‌های کاربران از DNS **داخلی خودش** استفاده می‌کند (`8.8.8.8` و `1.1.1.1`). این با `/etc/resolv.conf` فرق دارد.

| محل | 1.1.1.1 | توضیح |
|-----|---------|--------|
| **سیستم** (`resolv.conf`) | ❌ نگذار | در ایران اغلب timeout — برای apt/docker/npm |
| **Xray** (`config.json`) | ⚠️ الان هست | فقط برای DNS داخل تونل VPN؛ اگر کندی دیدی به `178.22.122.100` عوض کن |

---

## ۴. فیلتر بودن اینترنت — نتایج متغیر

فیلترینگ ISP **ثابت نیست** — هر روز ممکن است فرق کند. به‌جای جدول ثابت، با دستور زیر تست کن:

```bash
curl -s --interface ens4 --max-time 6 -o /dev/null -w "ens4: %{http_code}\n" https://github.com
curl -s --interface enp63s0 --max-time 6 -o /dev/null -w "enp63s0: %{http_code}\n" https://github.com
```

**اصل کلی (پایدار):**
- مسیر پیش‌فرض سرور روی `ens4` (ADSL فیلتر) است.
- `docker pull`، `git pull` خارجی و npm بدون تعویض metric معمولاً **شکست می‌خورند**.
- Xray با `sendThrough` از `enp63s0` خارج می‌شود — مستقل از default route سیستم.

---

## ۵. Xray / 3x-ui — انتقال ترافیک

### `config.json` چیست؟

فایل **`/app/bin/config.json`** داخل کانتینر 3x-ui تنظیمات اصلی **Xray-core** است. پنل 3x-ui این فایل را می‌سازد/بازنویسی می‌کند. بخش‌های مهم:

| بخش | کار |
|-----|-----|
| **inbounds** | ورودی‌ها — مثلاً VLESS روی 443 با Reality |
| **outbounds** | خروجی‌ها — `freedom` (مستقیم)، chain، blackhole |
| **routing** | قوانین مسیریابی — کدام inbound به کدام outbound برود |
| **dns** | DNS داخلی Xray (جدا از Ubuntu) |

### Flow (`xtls-rprx-vision`) — چرا در فایل نیست؟

**Flow** فقط برای حالت **XTLS/Vision** لازم است. کانفیگ فعلی **VLESS + Reality روی TCP** است و فیلد flow **خالی** است — این طبیعی و درست است. اگر در doc یا کلاینت `xtls-rprx-vision` بزنی ولی سرور flow نداشته باشد، اتصال قطع می‌شود.

### بلاک `geoip:private` و BitTorrent — چیست؟

| قانون | معنی ساده | چرا؟ |
|-------|-----------|------|
| **BitTorrent** | پروتکل دانلود تورنت | مصرف پهنای باند، گزارش abuse از ISP، ریسک قانونی |
| **geoip:private** | IPهای **شبکهٔ خصوصی** — `10.x.x.x`، `192.168.x.x`، `172.16–31.x.x`، localhost | جلوگیری از اینکه کاربر VPN از **اینترنت** وارد **شبکهٔ داخلی تو** (مودم، سرور، پرینتر LAN) شود — مثل تونل معکوس به خانهٔ خودت |

> **وضعیت فعلی:** outbound `blocked` (blackhole) در config هست ولی **routing rule فعال برای این بلاک‌ها نیست** — همهٔ inbound-443 مستقیم به outbound `star` می‌رود. اگر بخواهی فعال شود، در پنل 3x-ui routing اضافه کن.

### معماری

```
کاربر (LAN / اینترنت)
    │
    ▼ :443  VLESS + Reality  (SNI: www.haderbash.ir)
    │
┌───┴───────────────────────────────────────┐
│  xray (کانتینر 3x-ui — network_mode: host) │
│  inbound-443  →  outbound star (freedom)   │
│  sendThrough: 192.168.88.50  ◄── کلیدی     │
└───┬───────────────────────────────────────┘
    │
    ├─ Reality target → 127.0.0.1:8443 (nginx decoy)
    └─ ترافیک کاربر → خروج از enp63s0 (اینترنت آزاد)

nginx :8443 (localhost SSL) → proxy → ModuleHub :4000
nginx :80  → redirect HTTPS (haderbash.ir)
```

### تنظیمات فعال Xray (از `config.json`)

| پارامتر | مقدار |
|---------|--------|
| **Inbound** | VLESS — پورت **443** — Reality |
| **Flow** | خالی (بدون vision — Reality TCP) |
| **Server Name (SNI)** | **`www.haderbash.ir`** |
| **Reality target** | `127.0.0.1:8443` (سایت نقاب nginx) |
| **Outbound اصلی** | تگ **`star`** — `freedom` + **`sendThrough: 192.168.88.50`** |
| **Outbound دوم (اضافی)** | تگ **`khodam`** — VLESS به `pv.callmesallad.store:80` (chain/پشتیبان — در routing فعال نیست مگر rule اضافه شود) |
| **Inbound DB** | **`main-443`** — فعال |

> بدون `sendThrough` روی `192.168.88.50`، ترافیک کاربران از gateway پیش‌فرض (`192.168.10.1`) خارج می‌شود و **فیلتر می‌مانند**.

### پنل 3x-ui

| مورد | مقدار |
|------|--------|
| **کانتینر** | `3x-ui` — `ghcr.io/mhsanaei/3x-ui:latest` — Up |
| **شبکه** | `host` (دسترسی مستقیم به هر دو NIC) |
| **DB** | `/home/ash/3x-ui/db/x-ui.db` |
| **SSL decoy** | `/home/ash/3x-ui/cert/` (Let's Encrypt via DNS-01) |
| **پورت پنل** | **10100** (فقط LAN — UFW) |
| **مسیر پنل** | `/panel/3x/` |

---

## ۶. سرویس‌های نصب‌شده و فعال

### systemd (مهم)

| سرویس | وضعیت | نقش |
|--------|--------|-----|
| `nginx` | ✅ active | reverse proxy + decoy `haderbash.ir` |
| `modulehub-cms` | ✅ active | CMS — `/opt/modulehub-cms` — Node v22 |
| `docker` | ✅ active | کانتینرها |
| `fail2ban` | ✅ active | محافظت brute-force |
| `ssh` | ✅ active | پورت 22 |
| `chrony` | ✅ active | NTP |

### Docker containers

| نام | تصویر | پورت |
|-----|--------|------|
| `3x-ui` | `ghcr.io/mhsanaei/3x-ui:latest` | host network — 443, 10100, … |

### RustDesk (ریموت دسکتاپ)

| مورد | مقدار |
|------|--------|
| **نرم‌افزار** | `rustdesk` 1.4.6 — مستقل از XRDP |
| **پورت** | **21118** (direct) — UFW باز |
| **نکته** | XRDP (`xrdp` / پورت 3389) **حذف شد** — با RustDesk ارتباطی نداشت |

### پورت‌های در حال گوش دادن (خلاصه)

| پورت | bind | سرویس |
|------|------|--------|
| 22 | همه | SSH |
| 80 | همه | nginx (redirect) |
| 443 | همه | xray Reality |
| 4000 | **127.0.0.1** | ModuleHub CMS (فقط localhost) |
| 8443 | localhost | nginx SSL decoy |
| 10100 | همه | پنل 3x-ui |
| 10101 | همه | xray/subscription |
| 21118 | همه | RustDesk |
| 62789, 11111 | localhost | xray API / metrics |

> **CMS پورت 4000:** `MODULEHUB_HOST=127.0.0.1` در `/opt/modulehub-cms/.env` — دسترسی وب فقط از **nginx** (`haderbash.ir`). UFW قبلاً 4000 را به LAN محدود کرده بود؛ bind به localhost امن‌تر است.

---

## ۷. ModuleHub CMS

| مورد | مقدار |
|------|--------|
| **Production** | `/opt/modulehub-cms` |
| **کارگاه** | `~/ModuleHub-cms` |
| **systemd** | `modulehub-cms.service` — user `ash` |
| **پورت هسته** | 4000 — bind **`127.0.0.1`** |
| **nginx** | `haderbash.ir` → `127.0.0.1:4000` — `/admin` و `/api` فقط `192.168.0.0/16` + localhost |
| **تنظیمات سراسری** | `/opt/modulehub-cms/storage/system-settings.json` — پنل `/admin/settings` |
| **کش پکیج** | `/var/cache/modulehub/pkg/<hash>/` |
| **لاگ ماژول‌ها** | `/var/log/modulehub/modules/<module-id>.log` |
| **پورت خودکار ماژول** | ۴۱۰۰–۴۹۹۹ (اگر ادمین پورت داخلی را خالی بگذارد) |
| **وضعیت ماژول** | `running` \| `stopped` \| `crashed` |
| **رابط شبکه نصب پکیج** | پیش‌فرض `enp63s0` — موقت via `ip route` یا `network_metrics_cli` |

---

## ۸. ریسک‌ها و نکات عملیاتی

| ریسک | توضیح |
|------|--------|
| metric اشتباه | اگر `ens4` موقتاً metric پایین بماند، docker از ADSL خارج می‌شود |
| ساعت UTC | Reality به sync زمان حساس است — `chrony` باید فعال بماند |
| DNS 1.1.1.1 در **سیستم** | در `resolv.conf` نگذار — timeout در ایران |
| DNS 1.1.1.1 در **Xray** | جداست؛ در صورت کندی داخل VPN عوض کن |

---

## ۹. وقتی به **اینترنت آزاد** نیاز دارید

سرور دو کارت شبکه دارد؛ **metric پایین‌تر = مسیر پیش‌فرض**.  
اگر Docker به `docker.io` نرسد، اول metric را **موقت** عوض کن.

| رابط | IP نمونه | نقش معمول |
|------|----------|-----------|
| `ens4` | `192.168.10.100` | ADSL فیلتر (metric پایین‌تر = پیش‌فرض) |
| `enp63s0` | `192.168.88.50` | اینترنت آزادتر |

### sudo broker — قبل از هر دستور privileged

برخی کارها (مثل `ip route`، `systemctl restart`، `ufw`) به **root** نیاز دارند. به‌جای زدن `sudo` و وارد کردن پسورد هر بار:

```bash
# ترمینال ۱ — یک بار اجرا کن و باز بگذار
cd ~/3x-ui && python3 sudo_broker.py
# پسورد sudo را یک بار می‌دهی؛ در RAM می‌ماند

# ترمینال ۲ — دستورات بدون پسورد
python3 ~/3x-ui/run_via_broker.py 'ip route show default'
```

**معنی:** broker مثل «منشی root» است — پسورد را یک بار می‌گیرد، بقیهٔ دستورات از سوکت `~/3x-ui/sudo_broker.sock` رد می‌شوند.

### دستی (`ip route` موقت)

```bash
sudo ip route add default via 192.168.88.1 dev enp63s0 metric 50
curl -I https://auth.docker.io
docker pull node:20-alpine
sudo ip route del default via 192.168.88.1 dev enp63s0 metric 50
```

### با sudo broker (بدون پسورد مکرر)

```bash
python3 ~/3x-ui/run_via_broker.py 'ip route add default via 192.168.88.1 dev enp63s0 metric 50'
# docker pull ...
python3 ~/3x-ui/run_via_broker.py 'ip route del default via 192.168.88.1 dev enp63s0 metric 50'
```

### CLI تعاملی (پایدار / netplan)

```bash
cd ~/3x-ui/api
python3 network_metrics_cli.py
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

## ۱۰. دستورات سریع تشخیص

```bash
ssh ash@192.168.88.50

# مسیر پیش‌فرض
ip route show default

# پورت‌ها
ss -tulpn | grep LISTEN

# سرویس‌ها
systemctl is-active nginx modulehub-cms docker fail2ban chrony

# تست فیلتر vs آزاد (نتایج متغیر)
curl -s --interface ens4 --max-time 6 -o /dev/null -w "ens4 yt: %{http_code}\n" https://youtube.com
curl -s --interface enp63s0 --max-time 6 -o /dev/null -w "enp63 yt: %{http_code}\n" https://youtube.com

# sendThrough در xray
docker exec 3x-ui cat /app/bin/config.json | grep sendThrough
```

---

## ۱۱. Server Health Monitor (خودکار)

اسکریپت Python در [`3x-ui/server_health/`](../../../3x-ui/server_health/) — مستندات: [`server-health-monitor.md`](../../../3x-ui/docs/server-health-monitor.md)

```bash
# روی سرور
cd ~/3x-ui && python3 -m server_health check

# از ویندوز
python3 -m server_health check --host ash@192.168.88.50 --json
```

| چک | محتوا |
|----|--------|
| resources | load، RAM، دیسک |
| systemd / docker | سرویس‌ها و کانتینر 3x-ui |
| ports / http | پورت‌ها و probeهای localhost |
| xui | اعتبار `webListen` در `x-ui.db` |
| network | Dual-WAN و `sendThrough` |

Exit code: `0` سالم، `1` warning، `2` critical.

راهنمای ساده (چک سلامت + تست واحد): [`server-health-monitor.md`](../../../3x-ui/docs/server-health-monitor.md)

</div>
