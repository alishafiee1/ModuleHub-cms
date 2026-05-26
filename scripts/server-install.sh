#!/usr/bin/env bash
# Full server install with Dual-WAN metric toggle for package downloads
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=sudo-run.sh
source "${SCRIPT_DIR}/sudo-run.sh"

PROJECT_SRC="${1:-/home/ash/ModuleHub-cms}"
PROJECT_DST="/opt/modulehub-cms"
ENV_FILE="${PROJECT_DST}/.env"

load_nvm_node() {
  export NVM_DIR="${HOME}/.nvm"
  if [ -s "${NVM_DIR}/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "${NVM_DIR}/nvm.sh"
    nvm use 20 2>/dev/null || nvm use default 2>/dev/null || true
  fi
}

cleanup() {
  bash "${SCRIPT_DIR}/network-metric.sh" off || true
}
trap cleanup EXIT

echo "=== ModuleHub CMS install (Dual-WAN aware) ==="

echo "[0] Enable free internet for downloads..."
bash "${SCRIPT_DIR}/network-metric.sh" on
bash "${SCRIPT_DIR}/network-metric.sh" status

echo "[1/6] Node.js + npm..."
load_nvm_node
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "nvm not ready — installing npm via apt..."
  run_sudo apt-get install -y npm
  load_nvm_node
fi
if ! command -v npm >/dev/null; then
  echo "ERROR: npm not found. Run: bash scripts/user-bootstrap-node.sh"
  exit 1
fi
node -v
npm -v

echo "[2/6] Sync to ${PROJECT_DST}..."
run_sudo mkdir -p /var/lib/modulehub "${PROJECT_DST}"
run_sudo rsync -a --delete \
  --exclude node_modules \
  --exclude .env \
  --exclude data \
  "${PROJECT_SRC}/" "${PROJECT_DST}/"
run_sudo chown -R ash:ash "${PROJECT_DST}" /var/lib/modulehub
run_sudo usermod -aG docker ash 2>/dev/null || true

echo "[3/6] Environment file..."
if [ ! -f "$ENV_FILE" ] || ! grep -q '^PORT=' "$ENV_FILE" 2>/dev/null; then
  SECRET=$(openssl rand -hex 24)
  PASS=$(openssl rand -base64 18)
  # Write as ash — broker cannot relay heredoc/stdin to tee reliably
  cat > "$ENV_FILE" <<EOF
PORT=4000
NODE_ENV=production
ADMIN_PASSWORD=${PASS}
ADMIN_ROLE=admin
SESSION_SECRET=${SECRET}
MODULES_JSON_PATH=/var/lib/modulehub/modules.json
STATIC_MODULES_DIR=${PROJECT_DST}/static-modules
STANDALONE_MODULES_DIR=${PROJECT_DST}/standalone-modules
DOCKER_SOCKET=unix:///var/run/docker.sock
EOF
  chmod 600 "$ENV_FILE"
  echo "[!] Generated ADMIN_PASSWORD in ${ENV_FILE}"
fi

echo "[4/6] npm ci && build..."
cd "$PROJECT_DST"
npm ci
npm run build

echo "[5/6] systemd (user ash)..."
load_nvm_node
NODE_PATH="$(command -v node)"
SERVICE_FILE="${PROJECT_DST}/config/systemd/modulehub-cms.service"
# Edit as ash — broker splits sed patterns containing '|'
sed -i "s|^User=.*|User=ash|" "$SERVICE_FILE"
sed -i "s|^Group=.*|Group=ash|" "$SERVICE_FILE"
sed -i "s|^ExecStart=.*|ExecStart=${NODE_PATH} ${PROJECT_DST}/dist/core/src/server/index.js|" "$SERVICE_FILE"
run_sudo cp "$SERVICE_FILE" /etc/systemd/system/modulehub-cms.service
run_sudo systemctl daemon-reload
run_sudo systemctl enable modulehub-cms
run_sudo systemctl restart modulehub-cms

echo "[6/6] Nginx decoy proxy..."
run_sudo bash "${PROJECT_DST}/scripts/apply-nginx-decoy.sh"

echo "[6b] UFW — admin port 4000 (LAN only)..."
run_sudo ufw allow from 192.168.88.0/24 to any port 4000 proto tcp comment 'ModuleHub-admin-LAN' 2>/dev/null || true
run_sudo ufw allow from 192.168.10.0/24 to any port 4000 proto tcp comment 'ModuleHub-admin-ADSL-LAN' 2>/dev/null || true

echo "[+] Install complete"
run_sudo systemctl is-active modulehub-cms || true
curl -4 -s -o /dev/null -w "ModuleHub /admin HTTP %{http_code}\n" http://127.0.0.1:4000/admin || true
curl -4 -sk -o /dev/null -w "Nginx 8443 HTTP %{http_code}\n" https://127.0.0.1:8443/ || true
grep '^ADMIN_PASSWORD=' "$ENV_FILE" || true
