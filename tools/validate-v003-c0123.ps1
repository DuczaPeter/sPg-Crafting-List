#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$c0122Baseline = '24b55890a4d97176d756f3f1e3c05f80ee987ab7'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'
$invalidatedManifest = Join-Path $projectRoot 'test-artifacts\V003-C013\release-candidate\candidate-manifest.json'
$invalidatedMarker = Join-Path $projectRoot 'test-artifacts\V003-C013\INVALIDATED_BY_C012.3_RELEASE_BLOCKER.md'

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) { throw "A V003-C012.3 kapu csak a develop/V003 agon futhat. Aktualis: $branch" }
    & git merge-base --is-ancestor $c0122Baseline HEAD
    if ($LASTEXITCODE -ne 0) { throw "A C012.2 baseline nem ose az aktualis HEAD-nek: $c0122Baseline" }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-v003-c0122.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & node '.\tools\run-v003-c0123-tests.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if (-not (Test-Path -LiteralPath $invalidatedManifest)) { throw 'A felbehagyott C013 candidate invalidacios manifestje hianyzik.' }
    if (-not (Test-Path -LiteralPath $invalidatedMarker)) { throw 'A felbehagyott C013 candidate invalidacios markerje hianyzik.' }
    $manifest = Get-Content -Raw -LiteralPath $invalidatedManifest | ConvertFrom-Json
    if ($manifest.status -ne 'INVALIDATED_BY_C012.3_RELEASE_BLOCKER') { throw "A C013 candidate nincs invalidalva: $($manifest.status)" }

    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) { throw "A V002 tag dereferalt commitja elter: $v002Commit" }
    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) { throw "A stabil V002 HTML SHA-256 erteke elter: $v002Sha256" }
    $v003Tags = @(& git tag --list 'V003*')
    if ($v003Tags.Count -gt 0) { throw "A javitasi ciklus alatt V003 tag jelent meg: $($v003Tags -join ', ')" }
    if (Test-Path -LiteralPath (Join-Path $projectRoot 'releases\V003')) { throw 'A javitasi ciklus alatt releases/V003 mappa jelent meg.' }

    Write-Output 'V003_C0123_VALIDATION_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output "C0122_BASELINE=$c0122Baseline"
    Write-Output 'RECIPE_RULE_USER_CONSTRAINT_SEPARATION=PASS'
    Write-Output 'METAMATERIAL_152_TARGET_Q800=PASS'
    Write-Output 'FIXED_RECIPE_BACKWARD_COMPATIBILITY=PASS'
    Write-Output 'FIXED_TARGET_Q_AND_HIGHEST_Q=PASS'
    Write-Output 'MISSING_QUALITY_AND_MAX_CRAFTABLE=PASS'
    Write-Output 'COMBINED_FINAL_STANDALONE_PARITY=PASS'
    Write-Output 'PRIORITY_NO_DOUBLE_COUNT=PASS'
    Write-Output 'PERSISTENCE_BACKUP_RESTORE=PASS'
    Write-Output 'FULL_C001_C0122_M1_M61_C04_REGRESSION=PASS'
    Write-Output 'C013_CANDIDATE=INVALIDATED_BY_C012.3_RELEASE_BLOCKER'
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
