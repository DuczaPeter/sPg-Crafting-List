$ErrorActionPreference = 'Stop'

& "$PSScriptRoot\validate-m1.ps1"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& node "$PSScriptRoot\run-m2-tests.mjs"
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Output 'M2_VALIDATION_PASS'
