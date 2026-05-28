<div dir="rtl" style="text-align:right;">

# ModuleHub CMS — Composer 2.5 (پروژه‌ای)

> عمومی: [`AI learning docs/.../Composer 2.5.md`](../../../AI%20learning%20docs/AI%20common%20mistakes/Composer%202.5.md)

---

### [DEPLOY-001] `MODULEHUB_DEV_SUPER_ADMIN` فقط در `.env` سرور
- **اشتباه:** فرض کارت + بدون خط در `/opt/modulehub-cms/.env`
- **درست:** `MODULEHUB_DEV_SUPER_ADMIN=1` در `.env` + `sudo systemctl restart modulehub-cms`
- **زمینه:** phase 8 قبل · admin UI

### [DEPLOY-002] metric toggler crash — deploy با کد قدیمی
- **اشتباه:** ادامه deploy وقتی `ip route add` در toggler قدیمی fail شده
- **درست:** `export MODULEHUB_SKIP_WAN=1` → `git reset --hard origin/main` → `install-to-opt` → `deploy-on-server.sh --skip-pull`
- **زمینه:** dual-wan · ash@192.168.88.50

### [DEPLOY-003] `tsc: not found` — build قبل از prune
- **اشتباه:** فقط `npm ci --omit=dev` سپس `npm run build`
- **درست:** deploy جدید: `npm ci` (با dev) → `build` → `npm prune --omit=dev`
- **زمینه:** /opt/modulehub-cms

### [OK-001] مسیر deploy موفق (تأیید شده)
- **راه‌حل:** `MODULEHUB_SKIP_WAN=1` + `reset --hard origin/main` + `install-to-opt.sh` + `deploy-on-server.sh --skip-pull` + health OK
- **تأیید:** `Deploy finished successfully` · `curl http://127.0.0.1:4000/health`
- **زمینه:** e47aa4e+

</div>
