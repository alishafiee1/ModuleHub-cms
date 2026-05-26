#!/usr/bin/env bash
# ModuleHub CMS — Ubuntu Server install script (22.04 / 24.04)
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo bash scripts/ubuntu-install.sh"
  exit 1
fi

echo "[*] Updating apt..."
apt-get update -qq

echo "[*] Installing dependencies..."
apt-get install -y curl ca-certificates gnupg ufw

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo "[*] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v docker >/dev/null; then
  echo "[*] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if ! id modulehub >/dev/null 2>&1; then
  useradd -r -m -d /opt/modulehub-cms -s /bin/bash modulehub
fi
usermod -aG docker modulehub

mkdir -p /var/lib/modulehub /opt/modulehub-cms
chown -R modulehub:modulehub /var/lib/modulehub /opt/modulehub-cms

echo "[*] Copy project to /opt/modulehub-cms and run: npm ci && npm run build"
echo "[*] Install systemd unit: cp config/systemd/modulehub-cms.service /etc/systemd/system/"
echo "[*] systemctl enable --now modulehub-cms"
echo "[+] Done. Log in as modulehub for docker group: su - modulehub"
