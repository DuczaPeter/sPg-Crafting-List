#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'validate-m5.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& node (Join-Path $PSScriptRoot 'run-m6-tests.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'M6_VALIDATION_PASS'
