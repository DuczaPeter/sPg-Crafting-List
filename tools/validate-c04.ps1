#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'validate-m61.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& node (Join-Path $PSScriptRoot 'verify-embedded-application-css.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& node (Join-Path $PSScriptRoot 'run-c04-file-export-tests.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'C04_VALIDATION_PASS'
