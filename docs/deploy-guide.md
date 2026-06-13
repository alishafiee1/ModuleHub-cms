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
</style>

<div dir="rtl" style="text-align:right;">

# راهنمای استقرار — ModuleHub CMS

راهنمای عمومی برای deploy روی Ubuntu. IP و دامنهٔ نمونه: `deploy@203.0.113.1` و `example.com` (RFC5737 — با مقادیر واقعی خودت جایگزین کن).

## پیش‌نیازها

- Ubuntu 22.04+
- Node.js 20 (`nvm` یا package manager)
- Nginx، systemd، git، curl
- (اختیاری) دو NIC — برای `npm install` / `docker pull` از رابط ثانویه

## نصب اولیه

```bash
git clone https://github.com/alishafiee1/ModuleHub-cms.git /opt/modulehub-cms
cd /opt/modulehub-cms
cp .env.example .env
# SESSION_SECRET و ADMIN_PASSWORD_HASH را پر کن
npm ci && npm run build
bash scripts/setup-server-dirs.sh
bash scripts/install-systemd.sh
```

## Nginx

```bash
sudo cp config/nginx/modulehub-cms.conf.example /etc/nginx/sites-available/modulehub-cms
# server_name و مسیر SSL را ویرایش کن
sudo ln -sf /etc/nginx/sites-available/modulehub-cms /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Deploy بعد از هر push

```bash
cd /opt/modulehub-cms
bash scripts/deploy-full.sh
# یا: bash scripts/deploy-on-server.sh
curl -s http://127.0.0.1:4000/health
```

## dual-NIC (اختیاری)

اگر primary NIC برای `npm`/`git` کافی نیست:

```bash
bash scripts/run-with-free-wan.sh npm ci
```

جزئیات: [`server-scripts.md`](server-scripts.md) · [`developer-guide.md`](developer-guide.md)

## sudo broker (اختیاری)

برای deploy بدون تایپ مکرر sudo:

```bash
python3 ~/ModuleHub-cms/scripts/sudo_broker.py
# socket: ~/ModuleHub-cms/runtime/sudo_broker.sock
```

## مستندات بیشتر

- [`server-scripts.md`](server-scripts.md) — اسکریپت‌ها
- [`developer-guide.md`](developer-guide.md) — ماژول ZIP و wizard
- [`design plan.md`](design%20plan.md) — معماری

## چک‌لیست قبل از go-live (فاز ۸)

قبل از اینکه سایت را بدون bypass ادمین موقت در معرض اینترنت بگذاری:

1. فاز ۸ (login واقعی، Module Manager، rate limit) کامل شده باشد — [`tasks.md`](tasks.md)
2. `MODULEHUB_DEV_SUPER_ADMIN` خاموش شود:
   ```bash
   bash scripts/disable-dev-admin-on-server.sh
   ```
3. `SESSION_SECRET` و `ADMIN_PASSWORD_HASH` در `.env` تنظیم شده باشند
4. بعد از deploy، `curl` بدون session به `/admin/settings/data` باید 401 برگرداند
5. اسکریپت deploy هشدار `MODULEHUB_DEV_SUPER_ADMIN=1` را در لاگ نشان ندهد

</div>
