<div dir="rtl" style="text-align:right;">

# تسک‌ها — استاندارد به‌روزرسانی کد روی سرور

> **طراحی:** [design.md](./design.md)

---

## فاز ۱ — ورود یک‌بار به مخزن (ریسک: بدون این deploy هر بار می‌ایستد)

- [x] ۱.۱ روی سرور کلید SSH بساز و در GitHub حساب `alishafiee1` اضافه کن
- [x] ۱.۲ `origin` را به SSH عوض کن — تست: `git fetch origin` بدون سؤال رمز
- [x] ۱.۳ همان remote را در `/opt/modulehub-cms` هم چک کن (اگر clone جداست) — opt git clone نیست

**تست:** `git -C ~/ModuleHub-cms fetch origin` — exit 0

---

## فاز ۲ — deploy بدون ترفند شبکهٔ اضافی

- [x] ۲.۱ از ویندوز تغییرات استانداردسازی اسکریپت را push کن
- [x] ۲.۲ روی سرور: `bash scripts/deploy-full.sh --skip-wan --yes`
- [x] ۲.۳ `bash scripts/run-checks.sh` — health OK

**ریسک فاز:** اگر home clone خیلی قدیمی است → `--force-reset` فقط با backup ذهنی از `.env`

---

## فاز ۳ — هوشمند کردن اسکریپت (کد)

- [x] ۳.۱ `git-wan-fetch.sh`: اگر default route از قبل آزاد است → خودکار `SKIP_WAN`
- [x] ۳.۲ `deploy-full.sh`: پیش‌فرض `--skip-wan` فقط برای git؛ npm از toggler
- [x] ۳.۳ پیام خطای واضح وقتی auth شکست خورد (راهنما به SSH/PAT)

**تست:** `npm test` · deploy dry-run: `bash scripts/deploy-full.sh --dry-run`

---

## فاز ۴ — داک

- [x] ۴.۱ `deploy-guide.md` — بخش «ورود مخزن» + «اینترنت آزاد = بدون WAN toggle»
- [x] ۴.۲ `server-scripts.md` — به‌روز dual-WAN (فقط برای npm ماژول / docker)
- [x] ۴.۳ `server condition.md` §۹ — جدول نقش ens4/enp63s0 بعد از flip
- [x] ۴.۴ یک خط در `docs/tasks.md` اصلی — لینک به این change

**تست E2E:** push → deploy → باز کردن سایت در مرورگر

---

## تموم شدن change

- [x] `/sync-docs` → پوشه `1405-03-23-server-code-update-standard`
- [x] یک خط در `docs-personal/walkthrough.md`

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
