#!/usr/bin/env bash
# Bootstrap Node 20 via nvm using free WAN interface (no sudo for downloads)
set -euo pipefail

PROJECT_DIR="${1:-/home/ash/ModuleHub-cms}"
FREE_IF="${FREE_INTERFACE:-enp63s0}"
CURL_WRAP="${PROJECT_DIR}/.curl-free"

mkdir -p "${CURL_WRAP}"
cat > "${CURL_WRAP}/curl" <<EOF
#!/usr/bin/env bash
exec /usr/bin/curl --interface ${FREE_IF} "\$@"
EOF
chmod +x "${CURL_WRAP}/curl"
export PATH="${CURL_WRAP}:${PATH}"

export NVM_DIR="${HOME}/.nvm"
if [ ! -d "${NVM_DIR}" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"

nvm install 20
nvm use 20
node -v
echo "[+] Node ready. For npm ci run server-install.sh (needs sudo for metric toggle)"
