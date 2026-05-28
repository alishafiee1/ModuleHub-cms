#!/usr/bin/env bash
# purpose --- Build flat ZIP for phase 4 cache test fixture ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
FIXTURE_DIR="${APP_DIR}/tests/fixtures/modules/phase4-cache-test"
OUTPUT_ZIP="${APP_DIR}/tests/fixtures/modules/phase4-cache-test.zip"

if [[ ! -f "${FIXTURE_DIR}/package.json" ]]; then
  echo "[build-phase4-test-zip] ERROR: missing ${FIXTURE_DIR}/package.json" >&2
  exit 1
fi

rm -f "${OUTPUT_ZIP}"
(
  cd "${FIXTURE_DIR}"
  zip -qr "${OUTPUT_ZIP}" .
)

echo "[build-phase4-test-zip] Created ${OUTPUT_ZIP}"
echo "[build-phase4-test-zip] Expected manifest hash:"
node -e "
const fs=require('fs');
const crypto=require('crypto');
const c=fs.readFileSync('${FIXTURE_DIR}/package.json','utf8');
console.log(crypto.createHash('sha256').update('package.json:'+c,'utf8').digest('hex'));
"
