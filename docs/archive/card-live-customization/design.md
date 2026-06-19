<div dir="rtl" style="text-align:right;">

# طراحی — Card Live UI (پورت واحد + مسیریابی با nodeId)

> **مسیر:** `docs/change/card-live-customization/design.md`  
> **پیش‌نیاز:** [proposal.md](./proposal.md)  
> **پیش‌نیاز پیاده‌سازی:** فاز ۷.۶ card canvas + runtime ماژول

---

## §۱ معماری کلی

```
[مرورگر — کارت روی بوم]
    │  poll / SSE
    ▼
[CMS — /api/card-ui/:nodeId/*]  ← یک درگاه HTTP روی همان پورت 4000/nginx
    │  resolve nodeId → moduleId, localPort
    │  cache + throttle
    ▼
[ماژول running — localhost:PORT]
    GET /__modulehub/card-ui?cardId=<nodeId>&kind=data|html
```

- **یک پورت عمومی** = همان CMS (`127.0.0.1:4000` پشت nginx) — کاربر و مرورگر فقط این را می‌بینند.
- **پورت‌های ماژول** فقط روی localhost — CMS proxy می‌کند.

---

## §۲ مدل manifest

```json
{
  "cardPresentation": {
    "mode": "default" | "static-template" | "live",
    "live": {
      "pollIntervalSec": 5,
      "allowScripts": true,
      "modulePath": "/__modulehub/card-ui"
    }
  }
}
```

| mode | رفتار |
|------|--------|
| `default` | آیکون + عنوان + توضیح |
| `static-template` | ⏸ معلق — [archive](../../archive/1405-03-24-static-card-template-suspended/proposal.md)؛ جایگزین در فاز ۰ این change |
| `live` | iframe با script + polling از CMS |

---

## §۳ API CMS (درگاه واحد)

همهٔ مسیرها **بدون auth** برای بازدیدکننده (فقط دادهٔ عمومی کارت) — یا با همان session اگر داده حساس باشد (فاز بعد).

| متد | مسیر | توضیح |
|-----|------|--------|
| `GET` | `/api/card-ui/:nodeId/data` | JSON تجمیع‌شده برای به‌روزرسانی DOM |
| `GET` | `/api/card-ui/:nodeId/html` | HTML اولیه iframe (اختیاری — می‌توان از data ساخت) |
| `GET` | `/api/card-ui/batch?nodes=a,b,c` | poll چند کارت — یک round-trip |

### ۳.۱ resolve `nodeId`

```typescript
function resolveCardUiTarget(nodeId: string): {
  moduleId: string;
  localPort: number;
  running: boolean;
} | null;
```

- از `site-layout.json` node را پیدا کن → `moduleId` از `nodeType === 'module'`
- از `modules[moduleId]` وضعیت `running` و `port` را بخوان
- اگر stop → `{ running: false }` → CMS پاسخ `204` یا JSON fallback

### ۳.۲ proxy به ماژول

```http
GET http://127.0.0.1:{port}/__modulehub/card-ui?cardId={nodeId}&kind=data
Timeout: 500ms
```

پاسخ پیشنهادی ماژول:

```json
{
  "version": 1,
  "html": "<div class='live'>...</div>",
  "patch": { "temperature": "24.5", "unit": "°C" },
  "ttlSec": 3
}
```

- `html` — جایگزینی کامل (اولین بار یا تغییر بزرگ)
- `patch` — به‌روزرسانی سبک بدون re-render کل HTML

---

## §۴ کلاینت (card-canvas)

### ۴.۱ `CardLiveController`

- یک instance per کارت با `mode === 'live'`
- `IntersectionObserver` — فقط visible → poll
- صف سراسری: حداکثر **۵** درخواست `batch` همزمان برای کل صفحه
- `pollIntervalSec` از manifest یا تنظیم سراسری CMS

### ۴.۲ iframe sandbox

```html
<iframe sandbox="allow-scripts" src="about:blank" ...></iframe>
```

- **بدون** `allow-same-origin` — اسکریپت داخل iframe به CMS دست نزند
- به‌روزرسانی: `postMessage` از parent (card-canvas) به iframe با `{ type: 'card-ui-patch', patch }`
- یا `srcdoc` برای HTML اولیه از CMS

### ۴.۳ قرارداد postMessage

```javascript
// parent → iframe
{ type: 'modulehub:card-ui', nodeId, html?, patch? }

// iframe → parent (اختیاری)
{ type: 'modulehub:card-ready', nodeId }
```

---

## §۵ کش و throttle سرور

| پارامتر | پیش‌فرض |
|---------|---------|
| cache TTL per nodeId | 5s |
| timeout به ماژول | 500ms |
| max concurrent proxy | 10 |
| batch max nodes | 20 |

کلید کش: `card-ui:{nodeId}:{kind}` — invalidate وقتی ماژول stop/start شود.

---

## §۶ امنیت

| تهدید | mitigation |
|--------|------------|
| SSRF از طریق nodeId | فقط localhost + port از registry ماژول |
| XSS در HTML ماژول | sandbox iframe؛ CSP `frame-src 'self'` |
| فشار poll | viewport gate + batch + cache |
| nodeId ماژول دیگر | resolve دقیق از layout — module باید `cardId` را validate کند |

ماژول در handler خودش `cardId` را با لیست مجاز مقایسه کند.

---

## §۷ تفاوت با static-template

| | static-template | live |
|--|-----------------|------|
| اسکریپت | ❌ | ✅ |
| drag/resize بوم | ❌ قفل | ✅ (مثل default) یا قابل قفل اختیاری |
| polling | ❌ | ✅ |
| پورت مرورگر | فقط CMS برای asset | CMS `/api/card-ui` |

---

## §۸ فایل‌های پیش‌بینی‌شده

| لایه | فایل |
|------|------|
| types | `core/src/modules/card-ui/types.ts` |
| resolver | `core/src/modules/card-ui/resolve-node.ts` |
| proxy | `core/src/modules/card-ui/card-ui-proxy.ts` |
| routes | `core/src/modules/card-ui/routes.ts` → mount `/api/card-ui` |
| client | `public/js/card-canvas/card-live-controller.js` |
| manifest | گسترش wizard validation |
| spec | `openspec/specs/card-live-ui/spec.md` |
| docs-for-ai | `docs-for-ai/card-ui-protocol.md` |

---

## §۹ تست

| نوع | سناریو |
|-----|--------|
| unit | resolve nodeId؛ cache hit/miss؛ timeout |
| API | proxy به mock module؛ 404 node نامعتبر |
| E2E | E2E-CLU-01 — عدد روی کارت بدون F5 عوض شود |
| load | ۳۰ node — تعداد درخواست به localhost زیر آستانه |

</div>

<style>
body, p, h1, h2, h3, h4, h5, h6, li, ul, ol { font-family: 'Segoe UI', Segoe, Tahoma, Geneva, Verdana, sans-serif !important; direction: rtl; text-align: right; }
pre, code { direction: ltr; text-align: left; }
.markdown-body table, .markdown-preview-section table, table { direction: rtl !important; text-align: right !important; width: 100%; border-collapse: collapse; }
.markdown-body th, .markdown-body td, table th, table td { text-align: right !important; direction: rtl; vertical-align: top; padding: 0.35em 0.5em; }
table td code, table th code { direction: ltr; unicode-bidi: embed; text-align: right !important; display: inline-block; }
.task-list-item input[type="checkbox"], input.task-list-item-checkbox { margin: 0 0.5em 0 0 !important; }
</style>
