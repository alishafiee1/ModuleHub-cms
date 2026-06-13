#!/usr/bin/env bash
# DEPRECATED --- use scripts/manual/temp-free-wan-default.sh ------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/manual/temp-free-wan-default.sh" "$@"
