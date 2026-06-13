#!/usr/bin/env bash
# purpose --- Temporarily prefer secondary NIC as system default route for npm/git tests ------
# DEPRECATED --- prefer bash scripts/run-with-free-wan.sh (per-command metric toggle) ------
set -euo pipefail

INTERFACE_FREE="${MODULEHUB_FREE_INTERFACE:-enp63s0}"
INTERFACE_FILTERED="${MODULEHUB_FILTERED_INTERFACE:-ens4}"
BACKUP_DIR="${HOME}/.modulehub-route-backups"
ACTION="${1:-}"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/manual/temp-free-wan-default.sh apply
  bash scripts/manual/temp-free-wan-default.sh restore
  bash scripts/manual/temp-free-wan-default.sh status

LEGACY: prefer bash scripts/run-with-free-wan.sh for git/npm.
Requires sudo (sudo_broker.py or ssh -t). Reversible via restore.
EOF
}

run_sudo() {
  local command_text="$1"
  local script_root="${MODULEHUB_SOURCE:-${HOME}/ModuleHub-cms}/scripts"
  if [[ -f "${script_root}/run_via_broker.py" ]]; then
    python3 "${script_root}/run_via_broker.py" "${command_text}" 2>/dev/null && return 0
  fi
  sudo bash -c "${command_text}"
}

apply_free_wan() {
  mkdir -p "${BACKUP_DIR}"
  local backup_file="${BACKUP_DIR}/routes-$(date +%Y%m%d-%H%M%S).txt"
  ip route show default | tee "${backup_file}"
  echo "[temp-free-wan] backup=${backup_file}"

  while ip route show default | grep -q "dev ${INTERFACE_FILTERED} "; do
    local line
    line="$(ip route show default | grep "dev ${INTERFACE_FILTERED} " | head -1)"
    local via dev metric
    via="$(echo "${line}" | awk '/via/ {print $3}')"
    dev="$(echo "${line}" | awk '/dev/ {print $5}')"
    metric="$(echo "${line}" | awk '/metric/ {print $7}')"
    echo "[temp-free-wan] removing: ${line}"
    run_sudo "ip route del default via ${via} dev ${dev} metric ${metric}"
  done

  while ip route show default | grep "dev ${INTERFACE_FREE} " | grep -q metric; do
    local line
    line="$(ip route show default | grep "dev ${INTERFACE_FREE} " | head -1)"
    local via dev metric
    via="$(echo "${line}" | awk '/via/ {print $3}')"
    dev="$(echo "${line}" | awk '/dev/ {print $5}')"
    metric="$(echo "${line}" | awk '/metric/ {print $7}')"
    echo "[temp-free-wan] lowering metric: ${dev} ${metric} -> 50"
    run_sudo "ip route del default via ${via} dev ${dev} metric ${metric}" || true
    run_sudo "ip route add default via ${via} dev ${dev} metric 50"
    break
  done

  echo "[temp-free-wan] current defaults:"
  ip route show default
}

restore_routes() {
  local latest
  latest="$(ls -1t "${BACKUP_DIR}"/routes-*.txt 2>/dev/null | head -1 || true)"
  if [[ -z "${latest}" ]]; then
    echo "[temp-free-wan] ERROR: no backup in ${BACKUP_DIR}" >&2
    exit 1
  fi
  echo "[temp-free-wan] restoring from ${latest}"
  while read -r line; do
    [[ -z "${line}" ]] && continue
    local via dev metric
    via="$(echo "${line}" | awk '/via/ {print $3}')"
    dev="$(echo "${line}" | awk '/dev/ {print $5}')"
    metric="$(echo "${line}" | awk '/metric/ {print $7}')"
    run_sudo "ip route add default via ${via} dev ${dev} metric ${metric}" 2>/dev/null || \
      run_sudo "ip route change default via ${via} dev ${dev} metric ${metric}" 2>/dev/null || true
  done < "${latest}"
  ip route show default
}

show_status() {
  ip route show default
  curl -s -o /dev/null -w "registry.npmjs.org: %{http_code}\n" --max-time 12 https://registry.npmjs.org/ || true
  curl -s -o /dev/null -w "github.com: %{http_code}\n" --max-time 12 https://github.com/ || true
}

case "${ACTION}" in
  apply) apply_free_wan ;;
  restore) restore_routes ;;
  status) show_status ;;
  -h|--help|help) usage ;;
  *) usage; exit 1 ;;
esac
