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
.markdown-body table,
.markdown-preview-section table,
table {
  direction: rtl !important;
  text-align: right !important;
  width: 100%;
  border-collapse: collapse;
  margin-inline-start: 0;
  margin-inline-end: auto;
}
.markdown-body th,
.markdown-body td,
.markdown-preview-section th,
.markdown-preview-section td,
table thead th,
table tbody td,
table th,
table td {
  text-align: right !important;
  direction: rtl;
  vertical-align: top;
  padding: 0.35em 0.5em;
}
table td code,
table th code,
.markdown-body table td code,
.markdown-body table th code {
  direction: ltr;
  unicode-bidi: embed;
  text-align: right !important;
  display: inline-block;
}
.task-list-item input[type="checkbox"],
input.task-list-item-checkbox {
  margin: 0 0.5em 0 0 !important;
}
</style>

# tests — تست خودکار (بدون سرور واقعی)

**هدف:** منطق TypeScript در `core/src/` — Jest، بدون nginx و بدون SSH.

---

## چه مشکلی دارم؟

| مشکل | دستور |
|------|--------|
| همه unitها | `npm test` یا `npm run test:unit` |
| یک فایل | `npx jest tests/unit/package-cache/hash.test.ts` |
| smoke کش روی سرور | `npm run smoke:package-cache` |
| چک‌لیست UI دستی | [`smoke/card-canvas-checklist.md`](smoke/card-canvas-checklist.md) |

---

## ساختار

```
tests/
├── unit/<feature>/     ← Jest
├── fixtures/modules/package-cache-test/
├── helpers/
└── smoke/              ← چک‌لیست markdown (دستی)
```

---

## لایه‌ها

| لایه | کجا | کی |
|------|-----|-----|
| **unit** | `tests/unit/` | هر commit — `npm test` |
| **smoke** | `scripts/smoke/test-package-cache.sh` | سرور — `npm run smoke:package-cache` |
| **health** | `scripts/run-checks.sh` | بعد deploy |
| **E2E دستی** | `tests/smoke/*.md` | قبل release UI |

---

## fixture package-cache

```bash
bash scripts/build-package-cache-fixture-zip.sh
bash scripts/smoke/test-package-cache.sh
bash scripts/verify-package-cache.sh <module-id>
```

hash ثابت → `tests/unit/package-cache/package-cache-fixture-hash.test.ts`

---

## خروجی موفق

```
Test Suites: N passed
Tests:       M passed
```
