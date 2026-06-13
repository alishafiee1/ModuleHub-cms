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

## Context

ModuleHub CMS یک پلتفرم greenfield است که روی Ubuntu 22.04+ با Nginx (HTTPS → `127.0.0.1:4000`) اجرا می‌شود. در سرورهای dual-NIC، نصب وابستگی‌ها از رابط ثانویه با `network-metric-toggler` انجام می‌شود. **امنیت admin در لایه CMS** — Session Super Admin + Module Manager (نه محدودیت IP در Nginx).

**مرجع:** `docs/design.md` §۶.۵، `docs/system-settings.example.json`

**محدودیت‌ها:**
- بدون DB خارجی — JSON + session store (memory یا file)
- endpointهای admin فقط با session معتبر
- CMS روی `127.0.0.1` bind
- **TypeScript + JSDoc** — جدول §۱۲؛ جزئیات `docs/code-rolls.md`
- ESLint Airbnb، فایل ≤۳۰۰ خط

## Goals / Non-Goals

**Goals:**
- Super Admin Session login از اینترنت/LAN (سطح ۲)
- Module Manager — رمز per-module، session scoped
- صفحه اصلی، wizard، runtime، cache، backup
- CSRF + rate limit + bcrypt

**Non-Goals:**
- 2FA/TOTP (فاز بعد)
- کتابخانه ماژول آماده
- API REST عمومی بدون auth
- IP-only admin without session auth

## Decisions

### 1–7. (Stack, storage, frontend, runtime, resources, cache, dual-WAN)

همان تصمیمات قبلی — مرجع `docs/design.md` §۱–§۷.

### 8. احراز هویت — Session + Module Manager

**سطح:** ۲ — Session Login در CMS

| نقش | ورود | محدوده |
|-----|------|--------|
| Super Admin | `/admin/login` | همه `/admin/*` |
| Module Manager | `/admin/module/:id/auth` | فقط `moduleId` |
| کاربر عادی | — | `/`، `/modules/<id>/` |

- **Stack:** `express-session` + `bcrypt` + `express-rate-limit`
- **Cookie:** HttpOnly, Secure, SameSite=Strict
- **CSRF:** همه POST admin
- **Nginx:** proxy `/admin` بدون `deny` — auth در middleware CMS
- **Env:** `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`

### 9. Frontend admin UX

- کارت **+** فقط با Super Admin session
- **⚙** برای همه visible — بدون auth → «ورود برای مدیریت»
- Module Manager → SweetAlert رمز → scoped actions
- `script.js` — fetch API (نه Map محلی)

### 10. فازبندی

| فاز | محتوا |
|-----|-------|
| 0–7.5 | infra → settings (همان قبل) |
| **8** | **auth: Super Admin + Module Manager** |
| 9 | integration tests + deploy |

### 11. Auto-restart on crash

از `autoRestartOnCrash` / `autoRestartMaxAttemptsPerHour` — handler در module-runtime.

### 12. TypeScript + JSDoc

مرجع کامل: `docs/code-rolls.md`

| قانون | جزئیات |
|--------|--------|
| TypeScript | `core/src/` — `tsc`؛ بدون `any` |
| Types | `interface` IO برای هر ماژول در `core/src/modules/` |
| JSDoc | هر `export function` — `@param` + `@returns` + یک خط |
| Lint | `npm run lint` — gate پایان هر فاز + فاز ۹ |
| Test | Jest unit test همان فاز — gate فاز ۹ |

```typescript
/** @param usedPorts - assigned ports @returns next free port */
export function assignNextPort(usedPorts: number[], start: number, end: number): number
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Brute-force login | rate limit + lockout |
| Brute-force module password | modulePasswordMaxAttempts + lockout |
| CSRF on admin actions | CSRF token |
| Session hijack | Secure cookie + HTTPS |
| Backup leaks hashes | treat backup as secret |
| Public `/admin` surface | Session required — no anonymous admin |

## Migration Plan

1. Deploy CMS با auth middleware
2. Nginx: حذف `allow/deny` از `/admin` — فقط proxy + TLS
3. Set `SESSION_SECRET` و `ADMIN_PASSWORD_HASH` در env
4. Smoke: login از WAN → admin UI

## Open Questions

- [x] Auth: Session level 2 — Super Admin + Module Manager
- [x] Internet admin: yes — via login (not IP restrict)
- [x] CSRF: included in phase 8 auth
- [ ] 2FA for Super Admin: phase 2?
- [ ] GitHub sync: SSH key or HTTPS token?
