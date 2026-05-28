# purpose --- Build flat ZIP for phase 4 cache test fixture (Windows) ------
$ErrorActionPreference = "Stop"

$AppDir = if ($env:MODULEHUB_APP_DIR) { $env:MODULEHUB_APP_DIR } else { Split-Path $PSScriptRoot -Parent }
$FixtureDir = Join-Path $AppDir "tests\fixtures\modules\phase4-cache-test"
$OutputZip = Join-Path $AppDir "tests\fixtures\modules\phase4-cache-test.zip"

if (-not (Test-Path (Join-Path $FixtureDir "package.json"))) {
  Write-Error "Missing fixture: $FixtureDir\package.json"
}

if (Test-Path $OutputZip) { Remove-Item $OutputZip -Force }
Compress-Archive -Path (Join-Path $FixtureDir "*") -DestinationPath $OutputZip -Force

Write-Host "[build-phase4-test-zip] Created $OutputZip"
$Content = Get-Content (Join-Path $FixtureDir "package.json") -Raw
$Payload = "package.json:$Content"
$Hash = [System.BitConverter]::ToString(
  [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($Payload))
).Replace("-", "").ToLower()
Write-Host "[build-phase4-test-zip] Expected manifest hash: $Hash"
