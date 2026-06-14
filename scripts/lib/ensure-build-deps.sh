#!/usr/bin/env bash
# purpose --- Ensure home clone has dev tools for tsc build when npm registry is offline ------
set -euo pipefail

APP_DIR="${MODULEHUB_APP_DIR:-${HOME}/ModuleHub-cms}"
CDN_BASE="${MODULEHUB_NPM_CDN:-https://cdn.jsdelivr.net/npm}"
TYPESCRIPT_VERSION="${MODULEHUB_TYPESCRIPT_VERSION:-6.0.3}"

log() {
  printf '[ensure-build-deps] %s\n' "$*"
}

home_has_tsc() {
  [[ -x "${APP_DIR}/node_modules/.bin/tsc" ]] \
    || [[ -x "${APP_DIR}/node_modules/typescript/bin/tsc" ]]
}

install_typescript_from_cdn() {
  local temp_dir archive_path
  temp_dir="$(mktemp -d)"
  archive_path="${temp_dir}/typescript.tgz"
  log "typescript@${TYPESCRIPT_VERSION} from CDN (registry offline fallback)"
  curl -sfL \
    "${CDN_BASE}/typescript@${TYPESCRIPT_VERSION}/typescript-${TYPESCRIPT_VERSION}.tgz" \
    -o "${archive_path}"
  tar -xzf "${archive_path}" -C "${temp_dir}"
  rm -rf "${APP_DIR}/node_modules/typescript"
  mkdir -p "${APP_DIR}/node_modules"
  cp -a "${temp_dir}/package" "${APP_DIR}/node_modules/typescript"
  mkdir -p "${APP_DIR}/node_modules/.bin"
  ln -sf ../typescript/bin/tsc "${APP_DIR}/node_modules/.bin/tsc"
  ln -sf ../typescript/bin/tsserver "${APP_DIR}/node_modules/.bin/tsserver"
  rm -rf "${temp_dir}"
}

ensure_build_dependencies() {
  if home_has_tsc; then
    log "tsc already available"
    return 0
  fi

  if [[ ! -d "${APP_DIR}/node_modules" ]]; then
    echo "[ensure-build-deps] ERROR: node_modules missing — run npm ci when registry is reachable" >&2
    return 1
  fi

  local npm_registry="${MODULEHUB_NPM_REGISTRY:-https://registry.npmmirror.com}"
  log "installing typescript@${TYPESCRIPT_VERSION} via ${npm_registry}"
  (
    cd "${APP_DIR}"
    npm install "typescript@${TYPESCRIPT_VERSION}" --no-save --registry "${npm_registry}"
  ) || install_typescript_from_cdn

  if ! home_has_tsc; then
    echo "[ensure-build-deps] ERROR: tsc still missing after fallback install" >&2
    return 1
  fi

  log "tsc ready"
}

ensure_build_dependencies
