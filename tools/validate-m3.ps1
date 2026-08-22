#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot
try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\tools\validate-m2.ps1"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & node ".\tools\run-m3-tests.mjs"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Output 'M3_VALIDATION_PASS'
} finally {
    Pop-Location
}
