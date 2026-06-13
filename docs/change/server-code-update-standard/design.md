<div dir="rtl" style="text-align:right;">

# طراحی — استاندارد به‌روزرسانی کد روی سرور

> **پروپزال:** [proposal.md](./proposal.md)  
> **مرجع فنی:** [`scripts/README.md`](../../../scripts/README.md) · [`deploy-guide.md`](../../deploy-guide.md) · [`docs-for-ai/scripts-and-tests-rules.md`](../../../docs-for-ai/scripts-and-tests-rules.md)

---

## §۱ تصویر کلی

```
ویندوز (توسعه)  →  push به GitHub  →  سرور home clone  →  sync به /opt  →  build  →  restart  →  health
```

**قانون طلایی:** روی سرور **کد نمی‌نویسی** — فقط می‌کشی، می‌سازی، ری‌استارت می‌کنی.

---

## §۲ دو محیط روی سرور

| مسیر | نقش |
|------|-----|
| `~/ModuleHub-cms` | clone گیت — `deploy-full.sh` اینجا را pull می‌کند |
| `/opt/modulehub-cms` | نسخهٔ زنده — سرویس از اینجا اجرا می‌شود |

`deploy-full.sh` ترتیب را خودش می‌رود: fetch/pull در home → `install-to-opt` → build در opt → restart → `run-checks.sh`.

---

## §۳ شبکه — بعد از flip اینترنت آزاد

وضعیت فعلی سرور (`server condition.md` §۳): مسیر پیش‌فرض سیستم روی اینترنت آزاد است.

| حالت | رفتار deploy |
|------|----------------|
| **پیش‌فرض جدید** | `git fetch` / `npm ci` **بدون** metric toggle — `--skip-wan` یا `MODULEHUB_SKIP_WAN=1` |
| **فقط نصب پکیج ماژول / docker pull** | هنوز ممکن است `run-with-free-wan` لازم باشد اگر سرویس خاصی فیلتر بماند |
| **probe شکست خورد** | اول DNS و `curl github.com` — نه بلافاصله برگشت به اسکریپت‌های legacy WAN |

**تغییر طراحی پیشنهادی در `git-wan-fetch.sh`:** اگر کم‌metric interface همان `packageInstallInterface` است → مستقیم git بدون toggler.

---

## §۴ احراز هویت مخزن (ریشهٔ خطای فعلی)

| روش | مناسب سرور | یادداشت |
|-----|------------|---------|
| **SSH + deploy key** | ✅ پیشنهادی | `git@github.com:alishafiee1/ModuleHub-cms.git` |
| HTTPS + PAT | ✅ | token به‌جای رمز حساب — در credential helper |
| HTTPS + رمز GitHub | ❌ | GitHub دیگر قبول نمی‌کند |

یک‌بار روی سرور تنظیم می‌شود؛ `deploy-full` نباید interactive باشد.

---

## §۵ دستورهای استاندارد

| مرحله | کجا | دستور |
|--------|-----|--------|
| توسعه | ویندوز | commit + push |
| deploy | سرور home | `bash scripts/deploy-full.sh --skip-wan --yes` |
| چک سریع | سرور | `bash scripts/run-checks.sh` یا `npm run checks` |
| smoke کش | سرور (اختیاری) | `npm run smoke:package-cache` |

**منسوخ / فقط legacy:** `server-fix-deploy.sh`، `temp-free-wan-default.sh` برای git روزمره.

---

## §۶ خطا و بازیابی

| خطا | معنی | اقدام |
|-----|------|--------|
| Authentication failed | remote HTTPS بدون token/SSH | §۴ را یک‌بار درست کن |
| local changes will be discarded | ویرایش روی سرور | عمدی — یا push از PC یا backup قبل deploy |
| health check fail | سرویس بالا نیامد | `journalctl -u modulehub-cms` · `run-checks.sh` |
| `npm: not found` در systemd | PATH | `MODULEHUB_NPM_PATH` در `.env` |

---

## §۷ داکیومنت‌هایی که باید هم‌خوان شوند

- `docs/deploy-guide.md` — بخش «ورود یک‌بار به مخزن» + `--skip-wan` پیش‌فرض
- `docs/server-scripts.md` — حذف فرض «گیت از خط فیلترشده»
- `3x-ui/docs-personal/server condition.md` §۹ — جدول قدیمی ens4/پیش‌فرض
- `docs-for-ai/scripts-and-tests-rules.md` — env و ممنوعیت ویرایش scripts روی سرور

---

## §۸ E2E — سناریوی موفق

1. روی ویندوز فیچر را تمام می‌کنی و push می‌زنی.
2. SSH به سرور — `deploy-full.sh --skip-wan --yes` بدون سؤال رمز.
3. `curl` health → 200.
4. سایت از مرورگر با hard refresh درست است.

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
