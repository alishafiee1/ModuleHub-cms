#!/usr/bin/env bash
# DEPRECATED --- use bash scripts/deploy-full.sh (interactive, git-aware) ------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[DEPRECATED] server-fix-deploy.sh — use: bash scripts/deploy-full.sh --yes" >&2
exec bash "${SCRIPT_DIR}/deploy-full.sh" --yes "$@"
