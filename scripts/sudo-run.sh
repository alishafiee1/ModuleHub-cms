#!/usr/bin/env bash
# Run sudo via 3x-ui broker when available, else plain sudo
run_sudo() {
  local broker="${HOME}/3x-ui/run_via_broker.py"
  local sock="${HOME}/3x-ui/sudo_broker.sock"
  if [ -f "$broker" ] && [ -S "$sock" ]; then
    local result exit_code
    result=$(python3 "$broker" "$*" 2>&1) || true
    exit_code=$(printf '%s' "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('exit_code',1))" 2>/dev/null || echo 1)
    if [ "$exit_code" != "0" ]; then
      printf '%s\n' "$result" >&2
      return "$exit_code"
    fi
    return 0
  fi
  sudo "$@"
}
