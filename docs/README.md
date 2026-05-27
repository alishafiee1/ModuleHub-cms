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

# مستندات ModuleHub CMS

راهنمای خواندن داکیومنت‌های پروژه — **ModuleHub CMS** (نام رسمی).

---

## Legend وضعیت

| نماد | معنی |
|------|------|
| ✅ | پیاده‌سازی شده در v2 (کد فعلی) |
| 🔜 | هدف / فاز بعد — در design و proposal آمده، هنوز کامل نیست |
| ⛔ | منسوخ — فقط برای تاریخچه؛ از آن پیروی نکنید |

---

## از کجا بخوانم؟

| نقش | ترتیب پیشنهادی |
|-----|----------------|
| **مدیر سایت / محصول** | [proposal-simple.md](proposal-simple.md) → [proposal.md](proposal.md) |
| **توسعه‌دهنده core** | [design.md](design.md) → [code-rolls.md](code-rolls.md) → OpenSpec v2 |
| **سازنده ماژول ZIP** | [standalone-module-guide.md](standalone-module-guide.md) → [module-spec.md](module-spec.md) |
| **AI / Agent** | [standalone-module-ai-guide.md](standalone-module-ai-guide.md) → [module-spec.md](module-spec.md) |
| **استقرار Ubuntu** | [ubuntu-deployment.md](ubuntu-deployment.md) → [server-update-restart.md](server-update-restart.md) → [.env.example](../.env.example) |

---

## فهرست فایل‌ها

| فایل | محتوا | وضعیت |
|------|--------|--------|
| [proposal.md](proposal.md) | روایت و چشم‌انداز (فارسی) | ✅ + 🔜 (جدول Current/Target) |
| [proposal-simple.md](proposal-simple.md) | همان روایت به زبان ساده‌تر | ✅ روایت |
| [current-status.md](current-status.md) | وضعیت واقعی پیاده‌سازی (P0–P4) | ✅ |
| [glossary-and-field-ownership.md](glossary-and-field-ownership.md) | واژگان + مالکیت فیلدها | ✅ |
| [audit-matrix.md](audit-matrix.md) | بررسی هم‌راستایی docs ↔ code | ✅ |
| [design.md](design.md) | معماری فنی، تصمیم‌ها، فازبندی | **منبع فنی اصلی** |
| [module-spec.md](module-spec.md) | schema واحد `manifest.json` | ✅ |
| [standalone-module-guide.md](standalone-module-guide.md) | راهنمای ZIP برای انسان | ✅ (بخش lifecycle: 🔜 settings mode) |
| [standalone-module-ai-guide.md](standalone-module-ai-guide.md) | prompt و قرارداد برای AI | ✅ |
| [public-homepage.md](public-homepage.md) | homepage، gear، `site-layout.json` | ✅ |
| [ubuntu-deployment.md](ubuntu-deployment.md) | نصب production روی Ubuntu | ✅ |
| [server-update-restart.md](server-update-restart.md) | به‌روزرسانی کد + restart گام‌به‌گام | ✅ |
| [code-rolls.md](code-rolls.md) | قوانین کدنویسی و PR | ✅ |
| [archive/](archive/) | اسناد منسوخ | ⛔ |

---

## منبع حقیقت (Truth sources)

| موضوع | منبع |
|-------|------|
| **کد پیاده‌شده v2** | [README.md](../README.md) + `openspec/changes/public-homepage-architecture-v2/` |
| **چشم‌انداز و فازبندی** | [design.md](design.md) |
| **قرارداد manifest** | [module-spec.md](module-spec.md) |
| **تاریخچه MVP (منسوخ)** | `openspec/changes/modulehub-cms-initial-core/` ⛔ |

---

## تصمیم‌های معماری (خلاصه)

1. **هر Add** (قالب catalog یا ZIP) → پوشه instance مستقل در `standalone-modules/<instance-id>/` + ثبت در `modules.json` و `site-layout.json`.
2. **قالب‌های read-only** در `core/catalog-modules/` — instance زنده روی دیسک سرور کپی می‌شود، نه داخل repo core.
3. **Standalone ZIP:** `index.html` روی host؛ API فقط از مسیرهای `proxy.paths` (پیش‌فرض `api`) به Docker.
4. **Docker پس از upload:** برای تنظیمات بالا می‌آید؛ اگر پارامترها ناقص باشد، کلیک روی کارت در `/admin` → فرم تنظیمات (🔜 کامل در کد).
5. **`type: static` ZIP** ⛔ منسوخ — فقط `standalone` یا built-in در core.

---

## نام‌گذاری پوشه‌ها (migration)

| نام قدیم ⛔ | نام استاندارد |
|------------|----------------|
| `static-modules/` | `core/catalog-modules/` (قالب) |
| ModularCore CMS | **ModuleHub CMS** |
| `doc/` | `docs/` |

---

## OpenSpec

- **فعلی (v2):** `openspec/changes/public-homepage-architecture-v2/` ✅
- **منسوخ:** `openspec/changes/modulehub-cms-initial-core/` ⛔

### Roadmap (P1–P4) — آماده برای `/opsx:apply`

| فاز | Change | محتوا |
|-----|--------|--------|
| P1 | `virtual-folder-tree-and-browse` | پوشه مجازی، browse، Add card ✅ |
| P2a | `catalog-modules-and-instance-copy` | catalog + instance مستقل ✅ |
| P2b | `standalone-settings-form-and-lifecycle` | Docker settings mode ✅ |
| P2c | `homepage-gear-dialog-admin-actions` | دیالوگ ⚙ ✅ |
| P3 | `github-sync-and-partial-zip-update` | Git pull + Partial ZIP ✅ |
| P4 | `module-password-per-card-auth` | رمز per-module ✅ |
| P5 | audit alignment | lifecycle deprecate، ZIP UX، catalog bootstrap، registry Zod ✅ |

ترتیب پیشنهادی پیاده‌سازی: P1 → P2a → P2b → P2c → P3 → P4 → P5 (audit)

</div>
