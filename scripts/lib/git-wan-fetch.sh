#!/usr/bin/env bash
# purpose --- Git fetch/pull with dual-WAN interface probe and fallback ------
set -euo pipefail

GIT_WAN_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-common.sh
source "${GIT_WAN_LIB_DIR}/deploy-common.sh"

GIT_WAN_PROBE_URL="${MODULEHUB_WAN_PROBE_URL:-https://github.com}"
GIT_WAN_PROBE_TIMEOUT="${MODULEHUB_WAN_PROBE_TIMEOUT:-8}"

append_unique_interface() {
  local interface="$1"
  local -n list_ref="$2"
  local existing=""
  if [[ -z "${interface}" ]]; then
    return 0
  fi
  for existing in "${list_ref[@]}"; do
    if [[ "${existing}" == "${interface}" ]]; then
      return 0
    fi
  done
  list_ref+=("${interface}")
}

read_interface_from_settings() {
  local settings_file="$1"
  if [[ ! -f "${settings_file}" ]] || ! command -v python3 >/dev/null 2>&1; then
    return 0
  fi
  python3 -c "import json,sys; d=json.load(open(sys.argv[1],encoding='utf-8')); print(d.get('packageInstallInterface',''))" \
    "${settings_file}" 2>/dev/null || true
}

collect_wan_interfaces() {
  local home_clone="$1"
  local opt_dir="$2"
  local -a interfaces=()
  local item=""
  local settings_file=""
  local route_line=""
  local interface_name=""
  local -a wan_items=()

  if [[ -n "${MODULEHUB_WAN_INTERFACES:-}" ]]; then
    IFS=',' read -r -a wan_items <<< "${MODULEHUB_WAN_INTERFACES}"
    for item in "${wan_items[@]}"; do
      append_unique_interface "$(printf '%s' "${item}" | xargs)" interfaces
    done
  fi

  for settings_file in \
    "${opt_dir}/storage/system-settings.json" \
    "${home_clone}/storage/system-settings.json" \
    "${home_clone}/docs/system-settings.example.json"; do
    interface_name="$(read_interface_from_settings "${settings_file}")"
    append_unique_interface "${interface_name}" interfaces
  done

  if command -v ip >/dev/null 2>&1; then
    while IFS= read -r route_line; do
      interface_name="$(printf '%s' "${route_line}" | sed -n 's/.* dev \([^ ]*\).*/\1/p')"
      append_unique_interface "${interface_name}" interfaces
    done < <(ip route show default 2>/dev/null || true)
  fi

  if [[ "${#interfaces[@]}" -eq 0 ]]; then
    append_unique_interface "enp63s0" interfaces
  fi

  printf '%s\n' "${interfaces[@]}"
}

probe_interface_reachability() {
  local interface="$1"
  if ! command -v curl >/dev/null 2>&1; then
    return 0
  fi
  curl --interface "${interface}" -sf --max-time "${GIT_WAN_PROBE_TIMEOUT}" "${GIT_WAN_PROBE_URL}" >/dev/null 2>&1
}

read_preferred_default_interface() {
  local route_line=""
  local best_metric=999999
  local best_dev=""
  local metric=""
  local dev=""

  if ! command -v ip >/dev/null 2>&1; then
    return 0
  fi

  while IFS= read -r route_line; do
    metric="$(printf '%s' "${route_line}" | sed -n 's/.* metric \([0-9]\+\).*/\1/p')"
    dev="$(printf '%s' "${route_line}" | sed -n 's/.* dev \([^ ]*\).*/\1/p')"
    if [[ -z "${dev}" ]]; then
      continue
    fi
    if [[ -z "${metric}" ]]; then
      metric=0
    fi
    if (( metric < best_metric )); then
      best_metric="${metric}"
      best_dev="${dev}"
    fi
  done < <(ip route show default 2>/dev/null || true)

  if [[ -n "${best_dev}" ]]; then
    printf '%s' "${best_dev}"
  fi
}

resolve_package_install_interface() {
  local home_clone="$1"
  local opt_dir="$2"
  local settings_file=""
  local interface_name=""

  if [[ -n "${MODULEHUB_PACKAGE_INSTALL_INTERFACE:-}" ]]; then
    printf '%s' "${MODULEHUB_PACKAGE_INSTALL_INTERFACE}"
    return 0
  fi

  for settings_file in \
    "${opt_dir}/storage/system-settings.json" \
    "${home_clone}/storage/system-settings.json" \
    "${home_clone}/docs/system-settings.example.json"; do
    interface_name="$(read_interface_from_settings "${settings_file}")"
    if [[ -n "${interface_name}" ]]; then
      printf '%s' "${interface_name}"
      return 0
    fi
  done

  printf '%s' "enp63s0"
}

default_route_matches_package_interface() {
  local home_clone="$1"
  local opt_dir default_dev package_dev
  opt_dir="$(resolve_opt_dir)"
  default_dev="$(read_preferred_default_interface)"
  package_dev="$(resolve_package_install_interface "${home_clone}" "${opt_dir}")"
  [[ -n "${default_dev}" && -n "${package_dev}" && "${default_dev}" == "${package_dev}" ]]
}

log_git_auth_failure_hint() {
  local home_clone="$1"
  local remote_url=""
  remote_url="$(git -C "${home_clone}" remote get-url origin 2>/dev/null || echo unknown)"
  log_error "Git auth failed — one-time setup required:"
  log_error "  1) SSH deploy key: docs/change/server-code-update-standard/design.md (section 4)"
  log_error "  2) Or HTTPS + PAT in git credential helper"
  log_error "  Current remote: ${remote_url}"
}

git_stderr_indicates_auth_failure() {
  local err_file="$1"
  grep -qiE 'authentication failed|could not read Username|Permission denied \(publickey\)|invalid username or password|terminal prompts disabled' \
    "${err_file}" 2>/dev/null
}

run_git_direct_with_auth_hint() {
  local home_clone="$1"
  shift
  local err_file exit_code
  err_file="$(mktemp)"
  if git -C "${home_clone}" "$@" 2>"${err_file}"; then
    rm -f "${err_file}"
    return 0
  fi
  exit_code=$?
  if git_stderr_indicates_auth_failure "${err_file}"; then
    log_git_auth_failure_hint "${home_clone}"
  fi
  cat "${err_file}" >&2
  rm -f "${err_file}"
  return "${exit_code}"
}

run_git_with_interface() {
  local home_clone="$1"
  local interface="$2"
  shift 2
  local free_wan_runner="${home_clone}/scripts/run-with-free-wan.sh"

  if [[ "${MODULEHUB_SKIP_WAN:-}" == "1" ]]; then
    log_info "MODULEHUB_SKIP_WAN=1 — git without route toggle"
    run_git_direct_with_auth_hint "${home_clone}" "$@"
    return $?
  fi

  if [[ ! -f "${free_wan_runner}" ]]; then
    log_warn "missing ${free_wan_runner} — running git directly"
    run_git_direct_with_auth_hint "${home_clone}" "$@"
    return $?
  fi

  log_info "trying interface=${interface} command=git -C ${home_clone} $*"
  MODULEHUB_PACKAGE_INSTALL_INTERFACE="${interface}" \
    bash "${free_wan_runner}" git -C "${home_clone}" "$@"
}

apply_auto_skip_wan_for_git() {
  local home_clone="$1"
  if [[ "${MODULEHUB_SKIP_WAN:-}" == "1" ]]; then
    return 0
  fi
  if default_route_matches_package_interface "${home_clone}"; then
    local package_dev
    package_dev="$(resolve_package_install_interface "${home_clone}" "$(resolve_opt_dir)")"
    log_info "default route already on ${package_dev} — auto SKIP_WAN for git"
    export MODULEHUB_SKIP_WAN=1
  fi
}

git_operation_with_wan_fallback() {
  local home_clone="$1"
  shift
  local opt_dir
  opt_dir="$(resolve_opt_dir)"
  local -a interfaces=()
  local interface=""

  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] git $* (WAN fallback)"
    return 0
  fi

  apply_auto_skip_wan_for_git "${home_clone}"

  mapfile -t interfaces < <(collect_wan_interfaces "${home_clone}" "${opt_dir}")

  for interface in "${interfaces[@]}"; do
    if probe_interface_reachability "${interface}"; then
      log_info "probe OK on ${interface} → ${GIT_WAN_PROBE_URL}"
      if run_git_with_interface "${home_clone}" "${interface}" "$@"; then
        log_ok "git $* succeeded via ${interface}"
        return 0
      fi
      log_warn "git $* failed via ${interface}"
    else
      log_warn "probe failed on ${interface} — skipping"
    fi
  done

  log_warn "all interfaces failed — trying git without WAN toggle"
  run_git_direct_with_auth_hint "${home_clone}" "$@"
}

git_fetch_with_wan_fallback() {
  local home_clone="$1"
  git_operation_with_wan_fallback "${home_clone}" fetch origin
}

git_pull_with_wan_fallback() {
  local home_clone="$1"
  local branch
  branch="$(resolve_branch)"
  git_operation_with_wan_fallback "${home_clone}" pull --ff-only origin "${branch}"
}
