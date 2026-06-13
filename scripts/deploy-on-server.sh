#!/usr/bin/env bash
# purpose --- Deploy ModuleHub CMS on server after git pull: deps, build, systemd, health ---
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${MODULEHUB_APP_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
SERVICE_NAME="${MODULEHUB_SERVICE:-modulehub-cms}"
SERVICE_FILE="${APP_DIR}/config/systemd/${SERVICE_NAME}.service"
SYSTEMD_DEST="/etc/systemd/system/${SERVICE_NAME}.service"
HEALTH_URL="${MODULEHUB_HEALTH_URL:-http://127.0.0.1:4000/health}"
SKIP_PULL=false
SKIP_BUILD=false
SKIP_RESTART=false
DRY_RUN=false
SUDO_KEEPALIVE_PID=""

usage() {
  cat <<'EOF'
Usage: deploy-on-server.sh [options]

Run on the server inside /opt/modulehub-cms (or set MODULEHUB_APP_DIR).

Options:
  --skip-pull     Skip git pull (code already updated)
  --skip-build    Skip npm run build
  --skip-restart  Skip systemd install/restart and health check (orchestrator handles restart)
  --dry-run       Print steps without executing
  -h, --help     Show this help

Environment:
  MODULEHUB_APP_DIR      App root (default: /opt/modulehub-cms)
  MODULEHUB_SERVICE      systemd unit name (default: modulehub-cms)
  MODULEHUB_HEALTH_URL   Health check URL (default: http://127.0.0.1:4000/health)
EOF
}

log() {
  printf '[deploy] %s\n' "$*"
}

run() {
  if [[ "$DRY_RUN" == true ]]; then
    log "[dry-run] $*"
    return 0
  fi
  "$@"
}

ensure_sudo() {
  if [[ "$DRY_RUN" == true ]]; then
    return 0
  fi
  if ! sudo -n true 2>/dev/null; then
    echo "[deploy] sudo password required:"
    sudo -v || exit 1
  fi
  # Keep sudo session alive during long npm install/build
  (
    while true; do
      sleep 60
      sudo -n true || exit
      kill -0 "$$" 2>/dev/null || exit
    done
  ) 2>/dev/null &
  SUDO_KEEPALIVE_PID=$!
}

cleanup() {
  if [[ -n "$SUDO_KEEPALIVE_PID" ]]; then
    kill "$SUDO_KEEPALIVE_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-pull) SKIP_PULL=true; shift ;;
    --skip-build) SKIP_BUILD=true; shift ;;
    --skip-restart) SKIP_RESTART=true; shift ;;
    --skip-wan)
      log "WARN: --skip-wan ignored (WAN toggling removed)"
      shift
      ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ! -d "$APP_DIR" ]]; then
  echo "[deploy] ERROR: APP_DIR not found: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"
log "Working directory: $APP_DIR"

if [[ "$SKIP_PULL" != true ]]; then
  if [[ -d .git ]]; then
    log "git pull..."
    run git pull --ff-only
  else
    log "WARN: not a git repo — skipping git pull"
  fi
fi

if [[ ! -f package.json ]]; then
  echo "[deploy] ERROR: package.json not found. Implement core first (openspec tasks phase 0)." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "[deploy] WARN: .env missing — copy from .env.example and set SESSION_SECRET / ADMIN_PASSWORD_HASH" >&2
fi

if [[ "$SKIP_BUILD" != true ]]; then
  if [[ -f package-lock.json ]]; then
    log "npm ci (incl. dev — for tsc build)..."
    run npm ci
  else
    log "WARN: package-lock.json missing — using npm install"
    run npm install
  fi
  if grep -q '"build"' package.json; then
    log "npm run build..."
    run npm run build
  else
    log "WARN: no npm run build script — skipping build"
  fi
  log "npm prune --omit=dev (runtime only)..."
  run npm prune --omit=dev
elif [[ -f package-lock.json ]]; then
  log "npm ci --omit=dev..."
  run npm ci --omit=dev
else
  log "WARN: package-lock.json missing — using npm install --omit=dev"
  run npm install --omit=dev
fi

if [[ ! -f dist/core/src/server/index.js ]]; then
  echo "[deploy] ERROR: build output missing: dist/core/src/server/index.js" >&2
  exit 1
fi

if [[ "$SKIP_RESTART" != true ]]; then
  ensure_sudo

  if [[ -f "$SERVICE_FILE" ]]; then
    log "Installing systemd unit..."
    run sudo cp "$SERVICE_FILE" "$SYSTEMD_DEST"
    run sudo systemctl daemon-reload
    run sudo systemctl enable "$SERVICE_NAME"
  else
    log "WARN: service file not found: $SERVICE_FILE"
  fi

  log "Restarting $SERVICE_NAME..."
  run sudo systemctl restart "$SERVICE_NAME"

  if [[ "$DRY_RUN" != true ]]; then
    sleep 2
    if curl -sf "$HEALTH_URL" >/dev/null; then
      log "Health check OK: $HEALTH_URL"
    else
      echo "[deploy] ERROR: health check failed: $HEALTH_URL" >&2
      sudo systemctl status "$SERVICE_NAME" --no-pager || true
      exit 1
    fi
  fi
else
  log "Skipping systemd restart and health check (--skip-restart)"
fi

ENV_FILE="${APP_DIR}/.env"
if [[ -f "$ENV_FILE" ]] && grep -q '^MODULEHUB_DEV_SUPER_ADMIN=1' "$ENV_FILE" 2>/dev/null; then
  log "WARN: MODULEHUB_DEV_SUPER_ADMIN=1 is set in .env — disable before production go-live (bash scripts/disable-dev-admin-on-server.sh)"
fi

log "Deploy finished successfully."
