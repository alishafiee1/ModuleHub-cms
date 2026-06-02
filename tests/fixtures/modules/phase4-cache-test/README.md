# ماژول تست فاز ۴ — Package Cache

Backend Express برای تأیید کش پکیج ModuleHub (symlink + npm install).

## manifest hash (ثابت)

```
7064c31c899b1d8c9f847a6de82080a5892647a1717e461351651213bbc69c5f
```

## ساخت ZIP

```bash
bash scripts/build-phase4-test-zip.sh
```

## تست دستی (UI)

1. ZIP را آپلود کنید — پاسخ باید `dependencies.installed: true` و hash بالا باشد.
2. wizard: Docker **خیر** · پورت **4100** · needsProcess **بله**
3. **Start** → باز کردن `/modules/<module-id>/`
4. همان ZIP را دوباره آپلود کنید — `dependencies.installed: false` · همان hash

## تست خودکار

```bash
bash scripts/test-package-cache-manual.sh
bash scripts/verify-phase4-cache.sh <module-id>
```

## معیار PASS در `/api/diagnostics`

- `nodeModulesIsSymlink: true`
- `leftPadWorks: true`
- `manifestHash` = hash بالا
