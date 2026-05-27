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

# Audit Matrix — proposal-simple → docs → code

> تاریخ audit: 2026-05-27 · ملاک intent: [proposal-simple.md](proposal-simple.md) · ملاک implemented: [current-status.md](current-status.md)

| فایل | موضوع | vs proposal-simple | vs code | اقدام | وضعیت |
|------|--------|-------------------|---------|--------|--------|
| proposal-simple.md | جدول خط ۱۰۰–۱۰۶ stale | — (نادیده) | P1–P4 ✅ در کد | ارجاع به current-status | **resolved** (فاز ۲) |
| proposal-simple.md | روایت Add/instance/catalog | ✅ هم‌راستا | ✅ | بدون تغییر روایت | resolved |
| design.md | Implementation Matrix ۴۳۵–۴۵۰ | catalog/gear 🔜 نوشته | P2a/P2c/P4 ✅ | به‌روز matrix | **resolved** (فاز ۲) |
| design.md | Approve/Start دستی | ⛔ در روایت نیست | settings flow ✅ | doc fix | resolved |
| module-spec.md | modulePasswordHash 🔜 | ✅ در روایت | ✅ P4 | ✅ در spec | resolved |
| module-spec.md | lifecycle states | مبهم Approve | settings_pending ✅ | جدول lifecycle | resolved |
| public-homepage.md | inline Start/Stop/Logs | ⚙ gear در روایت | gear modal ✅ | doc fix | resolved |
| public-homepage.md | Add card، `/browse` | ✅ | ✅ P1 | doc fix | resolved |
| standalone-module-guide.md | Approve + Start | ⛔ | settings ✅ | doc fix | resolved |
| standalone-module-guide.md | gallery فقط builtin | instance catalog | catalog ✅ P2a | doc fix | resolved |
| README.md | features list | browse/catalog/gear 🔜 | ✅ | features + current-status link | resolved |
| docs/README.md | index | بدون current-status | — | لینک current-status | resolved |
| core/installer.ts | ZIP → settings_pending | ✅ | ✅ | — | resolved |
| core/routes.ts | POST /approve | ⛔ | هنوز 200 | P5a deprecate 410 | **resolved** (فاز ۳) |
| core/types.ts | permissionsApproved | legacy | بدون gate | نگه‌داری optional + deprecate | resolved |
| core/bootstrap + layout | builtin در layout bootstrap | catalog-first | builtin auto-add | P5c filter + env | resolved |
| core/installer.ts | manifest در subfolder | manifest ریشه | خطای مبهم | P5b UX | resolved |
| core/registry.ts | modules.json validate | — | JSON.parse فقط | P5d Zod | resolved |
| site-layout/registry.ts | site-layout validate | — | parseSiteLayout ✅ | قبلاً Zod | resolved |

## کد کلیدی — خلاصه

| موضوع | کد قبل audit | روایت | opsx |
|--------|--------------|--------|------|
| ZIP بعد از upload | settings_pending + Docker | ✅ | — |
| Approve API | POST 200 | settings جایگزین | P5a |
| گالری/مارک‌داون | builtin demo در layout | instance catalog | P5c |
| card image در catalog Add | layout icon | ✅ | — |
| ZIP root structure | generic error | manifest ریشه | P5b |
| permissionsApproved | فیلد legacy | نیست | P5a doc |

</div>
