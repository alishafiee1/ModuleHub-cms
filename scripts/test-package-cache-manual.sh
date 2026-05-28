#!/usr/bin/env bash
# purpose --- Manual smoke test for package cache (task 5.11) ------
set -euo pipefail

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

mkdir mod
echo '{"name":"cache-test-mod","version":"1.0.0","dependencies":{"left-pad":"1.0.1"}}' > mod/package.json
echo '<html>cache test</html>' > mod/index.html
(cd mod && zip -qr ../test.zip .)

echo "auth: $(curl -s http://127.0.0.1:4000/api/auth/status)"

echo "--- upload 1 (expect installed:true) ---"
START1=$(date +%s)
R1=$(curl -s -X POST http://127.0.0.1:4000/admin/upload -F "zipFile=@test.zip;type=application/zip")
END1=$(date +%s)
echo "elapsed1=$((END1 - START1))s"
echo "$R1"

sleep 1

echo "--- upload 2 (expect installed:false, cache hit) ---"
START2=$(date +%s)
R2=$(curl -s -X POST http://127.0.0.1:4000/admin/upload -F "zipFile=@test.zip;type=application/zip")
END2=$(date +%s)
echo "elapsed2=$((END2 - START2))s"
echo "$R2"

echo "--- /var/cache/modulehub/pkg ---"
ls -la /var/cache/modulehub/pkg/ | head -8
