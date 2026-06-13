#!/usr/bin/env bash
# purpose --- Applies egress bandwidth limit (tc) to a Docker container veth — called after docker run ---
# Usage: bash scripts/setup-net-limit.sh <container_name> <net_mbps>
set -euo pipefail

CONTAINER_NAME="${1:?container name required}"
NET_MBPS="${2:?net_mbps required}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found" >&2
  exit 1
fi

PID="$(docker inspect -f '{{.State.Pid}}' "$CONTAINER_NAME" 2>/dev/null || true)"
if [[ -z "$PID" || "$PID" == "0" ]]; then
  echo "Container $CONTAINER_NAME not running" >&2
  exit 1
fi

IFACE="$(nsenter -t "$PID" -n ip -o link show | awk -F': ' '/^2:/ {print $2; exit}' | awk '{print $1}')"
if [[ -z "$IFACE" ]]; then
  echo "Could not resolve container interface for $CONTAINER_NAME" >&2
  exit 1
fi

RATE="${NET_MBPS}mbit"
nsenter -t "$PID" -n tc qdisc replace dev "$IFACE" root tbf rate "$RATE" burst 32kbit latency 400ms
echo "[setup-net-limit] Applied ${RATE} egress on ${CONTAINER_NAME} (${IFACE})"
