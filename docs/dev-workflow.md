
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

> **مرجع عملیاتی** — برای چت/فاز جدید ابتدا همین فایل + [`openspec/.../tasks.md`](../openspec/changes/modulehub-cms-v1/tasks.md)  
> سرور: `ash@192.168.88.50` · اجرا: **`/opt/modulehub-cms`** · clone/pull: **`~/ModuleHub-cms`**  
> AI: [`deploy-notes-for-ai.md`](deploy-notes-for-ai.md) · خطاهای ثبت‌شده: [`AI-common-mistakes/`](AI-common-mistakes/readme.md)

---

## وضعیت پیاده‌سازی (خلاصه)

| فاز | موضوع | وضعیت |
|-----|--------|--------|
| 0–1 | infra، layout، UI | ✅ |
| 2 | ZIP wizard، پوشه مجازی | ✅ |
| 3 | runtime (start/stop، `/modules/`) | ✅ |
| 4+ | cache، auth، … | ⏳ بعدی |

جزئیات: [`openspec/changes/modulehub-cms-v1/tasks.md`](../openspec/changes/modulehub-cms-v1/tasks.md)

---

## نمای کلی

```
[Windows] lint/test → commit → push
    → [Server home] git pull → install-to-opt (rsync)
    → [Server /opt] deploy-on-server (build + systemd) → health
```

**systemd** همیشه از `/opt/modulehub-cms` اجرا می‌شود — نه `npm start` دستی در SSH (مگر دیباگ موقت).

---

## ۱. لوکال — ویندوز (توسعه)

```powershell
cd "...\ModuleHub-cms"
npm install
npm run lint
npm run test
npm run build

# تا فاز ۸ — UI ادمین (کارت +)
$env:MODULEHUB_DEV_SUPER_ADMIN="1"
npm run dev
```

مرورگر: `http://127.0.0.1:4000/health` · `http://127.0.0.1:4000/`

```powershell
git add .
git commit -m "feat: ..."
git push origin main
```

- `package-lock.json` حتماً commit شود.
- `.env` · `storage/` · `standalone-modules/` را push نکن.

---

## ۲. سرور — به‌روزرسانی استاندارد (بعد از هر push)

```bash
source ~/.nvm/nvm.sh && nvm use 20
cd ~/ModuleHub-cms

# اگر GitHub از ens4 نمی‌آید:
bash scripts/run-with-free-wan.sh git pull origin main

# اگر metric toggler خطا داد (ip route add) — بخش «بازیابی» پایین
bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull
```

`deploy-on-server.sh` انجام می‌دهد: `npm ci` (با dev) → `npm run build` → `npm prune --omit=dev` → restart systemd → health.

### چک

```bash
curl -sf http://127.0.0.1:4000/health   # {"status":"ok"}
sudo systemctl status modulehub-cms --no-pager
```

سایت: `https://haderbash.ir` (Nginx → `127.0.0.1:4000`). **پورت 4000 را در ufw باز نکن.**

---

## ۳. تست فاز ۲ روی سرور (قبل از login واقعی)

در **`/opt/modulehub-cms/.env`** (با nano ذخیره کن — خط `#` را در shell اجرا نکن):

```env
MODULEHUB_DEV_SUPER_ADMIN=1
```

```bash
sudo systemctl restart modulehub-cms
```

در سایت: کارت **+** → «پوشه جدید» / «آپلود ZIP».  
APIها: `POST /admin/upload` · `POST /admin/wizard/save` · `POST /admin/folder`

> فاز ۸: این فلگ فقط dev — در production بعد از login حذف شود.

---

## ۴. dual-WAN

| NIC | نقش |
|-----|-----|
| `ens4` | فیلترشده (پیش‌فرض) |
| `enp63s0` | آزاد — موقت برای `git` / `npm` |

```bash
bash scripts/run-with-free-wan.sh git pull origin main
bash scripts/run-with-free-wan.sh npm ci
```

`install-to-opt` و `deploy-on-server` معمولاً خودکار از free WAN استفاده می‌کنند.

---

## ۵. بازیابی — وقتی pull / WAN / build شکست خورد

```bash
source ~/.nvm/nvm.sh && nvm use 20
export MODULEHUB_SKIP_WAN=1

cd ~/ModuleHub-cms
git fetch origin
git reset --hard origin/main    # فقط اگر ویرایش محلی سرور مهم نیست

bash scripts/install-to-opt.sh
cd /opt/modulehub-cms
bash scripts/deploy-on-server.sh --skip-pull

curl -sf http://127.0.0.1:4000/health
```

| علامت | اقدام |
|--------|--------|
| `ip route add` / toggler crash | `MODULEHUB_SKIP_WAN=1` + `reset --hard` + deploy بالا |
| `tsc: not found` | deploy قدیمی — حتماً اسکریپت جدید (build بعد از `npm ci` کامل) |
| `tsx: not found` | `npm run dev` روی سرور ممنوع — از systemd / `npm start` |
| health قطع بعد از `npm start` دستی | `Ctrl+C` → `sudo systemctl restart modulehub-cms` |
| `$env:VAR` در Ubuntu | فقط PowerShell — روی سرور `export VAR=1` |

---

## ۶. عیب‌یابی سریع

| مشکل | کار |
|------|-----|
| `pipefail: invalid option` | `bash scripts/...` یا `sed -i 's/\r$//' scripts/*.sh` |
| `npm: command not found` | `source ~/.nvm/nvm.sh && nvm use 20` |
| `Cannot find module 'express'` | `cd /opt/modulehub-cms && bash scripts/deploy-on-server.sh --skip-pull` |
| `git pull` overwrite | فایل محلی سرور را بردار؛ `stash` یا `reset --hard` |
| ویرایش `scripts/` روی سرور | ممنوع — فقط لوکال + push |
| `sudo: terminal required` | SSH تعاملی با `-t` یا sudo broker |
| `Failed to connect to github.com` | `run-with-free-wan.sh` یا `SKIP_WAN` + بررسی شبکه |

---

## ۷. روی سرور دست نزن (با git)

`.env` · `storage/site-layout.json` · `storage/system-settings.json` · `standalone-modules/`

---

## ۸. نصب اولیه (یک‌بار)

SSH **تعاملی** (sudo):

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
curl -sf http://127.0.0.1:4000/health
```

---

## ۹. ارجاع

| موضوع | فایل |
|--------|------|
| چک‌لیست فازها | [`openspec/.../tasks.md`](../openspec/changes/modulehub-cms-v1/tasks.md) |
| معماری | [`design plan.md`](design%20plan.md) |
| قوانین کد | [`code-rolls.md`](code-rolls.md) |
| اسکریپت‌ها | [`server-scripts.md`](server-scripts.md) |
| سازنده ماژول | [`developer-guide.md`](developer-guide.md) |
| AI deploy | [`deploy-notes-for-ai.md`](deploy-notes-for-ai.md) |

</div>
