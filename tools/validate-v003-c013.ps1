#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$baselineCommit = 'e519b0889a65b70e8ae6d8be6d869b52e206eb99'
$candidateRelativePath = 'test-artifacts\V003-C013\release-candidate\sPg Crafting List.html'
$candidatePath = Join-Path $projectRoot $candidateRelativePath
$candidateManifestPath = Join-Path $projectRoot 'test-artifacts\V003-C013\release-candidate\candidate-manifest.json'
$historicalManifestPath = Join-Path $projectRoot 'test-artifacts\V003-C013\release-candidate\invalidated-candidate-manifest.json'
$currentInvalidationMarker = Join-Path $projectRoot 'test-artifacts\V003-C013\INVALIDATED_BY_C012.5_RELEASE_BLOCKER.md'
$automatedEvidencePath = Join-Path $projectRoot 'test-artifacts\V003-C013\automated-evidence.json'
$expectedCandidateSha = 'a1c3b86f6cda2ac992d4ee62d6186cce0c5dc2df499cfc7d85892b471fccb807'
$expectedCandidateBytes = 756582
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$temporaryCandidatePath = Join-Path $env:TEMP ('spg-v003-c013-rebuild-' + [guid]::NewGuid().ToString('N') + '.html')

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) { throw "A V003-C013 kapu csak a develop/V003 agon futhat. Aktualis: $branch" }
    & git merge-base --is-ancestor $baselineCommit HEAD
    if ($LASTEXITCODE -ne 0) { throw "A C012.4 baseline nem ose az aktualis HEAD-nek: $baselineCommit" }
    & git diff --quiet $baselineCommit -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Az alkalmazaskod elter a C012.4 baseline-tol; C013 STOP.' }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-baseline.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\build-v003-c013-candidate.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    & node '.\tools\build-v003-c013-candidate.mjs' "--output=$temporaryCandidatePath"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    if (-not (Test-Path -LiteralPath $candidatePath)) { throw 'A C013 candidate hianyzik.' }
    $candidateHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $temporaryHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $temporaryCandidatePath).Hash.ToLowerInvariant()
    $candidateBytes = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateHash -ne $expectedCandidateSha -or $candidateBytes -ne $expectedCandidateBytes) { throw "A C013 candidate byte-azonossaga elter: $candidateBytes / $candidateHash" }
    if ($candidateHash -ne $temporaryHash -or (Get-Item -LiteralPath $temporaryCandidatePath).Length -ne $candidateBytes) { throw 'A C013 candidate determinisztikus ujrageneralasa elter.' }

    & node '.\tools\run-v003-c013-tests.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $manifest = Get-Content -Raw -LiteralPath $candidateManifestPath | ConvertFrom-Json
    if ($manifest.baselineCommit -ne $baselineCommit -or $manifest.sha256 -ne $candidateHash -or [int64]$manifest.bytes -ne $candidateBytes) { throw 'A C013 candidate manifest elter a tenyleges artifacttol.' }
    if ($manifest.status -ne 'INVALIDATED_BY_C012.5_RELEASE_BLOCKER' -or $manifest.manualFileGate -ne 'NOT_RUN_CANDIDATE_INVALIDATED_BEFORE_USER_GATE' -or -not $manifest.mustNeverBeReleased) { throw 'A C013 candidate C012.5 invalidacios statusza elter.' }
    if (-not (Test-Path -LiteralPath $currentInvalidationMarker)) { throw 'A C012.5 invalidacios marker hianyzik.' }
    $historical = Get-Content -Raw -LiteralPath $historicalManifestPath | ConvertFrom-Json
    if ($historical.status -ne 'INVALIDATED_BY_C012.3_RELEASE_BLOCKER' -or $historical.historicalSha256 -ne '388a9c04ff6c1a8c9cca06d82f0c226636e0180ba69ced58b59d5284cca4d98e') { throw 'A torteneti invalidalt C013 candidate bizonyiteka elter.' }
    $automatedEvidence = Get-Content -Raw -LiteralPath $automatedEvidencePath | ConvertFrom-Json
    if ($automatedEvidence.fullRegression.C001_C012_4 -ne 'PASS' -or $automatedEvidence.fullRegression.M1_M6_1 -ne 'PASS' -or $automatedEvidence.candidateValidity -ne 'INVALIDATED_BY_C012.5_RELEASE_BLOCKER') { throw 'A megorzott C013 PASS/invalidation evidence elter.' }

    $v001Commit = (& git rev-parse 'V001^{commit}').Trim()
    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($v001Commit -ne $expectedV001Commit) { throw "A V001 tag commitja elter: $v001Commit" }
    if ($v002Commit -ne $expectedV002Commit) { throw "A V002 tag commitja elter: $v002Commit" }
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'A V001 fagyasztott artifact integritasa elter.' }
    if ($v002Sha -ne $expectedV002Sha) { throw 'A V002 fagyasztott artifact integritasa elter.' }
    if (@(& git tag --list 'V003*').Count -gt 0) { throw 'V003 tag jelent meg a C013 alatt.' }
    if (Test-Path -LiteralPath '.\releases\V003') { throw 'Stabil releases/V003 mappa jelent meg a C013 alatt.' }

    Write-Output 'V003_C013_INVALIDATION_CLOSURE_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output "BASELINE_COMMIT=$baselineCommit"
    Write-Output "CANDIDATE_PATH=$candidateRelativePath"
    Write-Output "CANDIDATE_BYTES=$candidateBytes"
    Write-Output "CANDIDATE_SHA256=$candidateHash"
    Write-Output 'CANDIDATE_DETERMINISM=PASS'
    Write-Output 'FULL_C001_C0124_M1_M61_C04_REGRESSION=PRESERVED_PASS_EVIDENCE_NOT_RERUN'
    Write-Output 'QUALITY_ALLOCATION_VERSION_MINING_RADAR_COLOR_NAMING_UEX=PASS'
    Write-Output 'STANDALONE_BASELINE_AND_Q900=PASS'
    Write-Output "V001_TAG_COMMIT=$v001Commit"
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha"
    Write-Output 'USER_MANUAL_EXACT_CANDIDATE_FILE_GATE=NOT_RUN'
    Write-Output 'CANDIDATE_STATUS=INVALIDATED_BY_C012.5_RELEASE_BLOCKER'
    Write-Output 'C012_5=NOT_STARTED'
} finally {
    if (Test-Path -LiteralPath $temporaryCandidatePath) { Remove-Item -LiteralPath $temporaryCandidatePath -Force }
    Pop-Location
}
