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

# scripts — یک دستور برای شروع

```bash
cd ~/ModuleHub-cms   # یا /opt/modulehub-cms
bash scripts/run-checks.sh
```

جزئیات deploy → [`docs/deploy-guide.md`](../docs/deploy-guide.md) · AI rules → [`docs-for-ai/scripts-and-tests-rules.md`](../docs-for-ai/scripts-and-tests-rules.md)

---

## چه کاری می‌خواهم؟

| کار | دستور |
|-----|--------|
| عیب‌یابی سریع (health) | `bash scripts/run-checks.sh` یا `npm run checks` |
| smoke کش پکیج (روی سرور) | `npm run smoke:package-cache` |
| deploy کامل بعد از push | `bash scripts/deploy-full.sh --yes` |
| sync home → opt (بعد از build) | `bash scripts/install-to-opt.sh` |
| node_modules از ویندوز روی لینوکس | `bash scripts/restore-linux-native-deps.sh` |
| git pull در home | `bash scripts/lib/git-fetch.sh` یا `git pull --ff-only` |
| backup ZIP کل سایت | `node scripts/cli.js backup --output /tmp/full.zip` |
| sudo بدون پسورد مکرر | رمز یک‌بار در `deploy-full.sh` (یا `sudo_broker.py` قدیمی — اختیاری) |

---

## نصب یک‌بار (سرور)

| اسکریپت | کار |
|---------|-----|
| `setup-server-dirs.sh` | `/var/log/modulehub` و `/var/cache/modulehub` |
| `install-to-opt.sh` | sync home → `/opt` + `npm ci` |
| `install-systemd.sh` | unit `modulehub-cms.service` |
| `install-logrotate.sh` | چرخش لاگ ماژول‌ها |

ترتیب از صفر → [`docs/server-scripts.md`](../docs/server-scripts.md)

---

## smoke/

| اسکریپت | کار |
|---------|-----|
| `smoke/test-package-cache.sh` | دو upload ZIP — کش hit/miss |
| `build-package-cache-fixture-zip.sh` | ساخت ZIP تست |
| `verify-package-cache.sh` | symlink + diagnostics بعد از upload |

fixture: `tests/fixtures/modules/package-cache-test/`

---

## manual/

(خالی — اسکریپت‌های موقت route حذف شده‌اند.)

---

## lib/ — مستقیم اجرا نکن

| فایل | نقش |
|------|-----|
| `lib/deploy-common.sh` | log، مسیر home/opt |
| `lib/git-fetch.sh` | fetch/pull ساده با راهنمای auth |
| `lib/sudo-exec.sh` | یک‌بار رمز sudo در ابتدای deploy |

---

## Legacy (wrapper در ریشه scripts/)

| قدیمی (ریشه) | canonical |
|--------------|-----------|
| `test-package-cache-manual.sh` | `smoke/test-package-cache.sh` |
| `server-fix-deploy.sh` | `deploy-full.sh --yes` |

---

## dev-only (تا فاز ۸)

| اسکریپت | کار |
|---------|-----|
| `enable-dev-admin-on-server.sh` | `isSuperAdmin:true` موقت |
| `disable-dev-admin-on-server.sh` | برگرداندن |

---

## قوانین مهم

- **روی سرور `scripts/` را دستی ویرایش نکن** — لوکال + push + `deploy-full.sh`
- shell: `bash scripts/foo.sh`
- `.gitattributes`: `*.sh text eol=lf`
