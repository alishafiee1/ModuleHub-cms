#!/usr/bin/env bash
# purpose --- Reinstall Linux-native npm binaries when node_modules came from Windows ---
# Reinstall Linux-native npm binaries when node_modules came from Windows --- uses unpkg CDN when registry.npmjs.org is blocked ---
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
CDN_BASE="${MODULEHUB_NPM_CDN:-https://unpkg.com}"

log() {
  printf '[restore-linux-native-deps] %s\n' "$*"
}

download_file() {
  local url="$1"
  local dest="$2"
  mkdir -p "$(dirname "${dest}")"
  curl -sfL "${url}" -o "${dest}"
}

install_node_gyp_build() {
  local target_dir="${APP_DIR}/node_modules/node-gyp-build"
  local version="4.8.0"
  log "node-gyp-build@${version}"
  mkdir -p "${target_dir}"
  for file_name in package.json index.js node-gyp-build.js optional.js; do
    download_file "${CDN_BASE}/node-gyp-build@${version}/${file_name}" "${target_dir}/${file_name}"
  done
}

install_bcrypt_linux() {
  local target_dir="${APP_DIR}/node_modules/bcrypt"
  local version="6.0.0"
  local native_path="${target_dir}/prebuilds/linux-x64/bcrypt.glibc.node"
  if [[ -f "${native_path}" ]]; then
    local file_type=""
    file_type="$(file -b "${native_path}" 2>/dev/null || true)"
    if [[ "${file_type}" == *"ELF"* ]]; then
      log "bcrypt Linux prebuild already OK"
      return 0
    fi
  fi
  log "bcrypt@${version} (linux prebuild via CDN)"
  rm -rf "${target_dir}"
  mkdir -p "${target_dir}/prebuilds/linux-x64"
  for file_name in package.json bcrypt.js promises.js; do
    download_file "${CDN_BASE}/bcrypt@${version}/${file_name}" "${target_dir}/${file_name}"
  done
  download_file \
    "${CDN_BASE}/bcrypt@${version}/prebuilds/linux-x64/bcrypt.glibc.node" \
    "${target_dir}/prebuilds/linux-x64/bcrypt.glibc.node"
}

verify_bcrypt() {
  (
    cd "${APP_DIR}"
    node -e "require('bcrypt'); console.log('bcrypt load OK')"
  )
}

main() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    log "WARN: not Linux — skipping"
    exit 0
  fi

  log "APP_DIR=${APP_DIR}"
  install_node_gyp_build
  install_bcrypt_linux
  verify_bcrypt
  log "Done"
}

main "$@"
