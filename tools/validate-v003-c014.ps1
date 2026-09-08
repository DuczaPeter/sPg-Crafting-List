#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$baselineHead = '045bd8ce38dde5e2ef43999a038c4d835d644b9a'
$expectedV003TagTarget = '045bd8ce38dde5e2ef43999a038c4d835d644b9a'
$expectedV003ReleaseSha = 'bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C014'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C014 targeted stable version identity validation')

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

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $head = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'develop/V003') { throw "Unexpected branch: $branch" }
    if ($head -ne $baselineHead) {
        $parents = @((& git rev-list --parents -n 1 HEAD).Trim().Split(' '))
        $subject = (& git log -1 --format=%s).Trim()
        if ($parents.Count -ne 2 -or $parents[1] -ne $baselineHead -or $subject -ne 'V003-C014-STABLE-VERSION-IDENTITY-REPAIR') {
            throw "Unexpected C014 baseline/checkpoint: $head"
        }
    }

    $stablePath = '.\releases\V003\sPg Crafting List.html'
    $stableShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    $tagTargetBefore = (& git rev-parse 'V003^{}').Trim()
    if ($stableShaBefore -ne $expectedV003ReleaseSha) { throw 'The invalidated local V003 release artifact changed before validation.' }
    if ($tagTargetBefore -ne $expectedV003TagTarget) { throw 'The local V003 tag moved before validation.' }
    & git diff --quiet V003 -- releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'The invalidated V003 release directory differs from the local V003 tag.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c014-version-identity' 'node' @('.\tools\run-v003-c014-tests.mjs')

    $evidence = Get-Content -LiteralPath '.\test-artifacts\V003-C014\version-identity-evidence.json' -Raw | ConvertFrom-Json
    if ($evidence.status -ne 'PASS_STATIC_VERSION_IDENTITY') { throw 'C014 identity evidence is not PASS.' }
    if ($evidence.exactRepair.currentV003DevOccurrences -ne 0 -or -not $evidence.exactRepair.onlyThreeIdentityReplacements) { throw 'C014 exact replacement invariant failed.' }
    if ($evidence.propagation.backupApplicationVersionUsesAppVersion -ne $true -or $evidence.propagation.diagnosticApplicationVersionUsesAppVersion -ne $true) { throw 'APP.version propagation evidence failed.' }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integrity mismatch.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integrity mismatch.' }

    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    if ($stableShaAfter -ne $stableShaBefore) { throw 'The invalidated V003 release artifact changed during validation.' }
    if ($tagTargetAfter -ne $tagTargetBefore) { throw 'The local V003 tag moved during validation.' }
    if (Test-Path -LiteralPath '.\test-artifacts\V003-C014\fresh-release-candidate') { throw 'C014 must not create a fresh release candidate.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $chromeEvidencePath = '.\test-artifacts\V003-C014\chrome-localhost-evidence.json'
    $chromeEvidence = if (Test-Path -LiteralPath $chromeEvidencePath) { Get-Content -LiteralPath $chromeEvidencePath -Raw | ConvertFrom-Json } else { $null }
    $chromePass = $null -ne $chromeEvidence -and $chromeEvidence.status -eq 'PASS' -and $chromeEvidence.technicalProbe.passed -eq 15 -and $chromeEvidence.technicalProbe.failed -eq 0
    $resultStatus = if ($chromePass) { 'PASS_TARGETED_STATIC_AND_CHROME' } else { 'PASS_STATIC_TARGETED_CHROME_PENDING' }
    $chromeStatus = if ($chromePass) { 'PASS_15_OF_15_RELOAD_BACKUP_DIAGNOSTIC_STANDALONE_CONSOLE_0_0' } else { 'PENDING' }

    $summary = [ordered]@{
        cycle = 'V003-C014'
        status = $resultStatus
        baselineHead = $baselineHead
        validationHead = $head
        applicationSha256 = $evidence.applicationSha256
        v003DevRuntimeIdentityOccurrences = 0
        applicationStatus = 'V003'
        footerRuntime = 'V003'
        appVersion = 'V003'
        backupApplicationVersion = 'APP.version -> V003'
        diagnosticApplicationVersion = 'APP.version -> V003'
        singleFileStaticGate = 'PASS'
        v001Integrity = 'PASS'
        v002Integrity = 'PASS'
        invalidatedV003ReleaseCommit = $expectedV003TagTarget
        invalidatedV003TagTarget = $tagTargetAfter
        invalidatedV003ReleaseSha256 = $stableShaAfter
        invalidatedV003ReleaseUnchanged = $true
        fullHistoricalRegression = 'NOT_RUN_BY_SCOPE'
        freshReleaseCandidate = 'NOT_CREATED'
        chromeTargetedGate = $chromeStatus
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add("result=$resultStatus")
    $lines.Add("applicationSha256=$($evidence.applicationSha256)")
    $lines.Add("invalidatedV003ReleaseSha256=$stableShaAfter")
    $lines.Add('fullHistoricalRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C014_VALIDATION_PASS status=$resultStatus summary=$summaryPath"
} finally {
    Pop-Location
}
