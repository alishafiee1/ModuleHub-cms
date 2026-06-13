#!/usr/bin/env bash
# DEPRECATED --- use scripts/smoke/test-package-cache.sh ------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${SCRIPT_DIR}/smoke/test-package-cache.sh" "$@"
