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

# وضعیت پیاده‌سازی ModuleHub CMS

> **روایت محصول (ملاک intent):** [proposal-simple.md](proposal-simple.md)  
> **این فایل:** وضعیت **واقعی کد** — جدا از جدول قدیمی proposal-simple

---

## Legend

| نماد | معنی |
|------|------|
| ✅ | در کد پیاده شده |
| 🔜 | در روایت هست، در کد نیست یا ناقص |
| ⛔ | منسوخ — استفاده نکنید |

---

## Roadmap P0–P4

| فاز | Change | قابلیت | وضعیت |
|-----|--------|--------|--------|
| P0 | `public-homepage-architecture-v2` | هسته، homepage، ZIP، proxy، builtin demo | ✅ |
| P1 | `virtual-folder-tree-and-browse` | پوشه مجازی، `/browse/`، breadcrumb، Add card | ✅ |
| P2a | `catalog-modules-and-instance-copy` | catalog templates، `POST /api/instances` | ✅ |
| P2b | `standalone-settings-form-and-lifecycle` | settings mode، `settings_pending`، فرم Settings | ✅ |
| P2c | `homepage-gear-dialog-admin-actions` | دیالوگ ⚙، stats، Start/Stop/Logs/Settings | ✅ |
| P3 | `github-sync-and-partial-zip-update` | Git Pull، Partial ZIP | ✅ |
| P4 | `module-password-per-card-auth` | رمز per-module، unlock API | ✅ |

---

## capability × وضعیت (خلاصه)

| قابلیت (proposal-simple) | کد | OpenSpec |
|--------------------------|-----|----------|
| Homepage با کارت‌ها | ✅ | P0 |
| پوشه مجازی + browse | ✅ | P1 |
| Add: پوشه جدید | ✅ | P1 |
| Add: آپلود ZIP | ✅ | P0 + P2b |
| Add: از catalog | ✅ | P2a |
| ZIP → Docker settings → فرم | ✅ | P2b |
| ⚙ gear (Start/Stop/Settings/Git/Partial) | ✅ | P2c + P3 |
| رمز per-module | ✅ | P4 |
| گالری/مارک‌داون **instance** (نه فقط builtin) | ✅ bootstrap catalog-first | P5c |
| Live Widget | 🔜 | — |
| Session store پایدار (Redis) | 🔜 | — |

---

## مغایرت‌های P5 (بسته شده)

| موضوع | وضعیت | Change |
|--------|--------|--------|
| `POST /approve` legacy | ⛔ 410 Gone | P5a ✅ |
| ZIP با manifest در subfolder | ✅ پیام flatten | P5b ✅ |
| bootstrap builtin demo در layout | ✅ `BOOTSTRAP_BUILTIN_LAYOUT` | P5c ✅ |
| validate `modules.json` با Zod | ✅ | P5d ✅ |

---

## تست

آخرین suite: `npm test` — **80 tests** (P4 + audit P5)

</div>
