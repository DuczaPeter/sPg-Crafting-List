#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$baselineHead = '87ae7d18aaa2bf3020654bc79ada433f6c8771a6'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C013.7'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$expectedC0136Sha = '4489a48ff50e6652b89684dce522e35203557e33753d73b1c98aa5588193a7ed'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C013.7 targeted validation')

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
    $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $lines.Add("$Name=$status")
    if ($exitCode -ne 0) {
        foreach ($line in @($output | Select-Object -Last 80)) { $lines.Add([string]$line) }
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $Name exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $Name"
}

function Invoke-IsolatedNodeCheck {
    param([string]$Name, [string]$Script, [string]$ArtifactSubdirectory)
    $oldArtifactDirectory = $env:SPG_ARTIFACT_DIRECTORY
    try {
        $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory $ArtifactSubdirectory
        Invoke-BoundedCheck $Name 'node' @($Script)
    } finally {
        if ($null -eq $oldArtifactDirectory) {
            Remove-Item Env:SPG_ARTIFACT_DIRECTORY -ErrorAction SilentlyContinue
        } else {
            $env:SPG_ARTIFACT_DIRECTORY = $oldArtifactDirectory
        }
    }
}

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $head = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'develop/V003') { throw "Unexpected branch: $branch" }
    if ($head -ne $baselineHead) { throw "Unexpected C013.7 baseline: $head" }

    $appShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    $candidatePath = '.\test-artifacts\V003-C013.6\fresh-release-candidate\sPg Crafting List V003 RC.html'
    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    if ($candidateShaBefore -ne $expectedC0136Sha) { throw 'The invalidated C013.6 candidate changed before validation.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c0137-user-data-independent-canonical-picker' 'node' @('.\tools\run-v003-c0137-tests.mjs')
    Invoke-IsolatedNodeCheck 'c0135-canonical-picker-regression' '.\tools\run-v003-c0135-tests.mjs' 'c0135-regression'
    Invoke-IsolatedNodeCheck 'c0133-disjoint-pool-regression' '.\tools\run-v003-c0133-tests.mjs' 'c0133-regression'
    Invoke-BoundedCheck 'c0125a-inventory-independence-regression' 'node' @('.\tools\run-v003-c0125a-tests.mjs')
    Invoke-BoundedCheck 'm2-allocation-regression' 'node' @('.\tools\run-m2-tests.mjs')
    Invoke-BoundedCheck 'm4-combined-backup-regression' 'node' @('.\tools\run-m4-tests.mjs')

    $evidence = Get-Content -LiteralPath '.\test-artifacts\V003-C013.7\user-data-independent-canonical-picker-evidence.json' -Raw | ConvertFrom-Json
    if ($evidence.status -ne 'PASS' -or $evidence.invariance.Count -lt 4) { throw 'The C013.7 canonical invariance evidence is incomplete.' }
    if (@($evidence.invariance | Where-Object { -not $_.equal }).Count -ne 0) { throw 'Canonical picker UUID depends on User Data.' }
    if ($evidence.titanium.logicalMaterialCount -ne 1 -or $evidence.titanium.batchCount -ne 3) { throw 'Titanium grouping or multi-batch persistence failed.' }
    if ($evidence.checks.destructiveMigration -ne 'NO') { throw 'Unexpected destructive User Data migration.' }

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $appShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($candidateShaAfter -ne $candidateShaBefore) { throw 'The invalidated C013.6 candidate changed during validation.' }
    if ($appShaAfter -ne $appShaBefore) { throw 'Validation modified the repaired application HTML.' }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integrity mismatch.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integrity mismatch.' }
    if (@(& git tag --list 'V003').Count -ne 0) { throw 'Unexpected V003 tag exists.' }
    if (Test-Path -LiteralPath '.\releases\V003') { throw 'Unexpected V003 release directory exists.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $summary = [ordered]@{
        cycle = 'V003-C013.7'
        status = 'PASS_FRESH_RC_REQUIRED'
        baselineHead = $head
        applicationSha256 = $appShaAfter
        c0136CandidateStatus = 'BLOCKED_INVALIDATED_UNCHANGED'
        c0136CandidateSha256 = $candidateShaAfter
        canonicalInvarianceMaterials = @($evidence.invariance | ForEach-Object { $_.name })
        titaniumLogicalMaterials = $evidence.titanium.logicalMaterialCount
        titaniumBatchCount = $evidence.titanium.batchCount
        destructiveUserDataMigration = $false
        fullReleaseRegression = 'NOT_RUN_BY_SCOPE'
        freshReleaseCandidateRequired = $true
        v001Integrity = 'PASS'
        v002Integrity = 'PASS'
        v003Tag = 'ABSENT'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS')
    $lines.Add("applicationSha256=$appShaAfter")
    $lines.Add("c0136CandidateSha256=$candidateShaAfter")
    $lines.Add('fullReleaseRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C0137_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
