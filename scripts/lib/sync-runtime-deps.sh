#!/usr/bin/env bash
# purpose --- Copy production node_modules home → opt when registry is offline ------
set -euo pipefail

SOURCE_DIR="${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}"
TARGET_DIR="${MODULEHUB_APP_DIR:-/opt/modulehub-cms}"

log() {
  printf '[sync-runtime-deps] %s\n' "$*"
}

try_npm_ci_in_opt() {
  if [[ ! -f "${TARGET_DIR}/package-lock.json" ]]; then
    return 1
  fi
  (
    cd "${TARGET_DIR}"
    npm ci --omit=dev
  )
}

copy_home_node_modules_to_opt() {
  if [[ ! -d "${SOURCE_DIR}/node_modules" ]]; then
    echo "[sync-runtime-deps] ERROR: home node_modules missing" >&2
    return 1
  fi
  log "rsync node_modules home → opt"
  rsync -a --delete "${SOURCE_DIR}/node_modules/" "${TARGET_DIR}/node_modules/"
}

prune_opt_dev_dependencies() {
  if [[ ! -d "${TARGET_DIR}/node_modules" ]]; then
    return 0
  fi
  log "npm prune --omit=dev in opt (best effort)"
  (
    cd "${TARGET_DIR}"
    npm prune --omit=dev
  ) || log "WARN: npm prune failed — continuing with copied node_modules"
}

sync_runtime_dependencies() {
  if try_npm_ci_in_opt; then
    log "opt npm ci --omit=dev OK"
    return 0
  fi

  log "WARN: opt npm ci failed — falling back to home node_modules copy"
  copy_home_node_modules_to_opt
  prune_opt_dev_dependencies
}
