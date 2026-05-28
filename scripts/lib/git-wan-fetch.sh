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

run_git_with_interface() {
  local home_clone="$1"
  local interface="$2"
  shift 2
  local free_wan_runner="${home_clone}/scripts/run-with-free-wan.sh"

  if [[ "${MODULEHUB_SKIP_WAN:-}" == "1" ]]; then
    log_info "MODULEHUB_SKIP_WAN=1 — git without route toggle"
    git -C "${home_clone}" "$@"
    return $?
  fi

  if [[ ! -f "${free_wan_runner}" ]]; then
    log_warn "missing ${free_wan_runner} — running git directly"
    git -C "${home_clone}" "$@"
    return $?
  fi

  log_info "trying interface=${interface} command=git -C ${home_clone} $*"
  MODULEHUB_PACKAGE_INSTALL_INTERFACE="${interface}" \
    bash "${free_wan_runner}" git -C "${home_clone}" "$@"
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
  git -C "${home_clone}" "$@"
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
