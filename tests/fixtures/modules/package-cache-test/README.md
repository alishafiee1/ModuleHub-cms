# ماژول تست — Package Cache

Backend Express برای تأیید کش پکیج ModuleHub (symlink + npm install).

## manifest hash (ثابت)

```
36ac3dc3c1c3e0acb45bf01d7bdbe262facce1c24bb31f03abf84db5ea951107
```

## ساخت ZIP

```bash
bash scripts/build-package-cache-fixture-zip.sh
```

## تست دستی (UI)

1. ZIP را آپلود کنید — پاسخ باید `dependencies.installed: true` و hash بالا باشد.
2. wizard: Docker **خیر** · پورت **4100** · needsProcess **بله**
3. **Start** → باز کردن `/modules/<module-id>/`
4. همان ZIP را دوباره آپلود کنید — `dependencies.installed: false` · همان hash

## تست خودکار

```bash
bash scripts/smoke/test-package-cache.sh
bash scripts/verify-package-cache.sh <module-id>
```

## معیار PASS در `/api/diagnostics`

- `nodeModulesIsSymlink: true`
- `leftPadWorks: true`
- `manifestHash` = hash بالا
