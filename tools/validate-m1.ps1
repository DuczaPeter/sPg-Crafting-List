$ErrorActionPreference = 'Stop'

& "$PSScriptRoot\validate-baseline.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& node "$PSScriptRoot\run-m1-tests.mjs"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Output 'M1_VALIDATION_PASS'
