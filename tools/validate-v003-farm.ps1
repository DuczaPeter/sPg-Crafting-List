#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'

Push-Location $projectRoot
try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-c04.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\probe-v003-farm-api.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) {
        throw "A V002 tag dereferalt commitja elter: $v002Commit"
    }

    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) {
        throw "A stabil V002 HTML SHA-256 erteke elter: $v002Sha256"
    }

    Write-Output 'V003_FARM_VALIDATION_PASS'
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
