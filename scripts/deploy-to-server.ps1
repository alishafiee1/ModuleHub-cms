# Deploy ModuleHub CMS to ubu-ash (192.168.88.50)
# Requires: OpenSSH scp, optional rsync
param(
    [string]$Server = "ash@192.168.88.50",
    [string]$LocalPath = "D:\2 Curent project git\ModuleHub-cms",
    [switch]$Install
)

$ErrorActionPreference = "Stop"
$RemoteHome = "/home/ash/ModuleHub-cms"

Write-Host "[*] Syncing project to ${Server}:${RemoteHome} ..."
# Exclude heavy/generated dirs; server will npm ci with metric toggle
$exclude = @("node_modules", ".git", "dist", "data")
$tarArgs = Get-ChildItem $LocalPath | Where-Object { $exclude -notcontains $_.Name }

# Use scp for scripts update (lightweight)
scp -r "$LocalPath\scripts" "${Server}:${RemoteHome}/"
scp -r "$LocalPath\config" "${Server}:${RemoteHome}/"
scp -r "$LocalPath\core" "${Server}:${RemoteHome}/"
scp -r "$LocalPath\standalone-modules" "${Server}:${RemoteHome}/"
scp "$LocalPath\package.json" "$LocalPath\package-lock.json" "$LocalPath\tsconfig.json" "${Server}:${RemoteHome}/"

if ($Install) {
    Write-Host "[*] Running full install on server (sudo password required) ..."
    Write-Host "    Tip: metric toggles to free WAN (enp63s0) for npm/apt"
    ssh -t $Server "bash ${RemoteHome}/scripts/server-install.sh ${RemoteHome}"
} else {
    Write-Host "[*] Files synced. Run install on server:"
    Write-Host "    ssh -t $Server 'bash ${RemoteHome}/scripts/server-install.sh'"
}
