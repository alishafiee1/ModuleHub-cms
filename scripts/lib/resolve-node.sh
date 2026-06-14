#!/usr/bin/env bash
# purpose --- Resolve Node.js binary for build and systemd (prefer nvm Node 20) ------
set -euo pipefail

RESOLVE_NODE_MIN_MAJOR="${RESOLVE_NODE_MIN_MAJOR:-20}"

resolve_service_home() {
  local service_user="${MODULEHUB_SERVICE_USER:-${USER:-$(whoami)}}"
  local passwd_home=""
  passwd_home="$(getent passwd "${service_user}" 2>/dev/null | cut -d: -f6 || true)"
  if [[ -n "${passwd_home}" && -d "${passwd_home}" ]]; then
    printf '%s' "${passwd_home}"
    return 0
  fi
  printf '%s' "${HOME}"
}

resolve_node_binary() {
  local candidate=""
  local service_home=""
  service_home="$(resolve_service_home)"
  if [[ -s "${service_home}/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    source "${service_home}/.nvm/nvm.sh"
    candidate="$(nvm which "${RESOLVE_NODE_MIN_MAJOR}" 2>/dev/null || true)"
    if [[ -n "${candidate}" && -x "${candidate}" ]]; then
      printf '%s' "${candidate}"
      return 0
    fi
  fi

  candidate="$(command -v node 2>/dev/null || true)"
  if [[ -n "${candidate}" && -x "${candidate}" ]]; then
    printf '%s' "${candidate}"
    return 0
  fi

  return 1
}

resolve_node_version_label() {
  local node_bin=""
  node_bin="$(resolve_node_binary)" || return 1
  "${node_bin}" -v 2>/dev/null | tr -d 'v'
}

ensure_node_ready() {
  local node_bin=""
  node_bin="$(resolve_node_binary)" || {
    echo "[resolve-node] ERROR: Node ${RESOLVE_NODE_MIN_MAJOR}+ not found (install nvm + Node 20)" >&2
    return 1
  }
  local major=""
  major="$("${node_bin}" -p "process.versions.node.split('.')[0]" 2>/dev/null || true)"
  if [[ -z "${major}" || "${major}" -lt "${RESOLVE_NODE_MIN_MAJOR}" ]]; then
    echo "[resolve-node] ERROR: ${node_bin} is too old (need ${RESOLVE_NODE_MIN_MAJOR}+)" >&2
    return 1
  fi
  export RESOLVED_NODE_BIN="${node_bin}"
  return 0
}
