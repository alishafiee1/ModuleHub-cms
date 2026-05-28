#!/usr/bin/env bash
# purpose --- Shared helpers for deploy-full.sh (logging, paths, commit marker) ------
set -euo pipefail

DEPLOY_AUTO_YES="${DEPLOY_AUTO_YES:-false}"
DEPLOY_DRY_RUN="${DEPLOY_DRY_RUN:-false}"
DEPLOY_STEP_CURRENT=0
DEPLOY_STEP_TOTAL="${DEPLOY_STEP_TOTAL:-11}"

log_step() {
  DEPLOY_STEP_CURRENT=$((DEPLOY_STEP_CURRENT + 1))
  printf '[deploy-full] step %s/%s: %s\n' "${DEPLOY_STEP_CURRENT}" "${DEPLOY_STEP_TOTAL}" "$*"
}

log_info() {
  printf '[deploy-full] %s\n' "$*"
}

log_warn() {
  printf '[deploy-full] WARN: %s\n' "$*" >&2
}

log_ok() {
  printf '[deploy-full] OK: %s\n' "$*"
}

log_error() {
  printf '[deploy-full] ERROR: %s\n' "$*" >&2
}

confirm() {
  local message="$1"
  local default_no="${2:-true}"
  if [[ "${DEPLOY_AUTO_YES}" == true ]]; then
    log_info "auto-yes: ${message}"
    return 0
  fi
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] would ask: ${message}"
    return 0
  fi
  local prompt="[y/N]"
  if [[ "${default_no}" != true ]]; then
    prompt="[Y/n]"
  fi
  printf '[deploy-full] %s %s ' "${message}" "${prompt}"
  local answer=""
  read -r answer
  answer="$(printf '%s' "${answer}" | tr '[:upper:]' '[:lower:]')"
  if [[ "${default_no}" == true ]]; then
    [[ "${answer}" == "y" || "${answer}" == "yes" ]]
    return
  fi
  [[ "${answer}" != "n" && "${answer}" != "no" ]]
}

resolve_home_clone() {
  printf '%s' "${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}"
}

resolve_opt_dir() {
  printf '%s' "${MODULEHUB_APP_DIR:-/opt/modulehub-cms}"
}

resolve_branch() {
  printf '%s' "${MODULEHUB_GIT_BRANCH:-main}"
}

deploy_marker_path() {
  local opt_dir
  opt_dir="$(resolve_opt_dir)"
  printf '%s/storage/.deploy-commit' "${opt_dir}"
}

read_deployed_commit() {
  local marker
  marker="$(deploy_marker_path)"
  if [[ -f "${marker}" ]]; then
    tr -d '[:space:]' < "${marker}"
    return 0
  fi
  printf ''
}

write_deployed_commit() {
  local commit_sha="$1"
  local marker opt_dir
  opt_dir="$(resolve_opt_dir)"
  marker="$(deploy_marker_path)"
  mkdir -p "${opt_dir}/storage"
  printf '%s\n' "${commit_sha}" > "${marker}"
}

git_short_sha() {
  git -C "$1" rev-parse --short HEAD 2>/dev/null || printf 'unknown'
}

git_full_sha() {
  git -C "$1" rev-parse HEAD 2>/dev/null || printf ''
}

strip_crlf_from_scripts() {
  local scripts_dir="$1"
  local shell_script=""
  shopt -s nullglob
  for shell_script in "${scripts_dir}"/*.sh "${scripts_dir}"/lib/*.sh; do
    if [[ -f "${shell_script}" ]]; then
      sed -i 's/\r$//' "${shell_script}" 2>/dev/null || true
    fi
  done
  shopt -u nullglob
}

has_dirty_worktree() {
  local home_clone="$1"
  [[ -n "$(git -C "${home_clone}" status --porcelain 2>/dev/null || true)" ]]
}
