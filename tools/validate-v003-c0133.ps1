#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$baselineHead = '5bcfd32b29539010108b4ccfcde2e29e04eddf2c'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C013.3'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$expectedC0132Sha = 'cdbac1a7977845061494aa148e6603db2597270bcbcf49c587009bd6b3a0ca31'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C013.3 targeted validation')

function Invoke-BoundedCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        # Windows PowerShell 5.1 can promote native stderr to a terminating
        # NativeCommandError while the called test is expected to own its exit
        # code. Capture the complete stream and handle that code below.
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

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $head = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'develop/V003') { throw "Unexpected branch: $branch" }
    if ($head -ne $baselineHead) { throw "Unexpected C013.3 baseline: $head" }
    $appShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    $c0132ShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\test-artifacts\V003-C013.2\fresh-release-candidate\sPg Crafting List V003 RC.html').Hash.ToLowerInvariant()
    if ($c0132ShaBefore -ne $expectedC0132Sha) { throw 'The blocked C013.2 candidate changed before validation.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c0133-disjoint-pools-canonical-grouping' 'node' @('.\tools\run-v003-c0133-tests.mjs')
    Invoke-BoundedCheck 'm2-allocation-regression' 'node' @('.\tools\run-m2-tests.mjs')
    Invoke-BoundedCheck 'm4-combined-backup-regression' 'node' @('.\tools\run-m4-tests.mjs')
    Invoke-BoundedCheck 'c0125a-canonical-inventory' 'node' @('.\tools\run-v003-c0125a-tests.mjs')
    Invoke-BoundedCheck 'c0125b-disjoint-preview' 'node' @('.\tools\run-v003-c0125b-tests.mjs')
    Invoke-BoundedCheck 'c0125c2-dropdown-labels' 'node' @('.\tools\run-v003-c0125c2-tests.mjs')
    Invoke-BoundedCheck 'c0125c3a-pool-allocation-max' 'node' @('.\tools\run-v003-c0125c3a-tests.mjs')
    Invoke-BoundedCheck 'c0125c3b1-combined-pool-metrics' 'node' @('.\tools\run-v003-c0125c3b1-tests.mjs')
    Invoke-BoundedCheck 'c0125c3b2-standalone-parity' 'node' @('.\tools\run-v003-c0125c3b2-tests.mjs')

    $oldExpectedHead = $env:SPG_EXPECTED_HEAD
    $oldAllowAppDiff = $env:SPG_ALLOW_APP_DIFF
    $oldArtifactDirectory = $env:SPG_ARTIFACT_DIRECTORY
    $oldStandaloneOutput = $env:SPG_STANDALONE_OUTPUT
    $oldCycleId = $env:SPG_CYCLE_ID
    try {
        $env:SPG_EXPECTED_HEAD = $baselineHead
        $env:SPG_ALLOW_APP_DIFF = '1'
        $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory 'd1-regression'
        $env:SPG_STANDALONE_OUTPUT = Join-Path $artifactDirectory 'standalone\sPg Crafting List - FR-86 disjoint pools.html'
        $env:SPG_CYCLE_ID = 'V003-C013.3'
        Invoke-BoundedCheck 'c0125d1-integrated-parity' 'node' @('.\tools\run-v003-c0125d1-tests.mjs')
        $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory 'c0131-regression'
        Remove-Item Env:SPG_STANDALONE_OUTPUT -ErrorAction SilentlyContinue
        Invoke-BoundedCheck 'c0131-strict-quality-shortage' 'node' @('.\tools\run-v003-c0131-tests.mjs')
    } finally {
        if ($null -eq $oldExpectedHead) { Remove-Item Env:SPG_EXPECTED_HEAD -ErrorAction SilentlyContinue } else { $env:SPG_EXPECTED_HEAD = $oldExpectedHead }
        if ($null -eq $oldAllowAppDiff) { Remove-Item Env:SPG_ALLOW_APP_DIFF -ErrorAction SilentlyContinue } else { $env:SPG_ALLOW_APP_DIFF = $oldAllowAppDiff }
        if ($null -eq $oldArtifactDirectory) { Remove-Item Env:SPG_ARTIFACT_DIRECTORY -ErrorAction SilentlyContinue } else { $env:SPG_ARTIFACT_DIRECTORY = $oldArtifactDirectory }
        if ($null -eq $oldStandaloneOutput) { Remove-Item Env:SPG_STANDALONE_OUTPUT -ErrorAction SilentlyContinue } else { $env:SPG_STANDALONE_OUTPUT = $oldStandaloneOutput }
        if ($null -eq $oldCycleId) { Remove-Item Env:SPG_CYCLE_ID -ErrorAction SilentlyContinue } else { $env:SPG_CYCLE_ID = $oldCycleId }
    }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integrity mismatch.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integrity mismatch.' }
    if (@(& git tag --list 'V003*').Count -gt 0 -or (Test-Path -LiteralPath '.\releases\V003')) { throw 'Unexpected V003 tag or stable release.' }

    $appShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    $c0132ShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\test-artifacts\V003-C013.2\fresh-release-candidate\sPg Crafting List V003 RC.html').Hash.ToLowerInvariant()
    if ($appShaAfter -ne $appShaBefore) { throw 'Application HTML changed during targeted validation.' }
    if ($c0132ShaAfter -ne $c0132ShaBefore) { throw 'Blocked C013.2 candidate changed during targeted validation.' }

    $summary = [ordered]@{
        cycle = 'V003-C013.3'
        status = 'PASS'
        targetedRegression = 'PASS'
        fullReleaseRegression = 'NOT_RUN_BY_SCOPE'
        applicationSha256Before = $appShaBefore
        applicationSha256After = $appShaAfter
        blockedC0132Candidate = [ordered]@{ status = 'INVALIDATED'; sha256 = $c0132ShaAfter; unchanged = $true }
        v001V002Integrity = 'PASS'
        stableRelease = $false
        freshReleaseCandidateRequired = $true
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 10) + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('APPLICATION_SHA_BEFORE_AFTER=PASS')
    $lines.Add('C0132_BLOCKED_CANDIDATE_UNCHANGED=PASS')
    $lines.Add('V001_V002_INTEGRITY=PASS')
    $lines.Add('FULL_RELEASE_REGRESSION=NOT_RUN_BY_SCOPE')
    $lines.Add('V003_TAG_RELEASE=NONE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C0133_TARGETED_PASS app_sha256=$appShaAfter"
} finally {
    Pop-Location
}
