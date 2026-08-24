#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) {
        throw "A V003-C003 kapu csak a develop/V003 ágon futhat. Aktuális: $branch"
    }

    & node '.\tools\run-v003-c003-tests.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\audit-v003-material-names.mjs' '--output=test-artifacts/V003-C003/material-name-audit.json'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-v003-farm.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) {
        throw "A V002 tag dereferált commitja eltér: $v002Commit"
    }
    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) {
        throw "A stabil V002 HTML SHA-256 értéke eltér: $v002Sha256"
    }
    $v003Tags = @(& git tag --list 'V003*')
    if ($v003Tags.Count -gt 0) {
        throw "A fejlesztési ciklus alatt V003 tag jelent meg: $($v003Tags -join ', ')"
    }

    Write-Output 'V003_C003_VALIDATION_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
