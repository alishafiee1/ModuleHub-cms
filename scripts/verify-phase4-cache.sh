#!/usr/bin/env bash
# purpose --- Verify phase 4 package cache for an installed module ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
CMS_URL="${MODULEHUB_CMS_URL:-http://127.0.0.1:4000}"
EXPECTED_HASH="7064c31c899b1d8c9f847a6de82080a5892647a1717e461351651213bbc69c5f"

log() { printf '[verify-phase4] %s\n' "$*"; }
fail() { log "FAIL: $*"; exit 1; }
pass() { log "PASS: $*"; }

usage() {
  echo "Usage: bash scripts/verify-phase4-cache.sh <module-id> [second-module-id]" >&2
  exit 1
}

[[ $# -ge 1 ]] || usage

MODULE_ID="$1"
SECOND_MODULE_ID="${2:-}"
MODULE_DIR="${APP_DIR}/standalone-modules/${MODULE_ID}"
NODE_MODULES="${MODULE_DIR}/node_modules"

if [[ ! -d "${MODULE_DIR}" ]]; then
  fail "Module directory not found: ${MODULE_DIR}"
fi

if [[ ! -e "${NODE_MODULES}" ]]; then
  fail "node_modules missing — upload may not have triggered cache install"
fi

if [[ ! -L "${NODE_MODULES}" ]]; then
  fail "node_modules is not a symlink"
fi
pass "node_modules is symlink"

LINK_TARGET="$(readlink -f "${NODE_MODULES}" 2>/dev/null || readlink "${NODE_MODULES}")"
log "node_modules -> ${LINK_TARGET}"

if [[ "${LINK_TARGET}" != *"/var/cache/modulehub/pkg/"* ]] && [[ "${LINK_TARGET}" != *"storage/cache/pkg"* ]]; then
  log "WARN: symlink target may be local dev path: ${LINK_TARGET}"
fi

HASH_FROM_LINK="$(echo "${LINK_TARGET}" | sed -n 's|.*/pkg/\([a-f0-9]\{64\}\)/.*|\1|p')"
if [[ -n "${HASH_FROM_LINK}" && "${HASH_FROM_LINK}" != "${EXPECTED_HASH}" ]]; then
  fail "cache hash mismatch: got ${HASH_FROM_LINK}, expected ${EXPECTED_HASH}"
fi
[[ -n "${HASH_FROM_LINK}" ]] && pass "cache hash matches fixture (${EXPECTED_HASH})"

CACHE_ROOT=""
if [[ -n "${HASH_FROM_LINK}" ]]; then
  if [[ -d "/var/cache/modulehub/pkg/${HASH_FROM_LINK}" ]]; then
    CACHE_ROOT="/var/cache/modulehub/pkg/${HASH_FROM_LINK}"
  elif [[ -d "${APP_DIR}/storage/cache/pkg/${HASH_FROM_LINK}" ]]; then
    CACHE_ROOT="${APP_DIR}/storage/cache/pkg/${HASH_FROM_LINK}"
  fi
fi

if [[ -n "${CACHE_ROOT}" && -f "${CACHE_ROOT}/.cache-meta.json" ]]; then
  pass "cache meta exists: ${CACHE_ROOT}/.cache-meta.json"
else
  log "WARN: .cache-meta.json not found (may be ok on partial install)"
fi

if ! node -e "process.chdir('${MODULE_DIR}'); console.log(require('left-pad')('hi',5,' ')==='   hi');" | grep -q true; then
  fail "left-pad require failed in module directory"
fi
pass "left-pad works via symlinked node_modules"

DIAG_URL="${CMS_URL}/modules/${MODULE_ID}/api/diagnostics"
DIAG_JSON="$(curl -sf "${DIAG_URL}" 2>/dev/null || true)"
if [[ -z "${DIAG_JSON}" ]]; then
  log "WARN: could not fetch ${DIAG_URL} — is module running on port 4100?"
else
  echo "${DIAG_JSON}" | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
if(!d.nodeModulesIsSymlink) process.exit(2);
if(!d.leftPadWorks) process.exit(3);
if(d.manifestHash!=='${EXPECTED_HASH}') process.exit(4);
console.log('diagnostics ok');
" && pass "HTTP diagnostics OK (${DIAG_URL})" || fail "HTTP diagnostics failed — check Start + port 4100"
fi

if [[ -n "${SECOND_MODULE_ID}" ]]; then
  SECOND_DIR="${APP_DIR}/standalone-modules/${SECOND_MODULE_ID}/node_modules"
  if [[ -L "${SECOND_DIR}" ]]; then
    SECOND_TARGET="$(readlink -f "${SECOND_DIR}" 2>/dev/null || readlink "${SECOND_DIR}")"
    if [[ "${SECOND_TARGET}" == "${LINK_TARGET}" ]]; then
      pass "second module shares same cache symlink (cache hit)"
    else
      fail "second module symlink differs — cache hit expected"
    fi
  else
    fail "second module node_modules not symlink"
  fi
fi

log "All checks passed for module ${MODULE_ID}"
