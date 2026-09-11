#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateSourceHead = 'a6a5d35592d9777c6b740eeb7ec44c4c58b27443'
$expectedCandidateSha = '16f186cc7a0ec3d614dbdd690c1ac448261713ff4fd6c32bdfa8876b68641af5'
$expectedCandidateBytes = 1083886
$candidatePath = Join-Path $projectRoot 'test-artifacts\V004-C010\fresh-release-candidate\sPg Crafting List V004 RC.html'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C010'
$auditEvidencePath = Join-Path $artifactDirectory 'harness-closure-evidence.json'
$summaryPath = Join-Path $artifactDirectory 'harness-target-summary.json'
$requiredRunners = @(
    'run-m4-tests.mjs',
    'run-v003-c0121-tests.mjs',
    'run-v003-c0123-tests.mjs',
    'run-v003-c0125a-tests.mjs',
    'run-v003-c0125b-tests.mjs',
    'run-v003-c0125c1-tests.mjs',
    'run-v003-c0125d1-tests.mjs',
    'run-v003-c0133-tests.mjs',
    'run-v003-c0135-tests.mjs',
    'run-v003-c0137-tests.mjs',
    'run-v004-c0061-tests.mjs'
)

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Invoke-BoundedCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = & $Executable @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($exitCode -ne 0) {
        @($output | Select-Object -Last 40) | ForEach-Object { Write-Output $_ }
        throw "$Name failed with exit code $exitCode"
    }
    Write-Output "PASS $Name"
}

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Push-Location $projectRoot
$previousReleaseMode = $env:SPG_V004_RELEASE_CANDIDATE_MODE
$previousCandidatePath = $env:SPG_V004_VERIFIED_CANDIDATE_PATH
$previousCandidateSha = $env:SPG_V004_VERIFIED_CANDIDATE_SHA256
$previousCandidateBytes = $env:SPG_V004_VERIFIED_CANDIDATE_BYTES
try {
    if ((& git branch --show-current).Trim() -ne 'candidate/V004') { throw 'C010 requires candidate/V004.' }
    & git merge-base --is-ancestor $candidateSourceHead HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The frozen candidate source commit is not an ancestor of HEAD.' }
    & git diff --quiet $candidateSourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Application diff from the frozen candidate source is not zero.' }
    & git diff --quiet $candidateSourceHead -- releases/V001 releases/V002 releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'Protected V001/V002/V003 differs from the frozen candidate source.' }
    & git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) { throw 'C010 requires an empty staged state before targeted validation.' }

    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytesBefore = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateShaBefore -ne $expectedCandidateSha -or $candidateBytesBefore -ne $expectedCandidateBytes) { throw 'Replacement candidate identity mismatch before C010 harness validation.' }
    $candidateBlob = (& git hash-object -- $candidatePath).Trim()
    $sourceBlob = (& git rev-parse "$candidateSourceHead`:sPg Crafting List.html").Trim()
    if ($candidateBlob -ne $sourceBlob) { throw 'Replacement candidate bytes do not match the source commit application blob.' }

    Invoke-BoundedCheck 'shared-loader-syntax' 'node' @('--check', '.\tools\v004-c0081-harness-loader.mjs')
    Invoke-BoundedCheck 'closure-audit-syntax' 'node' @('--check', '.\tools\audit-v004-c0082-harness-closure.mjs')
    foreach ($runner in $requiredRunners) {
        Invoke-BoundedCheck "syntax-$runner" 'node' @('--check', ".\tools\$runner")
    }
    Invoke-BoundedCheck 'm4-remaining-harness-closure-audit' 'node' @('.\tools\audit-v004-c0082-harness-closure.mjs', '--evidence=.\test-artifacts\V004-C010\harness-closure-evidence.json')

    $env:SPG_V004_RELEASE_CANDIDATE_MODE = '1'
    $env:SPG_V004_VERIFIED_CANDIDATE_PATH = $candidatePath
    $env:SPG_V004_VERIFIED_CANDIDATE_SHA256 = $expectedCandidateSha
    $env:SPG_V004_VERIFIED_CANDIDATE_BYTES = [string]$expectedCandidateBytes
    Invoke-BoundedCheck 'm4-combined-backup-targeted' 'node' @('.\tools\run-m4-tests.mjs')
    Invoke-BoundedCheck 'c0125c1-legacy-consumer-targeted' 'node' @('.\tools\run-v003-c0125c1-tests.mjs')
    Invoke-BoundedCheck 'v004-c0061-backup-model-targeted' 'node' @('.\tools\run-v004-c0061-tests.mjs')

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytesAfter = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateShaAfter -ne $candidateShaBefore -or $candidateBytesAfter -ne $candidateBytesBefore) { throw 'Replacement candidate changed during C010 targeted validation.' }
    & git diff --quiet $candidateSourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Application changed during C010 targeted validation.' }
    & git diff --quiet $candidateSourceHead -- releases/V001 releases/V002 releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'Protected releases changed during C010 targeted validation.' }
    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $summary = [ordered]@{
        cycle = 'V004-C010'
        status = 'PASS_REPLACEMENT_RC_HARNESS_TARGETED'
        candidateSourceHead = $candidateSourceHead
        candidateSha256Before = $candidateShaBefore
        candidateSha256After = $candidateShaAfter
        candidateBytesBefore = $candidateBytesBefore
        candidateBytesAfter = $candidateBytesAfter
        applicationDiffFromCandidateSource = 0
        m4ClosureContract = 'PASS'
        externalDependencyContract = 'PASS'
        requiredRunnerSyntaxAndWiring = 'PASS'
        requiredRunnerCount = $requiredRunners.Count
        checkoutHtmlReleaseFallbacks = 0
        unresolvedKnownReleaseHarnessDependencyGaps = 0
        legacyFixtureRegionsUnchanged = 'PASS'
        targetedM4 = 'PASS'
        craftTimeSecondsNullJsonRoundTrip = 'PASS'
        canonicalFingerprintUnchanged = 'PASS'
        representativeLegacyConsumer = 'v003-c0125c1_PASS'
        targetedV004C0061 = 'PASS'
        historySnapshotCompatibility = 'PASS'
        candidateRegeneratedDuringValidation = $false
        candidateApplicationModified = $false
        protectedV001V002V003 = 'PASS'
        push = 'NO'
    }
    Write-Utf8NoBom $summaryPath (($summary | ConvertTo-Json -Depth 6) + "`n")
    Write-Output "V004_C010_REPLACEMENT_RC_HARNESS_TARGETED_PASS candidate=$candidatePath bytes=$candidateBytesAfter sha256=$candidateShaAfter"
} catch {
    $blocked = [ordered]@{
        cycle = 'V004-C010'
        status = 'REPLACEMENT_RC_HARNESS_TARGETED_GATE_BLOCKED'
        failure = $_.Exception.Message
        stableArtifact = 'NOT_CREATED'
        v004Tag = 'NOT_CREATED'
        push = 'NO'
    }
    Write-Utf8NoBom $summaryPath (($blocked | ConvertTo-Json -Depth 6) + "`n")
    throw
} finally {
    $env:SPG_V004_RELEASE_CANDIDATE_MODE = $previousReleaseMode
    $env:SPG_V004_VERIFIED_CANDIDATE_PATH = $previousCandidatePath
    $env:SPG_V004_VERIFIED_CANDIDATE_SHA256 = $previousCandidateSha
    $env:SPG_V004_VERIFIED_CANDIDATE_BYTES = $previousCandidateBytes
    Pop-Location
}
