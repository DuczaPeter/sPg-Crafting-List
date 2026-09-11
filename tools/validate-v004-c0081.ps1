#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$candidateSourceHead = 'c4fef88d5d0a910437b814aa2bd9f90b9375c877'
$expectedCandidateSha = '7ac2c27bc7a35f719f4a4526e6839f8460a51e2ab6d881e1a95c3ed16f58b050'
$expectedCandidateBytes = 1083258
$candidatePath = Join-Path $projectRoot 'test-artifacts\V004-C008\fresh-release-candidate\sPg Crafting List V004 RC.html'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C008.1'
$auditEvidencePath = Join-Path $artifactDirectory 'harness-compatibility-evidence.json'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$affectedRunners = @(
    'run-m1-tests.mjs',
    'run-m2-tests.mjs',
    'run-m6-tests.mjs',
    'run-v003-c006-tests.mjs',
    'run-v003-c007-tests.mjs',
    'run-v003-c008-tests.mjs',
    'run-v003-c011-tests.mjs',
    'run-v003-c0121-tests.mjs',
    'run-v003-c0122-tests.mjs',
    'run-v003-c0123-tests.mjs'
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
        @($output | Select-Object -Last 30) | ForEach-Object { Write-Output $_ }
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
    if ((& git branch --show-current).Trim() -ne 'candidate/V004') { throw 'C008.1 requires candidate/V004.' }
    & git merge-base --is-ancestor $candidateSourceHead HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The frozen candidate commit is not an ancestor of HEAD.' }
    & git diff --quiet $candidateSourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Application diff from the frozen candidate source is not zero.' }
    & git diff --quiet $candidateSourceHead -- releases/V001 releases/V002 releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'Protected V001/V002/V003 differs from the frozen candidate source.' }

    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytesBefore = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateShaBefore -ne $expectedCandidateSha -or $candidateBytesBefore -ne $expectedCandidateBytes) { throw 'Frozen candidate identity mismatch before C008.1.' }

    Invoke-BoundedCheck 'shared-loader-syntax' 'node' @('--check', '.\tools\v004-c0081-harness-loader.mjs')
    foreach ($runner in $affectedRunners) {
        Invoke-BoundedCheck "syntax-$runner" 'node' @('--check', ".\tools\$runner")
    }
    Invoke-BoundedCheck 'harness-dependency-wiring-audit' 'node' @('.\tools\audit-v004-c0081-harness-compatibility.mjs', '--evidence=.\test-artifacts\V004-C008.1\harness-compatibility-evidence.json')

    $env:SPG_V004_RELEASE_CANDIDATE_MODE = '1'
    $env:SPG_V004_VERIFIED_CANDIDATE_PATH = $candidatePath
    $env:SPG_V004_VERIFIED_CANDIDATE_SHA256 = $expectedCandidateSha
    $env:SPG_V004_VERIFIED_CANDIDATE_BYTES = [string]$expectedCandidateBytes
    Invoke-BoundedCheck 'm1-model-cache-targeted' 'node' @('.\tools\run-m1-tests.mjs')
    Invoke-BoundedCheck 'm2-inventory-allocation-targeted' 'node' @('.\tools\run-m2-tests.mjs')

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytesAfter = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateShaAfter -ne $candidateShaBefore -or $candidateBytesAfter -ne $candidateBytesBefore) { throw 'Frozen candidate changed during C008.1.' }
    & git diff --quiet $candidateSourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Application changed during C008.1.' }
    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $summary = [ordered]@{
        cycle = 'V004-C008.1'
        status = 'PASS_RELEASE_HARNESS_COMPATIBILITY_TARGETED'
        candidateSourceHead = $candidateSourceHead
        candidateSha256 = $candidateShaAfter
        candidateBytes = $candidateBytesAfter
        applicationDiffFromCandidateSource = 0
        sharedLoaderSyntax = 'PASS'
        affectedRunnerSyntax = 'PASS'
        affectedRunnerCount = $affectedRunners.Count
        unresolvedAffectedHarnesses = 0
        checkoutHtmlReleaseFallbacks = 0
        m1ModelCache = 'PASS'
        representativeTransitiveConsumer = 'm2-inventory-allocation_PASS'
        fullTenLeafPreRun = 'NOT_REQUIRED_NOT_RUN'
        candidateRegenerated = $false
        candidateApplicationModified = $false
        protectedV001V002V003 = 'PASS'
        push = 'NO'
    }
    Write-Utf8NoBom $summaryPath (($summary | ConvertTo-Json -Depth 6) + "`n")
    Write-Output "V004_C0081_TARGETED_PASS candidate=$candidatePath bytes=$candidateBytesAfter sha256=$candidateShaAfter"
} finally {
    $env:SPG_V004_RELEASE_CANDIDATE_MODE = $previousReleaseMode
    $env:SPG_V004_VERIFIED_CANDIDATE_PATH = $previousCandidatePath
    $env:SPG_V004_VERIFIED_CANDIDATE_SHA256 = $previousCandidateSha
    $env:SPG_V004_VERIFIED_CANDIDATE_BYTES = $previousCandidateBytes
    Pop-Location
}
