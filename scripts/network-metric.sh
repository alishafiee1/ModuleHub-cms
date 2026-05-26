#!/usr/bin/env bash
# Dual-WAN metric toggle — route apt/npm/curl through free internet (enp63s0)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=sudo-run.sh
source "${SCRIPT_DIR}/sudo-run.sh"

FREE_INTERFACE="${FREE_INTERFACE:-enp63s0}"
FREE_GATEWAY="${FREE_GATEWAY:-192.168.88.1}"
FREE_METRIC="${FREE_METRIC:-50}"

free_internet_on() {
  if ip route show | grep -q "default via ${FREE_GATEWAY} dev ${FREE_INTERFACE} metric ${FREE_METRIC}"; then
    echo "[metric] Free internet route already active (metric ${FREE_METRIC})"
    return 0
  fi
  echo "[metric] Adding default route via ${FREE_GATEWAY} dev ${FREE_INTERFACE} metric ${FREE_METRIC}..."
  run_sudo ip route add default via "${FREE_GATEWAY}" dev "${FREE_INTERFACE}" metric "${FREE_METRIC}"
  echo "[metric] Free internet is PRIMARY for downloads"
}

free_internet_off() {
  echo "[metric] Removing temporary default route (metric ${FREE_METRIC})..."
  run_sudo ip route del default via "${FREE_GATEWAY}" dev "${FREE_INTERFACE}" metric "${FREE_METRIC}" 2>/dev/null || true
  echo "[metric] Default metrics restored (ADSL metric 100 primary)"
}

free_internet_status() {
  echo "=== default routes ==="
  ip route | grep ^default || true
  echo "=== curl test ==="
  curl -4 -s --max-time 8 -o /dev/null -w "registry.npmjs.org HTTP %{http_code}\n" https://registry.npmjs.org || echo "FAIL"
}

case "${1:-}" in
  on)  free_internet_on ;;
  off) free_internet_off ;;
  status) free_internet_status ;;
  *)
    echo "Usage: $0 {on|off|status}"
    exit 1
    ;;
esac
