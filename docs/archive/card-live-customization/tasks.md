<div dir="rtl" style="text-align:right;">

# تسک‌ها — سفارشی‌سازی زندهٔ کارت

> **مسیر:** `docs/change/card-live-customization/tasks.md`  
> **طراحی:** [design.md](./design.md) · **چرا:** [proposal.md](./proposal.md)  
> **پیش‌نیاز:** [1405-03-24-folder-card-management](../1405-03-24-folder-card-management/tasks.md) فاز ۱–۳ ✅

---

## فاز ۰ — تکمیل دیزاین کارت (جایگزین پلن معلق static-template)

> پلن iframe + `card.html` از folder-card-management **معلق** است — [archive](../../archive/1405-03-24-static-card-template-suspended/proposal.md).  
> این فاز **روش جدید** را طراحی و پیاده می‌کند (نه کپی مستقیم ۴.۱–۴.۷ قدیم).

- [ ] ۰.۱ پروپوزال/behavior روش واحد دیزاین کارت (ثابت + live در یک مدل)
- [ ] ۰.۲ `cardPresentation` در schema — بازنگری نسبت به پلن معلق
- [ ] ۰.۳ نمونهٔ ماژول demo
- [ ] ۰.۴ E2E smoke کارت سفارشی

---

## فاز ۱ — پروتکل و درگاه CMS

> **ریسک:** SSRF اگر resolve nodeId ضعیف باشد

- [ ] ۱.۱ `docs-for-ai/card-ui-protocol.md` — قرارداد `GET /__modulehub/card-ui` در ماژول
- [ ] ۱.۲ `resolve-node.ts` — nodeId → moduleId, port, running
- [ ] ۱.۳ `card-ui-proxy.ts` — proxy با timeout 500ms + cache 5s
- [ ] ۱.۴ routes: `GET /api/card-ui/:nodeId/data` و `GET /api/card-ui/:nodeId/html`
- [ ] ۱.۵ `GET /api/card-ui/batch?nodes=...` — poll تجمیعی
- [ ] ۱.۶ unit: resolve، cache، timeout، module stopped → fallback
- [ ] ۱.۷ **تموم شدن فاز:** `npm test` سبز برای `card-ui/`

---

## فاز ۲ — manifest و validation

- [ ] ۲.۱ `cardPresentation.mode: live` در schema `module.json`
- [ ] ۲.۲ wizard: هشدار اگر `live` بدون `main` entry running
- [ ] ۲.۳ نمونهٔ handler در `tests/fixtures/modules/card-live-demo/`
- [ ] ۲.۴ **تموم شدن فاز:** ماژول demo در wizard accept شود

---

## فاز ۳ — کلاینت card-canvas

> **ریسک:** poll بی‌پایان وقتی تب hidden — باید pause شود

- [ ] ۳.۱ `card-live-controller.js` — IntersectionObserver + poll
- [ ] ۳.۲ صف سراسری حداکثر ۵ batch همزمان
- [ ] ۳.۳ iframe sandbox + `postMessage` patch/html
- [ ] ۳.۴ `createCardElement` — شاخه `mode === 'live'`
- [ ] ۳.۵ pause poll وقتی `document.hidden`
- [ ] ۳.۶ تست E2E: **E2E-CLU-01** — داده بدون F5 عوض شود
- [ ] ۳.۷ تست E2E: **E2E-CLU-02** — ماژول stop → fallback default
- [ ] ۳.۸ **تموم شدن فاز:** E2E سبز

---

## فاز ۴ — بار و مستندات

- [ ] ۴.۱ تست بار دستی: ۳۰ کارت live — CPU/درخواست در حد deploy-guide
- [ ] ۴.۲ `docs/module-hosting-guide.md` — بخش Card Live UI
- [ ] ۴.۳ `openspec/specs/card-live-ui/spec.md`
- [ ] ۴.۴ خط در `docs/tasks.md` — فاز ۷.۱۱
- [ ] ۴.۵ `/sync-docs` → rename به `1405-XX-XX-card-live-customization`

---

## فاز ۵ (اختیاری) — SSE / WebSocket

- [ ] ۵.۱ `GET /api/card-ui/stream?nodes=...` — EventSource
- [ ] ۵.۲ مقایسهٔ بار با polling — تصمیم deploy

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
