#!/usr/bin/env bash
# purpose --- Run privileged commands: passwordless sudo, broker, or interactive password ------
set -euo pipefail

SUDO_EXEC_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy-common.sh
source "${SUDO_EXEC_LIB_DIR}/deploy-common.sh"

SUDO_EXEC_KEEPALIVE_PID=""
SUDO_EXEC_PASSWORD=""
SUDO_EXEC_MODE="unknown"
SUDO_EXEC_SOCKET_PATH=""

resolve_broker_script() {
  local home_clone
  home_clone="$(resolve_home_clone)"
  if [[ -n "${MODULEHUB_BROKER_SCRIPT:-}" && -f "${MODULEHUB_BROKER_SCRIPT}" ]]; then
    printf '%s' "${MODULEHUB_BROKER_SCRIPT}"
    return 0
  fi
  if [[ -f "${home_clone}/scripts/run_via_broker.py" ]]; then
    printf '%s' "${home_clone}/scripts/run_via_broker.py"
    return 0
  fi
  printf ''
}

resolve_broker_socket() {
  if [[ -n "${SUDO_BROKER_SOCKET:-}" ]]; then
    printf '%s' "${SUDO_BROKER_SOCKET}"
    return 0
  fi
  printf '%s' "${HOME}/3x-ui/sudo_broker.sock"
}

sudo_exec_cleanup() {
  if [[ -n "${SUDO_EXEC_KEEPALIVE_PID}" ]]; then
    kill "${SUDO_EXEC_KEEPALIVE_PID}" 2>/dev/null || true
  fi
}
trap sudo_exec_cleanup EXIT

start_sudo_keepalive() {
  if [[ "${SUDO_EXEC_MODE}" != "password" ]]; then
    return 0
  fi
  (
    while true; do
      sleep 60
      sudo -n true || exit
      kill -0 "$$" 2>/dev/null || exit
    done
  ) 2>/dev/null &
  SUDO_EXEC_KEEPALIVE_PID=$!
}

detect_sudo_mode() {
  if [[ "${SUDO_EXEC_MODE}" != "unknown" ]]; then
    return 0
  fi
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    SUDO_EXEC_MODE="dry-run"
    return 0
  fi
  if sudo -n true 2>/dev/null; then
    SUDO_EXEC_MODE="passwordless"
    log_info "sudo: passwordless session available"
    return 0
  fi

  SUDO_EXEC_BROKER_SCRIPT="$(resolve_broker_script)"
  SUDO_EXEC_SOCKET_PATH="$(resolve_broker_socket)"
  if [[ -n "${SUDO_EXEC_BROKER_SCRIPT}" && -S "${SUDO_EXEC_SOCKET_PATH}" ]]; then
    SUDO_EXEC_MODE="broker"
    log_info "sudo: using broker socket ${SUDO_EXEC_SOCKET_PATH}"
    return 0
  fi

  if [[ -t 0 ]]; then
    SUDO_EXEC_MODE="password"
    printf '[deploy-full] sudo password required: '
    read -rs SUDO_EXEC_PASSWORD
    printf '\n'
    if ! printf '%s\n' "${SUDO_EXEC_PASSWORD}" | sudo -S -v >/dev/null 2>&1; then
      log_error "sudo password validation failed"
      return 1
    fi
    log_ok "sudo password accepted"
    start_sudo_keepalive
    return 0
  fi

  log_error "sudo required but no TTY, broker, or passwordless sudo"
  log_error "Start broker: python3 ~/ModuleHub-cms/scripts/sudo_broker.py"
  return 1
}

sudo_exec_run() {
  local command="$1"
  if [[ "${DEPLOY_DRY_RUN}" == true ]]; then
    log_info "[dry-run] sudo: ${command}"
    return 0
  fi

  case "${SUDO_EXEC_MODE}" in
    passwordless)
      sudo bash -c "${command}"
      ;;
    broker)
      python3 "${SUDO_EXEC_BROKER_SCRIPT}" "${command}"
      local exit_code=$?
      if [[ "${exit_code}" -ne 0 ]]; then
        return "${exit_code}"
      fi
      ;;
    password)
      printf '%s\n' "${SUDO_EXEC_PASSWORD}" | sudo -S bash -c "${command}"
      ;;
    *)
      log_error "sudo mode not initialized — call detect_sudo_mode first"
      return 1
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ $# -lt 1 ]]; then
    echo "Usage: bash scripts/lib/sudo-exec.sh '<shell command>'" >&2
    exit 2
  fi
  detect_sudo_mode
  sudo_exec_run "$*"
fi
