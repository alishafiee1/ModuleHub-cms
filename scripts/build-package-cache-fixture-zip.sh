#!/usr/bin/env bash
# purpose --- Build flat ZIP fixture for package-cache smoke tests ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
FIXTURE_DIR="${APP_DIR}/tests/fixtures/modules/package-cache-test"
OUTPUT_ZIP="${APP_DIR}/tests/fixtures/modules/package-cache-test.zip"

if [[ ! -f "${FIXTURE_DIR}/package.json" ]]; then
  echo "[build-package-cache] ERROR: missing ${FIXTURE_DIR}/package.json" >&2
  exit 1
fi

rm -f "${OUTPUT_ZIP}"
(
  cd "${FIXTURE_DIR}"
  zip -qr "${OUTPUT_ZIP}" .
)

echo "[build-package-cache] Created ${OUTPUT_ZIP}"
echo "[build-package-cache] Expected manifest hash:"
node -e "
const fs=require('fs');
const c=fs.readFileSync('${FIXTURE_DIR}/package.json','utf8').replace(/\r\n/g,'\n');
const payload='package.json:'+c;
console.log(require('crypto').createHash('sha256').update(payload,'utf8').digest('hex'));
"
