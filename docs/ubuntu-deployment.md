<style>
body, p, h1, h2, h3, li { font-family: 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
</style>

<div dir="rtl" style="text-align:right;">

# استقرار ModuleHub CMS روی Ubuntu Server

**پلتفرم پشتیبانی‌شده:** Ubuntu Server 22.04 / 24.04 LTS  
**توسعه روی Windows:** فقط via WSL2 یا SSH به سرور Ubuntu

## پیش‌نیازها

- Node.js 20+
- Docker Engine + Compose plugin
- UFW (اختیاری)

## نصب سریع

```bash
sudo bash scripts/ubuntu-install.sh
cd /opt/modulehub-cms
cp .env.example .env
npm ci && npm run build
sudo cp config/systemd/modulehub-cms.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now modulehub-cms
```

## UFW

```bash
sudo ufw allow 4000/tcp    # پورت هسته (تغییر دهید طبق .env)
# پورت‌های ماژول standalone به صورت dynamic — پس از start از dashboard هشدار می‌گیرید
```

## Nginx (اختیاری)

```nginx
server {
    listen 443 ssl;
    server_name cms.example.com;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## مسیرها

| مسیر |用途 |
|------|-----|
| `/opt/modulehub-cms` | کد و build |
| `/var/lib/modulehub/modules.json` | رجیstry |
| `/var/run/docker.sock` | Docker socket |

## دسترسی فایل

```bash
sudo chown -R modulehub:modulehub /var/lib/modulehub
sudo usermod -aG docker modulehub
```

</div>
