#!/usr/bin/env bash
# purpose --- Manual smoke test for package cache using fixture ZIP ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPTS_ROOT}/.." && pwd)}"
ZIP_PATH="${APP_DIR}/tests/fixtures/modules/package-cache-test.zip"
CMS_URL="${MODULEHUB_CMS_URL:-http://127.0.0.1:4000}"

if [[ ! -f "${ZIP_PATH}" ]]; then
  echo "[test-package-cache] Building fixture ZIP..."
  bash "${SCRIPTS_ROOT}/build-package-cache-fixture-zip.sh"
fi

echo "auth: $(curl -s "${CMS_URL}/api/auth/status")"

echo "--- upload 1 (expect installed:true) ---"
START1=$(date +%s)
R1=$(curl -s -X POST "${CMS_URL}/admin/upload" -F "zipFile=@${ZIP_PATH};type=application/zip")
END1=$(date +%s)
echo "elapsed1=$((END1 - START1))s"
echo "$R1"

MODULE_ID_1="$(echo "$R1" | node -e "try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(j.moduleId||'')}catch{}" )"
HASH1="$(echo "$R1" | node -e "try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(j.dependencies?.hash||'')}catch{}" )"

sleep 1

echo "--- upload 2 (expect installed:false, cache hit) ---"
START2=$(date +%s)
R2=$(curl -s -X POST "${CMS_URL}/admin/upload" -F "zipFile=@${ZIP_PATH};type=application/zip")
END2=$(date +%s)
echo "elapsed2=$((END2 - START2))s"
echo "$R2"

MODULE_ID_2="$(echo "$R2" | node -e "try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(j.moduleId||'')}catch{}" )"
HASH2="$(echo "$R2" | node -e "try{const j=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(j.dependencies?.hash||'')}catch{}" )"

echo "--- hash compare ---"
echo "hash1=${HASH1}"
echo "hash2=${HASH2}"

if [[ -n "${HASH1}" && "${HASH1}" == "${HASH2}" ]]; then
  echo "PASS: same hash on both uploads"
else
  echo "FAIL: hash mismatch or missing"
  exit 1
fi

echo "--- cache dir (server) ---"
ls -la /var/cache/modulehub/pkg/ 2>/dev/null | head -8 || ls -la "${APP_DIR}/storage/cache/pkg/" 2>/dev/null | head -8 || echo "(cache dir not listed)"

if [[ -n "${MODULE_ID_1}" ]]; then
  echo "--- verify module 1 filesystem ---"
  bash "${SCRIPTS_ROOT}/verify-package-cache.sh" "${MODULE_ID_1}" "${MODULE_ID_2:-}"
fi

echo ""
echo "Next: complete wizard for ${MODULE_ID_1} (port 4100, needsProcess) -> Start -> open ${CMS_URL}/modules/${MODULE_ID_1}/"
