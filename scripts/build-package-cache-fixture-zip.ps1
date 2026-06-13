# purpose --- Build flat ZIP for package-cache fixture (Windows) ------
$ErrorActionPreference = "Stop"

$AppDir = if ($env:MODULEHUB_APP_DIR) { $env:MODULEHUB_APP_DIR } else { Split-Path $PSScriptRoot -Parent }
$FixtureDir = Join-Path $AppDir "tests\fixtures\modules\package-cache-test"
$OutputZip = Join-Path $AppDir "tests\fixtures\modules\package-cache-test.zip"

if (-not (Test-Path (Join-Path $FixtureDir "package.json"))) {
  Write-Error "Missing fixture: $FixtureDir\package.json"
}

if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force }
Compress-Archive -Path (Join-Path $FixtureDir "*") -DestinationPath $OutputZip -Force

Write-Host "[build-package-cache] Created $OutputZip"
$Content = (Get-Content (Join-Path $FixtureDir "package.json") -Raw).Replace("`r`n", "`n")
$Payload = "package.json:$Content"
$Hash = [System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($Payload))
).Replace("-", "").ToLower()
Write-Host "[build-package-cache] Expected manifest hash: $Hash"
