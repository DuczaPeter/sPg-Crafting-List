$ErrorActionPreference = 'Stop'

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'validate-v001-release.ps1')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& node (Join-Path $PSScriptRoot 'verify-v002-release.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& node (Join-Path $PSScriptRoot 'probe-v002-live-apis.mjs')
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$projectRoot = Split-Path -Parent $PSScriptRoot
$v001Tag = (& git -C $projectRoot rev-list -n 1 V001).Trim()
if ($LASTEXITCODE -ne 0 -or $v001Tag -ne 'b22dbc3c2ef0765e30aa3806537854298c873dff') {
    throw "A V001 tag megvaltozott: $v001Tag"
}

$v001ReleaseDiff = @(& git -C $projectRoot diff --name-only V001 -- 'releases/V001')
if ($LASTEXITCODE -ne 0 -or $v001ReleaseDiff.Count -ne 0) {
    throw "A fagyasztott V001 release megvaltozott: $($v001ReleaseDiff -join ', ')"
}

Write-Output 'V002_RELEASE_VALIDATION_PASS'
Write-Output 'Automated regression: PASS'
Write-Output 'Single-file release gate: PASS'
Write-Output 'Live Wiki and UEX API: PASS'
Write-Output 'V001 unchanged: PASS'
