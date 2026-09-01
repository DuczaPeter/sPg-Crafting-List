#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceHead = '9a07de34643fed477399b070462aeb2be3d4f11a'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C013.2\fresh-release-candidate'
$candidatePath = Join-Path $artifactDirectory 'sPg Crafting List V003 RC.html'
$manifestPath = Join-Path $artifactDirectory 'candidate-manifest.json'
$evidencePath = Join-Path $artifactDirectory 'automated-evidence.json'
$logPath = Join-Path $artifactDirectory 'validation.log'
$temporaryCandidate = Join-Path $env:TEMP ('spg-v003-c0132-fresh-' + [guid]::NewGuid().ToString('N') + '.html')
$expectedBlockedC013Sha = 'd4ce0fb9caea5e2f77597ce76ae05321d8d8a5c3721dfb91ebf431a7ebeef182'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C013.2 fresh release candidate validation')

function Invoke-BoundedCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $output = & $Executable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    $checkStatus = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $lines.Add("$Name=$checkStatus")
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
    if ($branch -ne 'develop/V003') { throw "Hibas branch: $branch" }
    & git merge-base --is-ancestor $sourceHead HEAD
    if ($LASTEXITCODE -ne 0) { throw "A C013.2 source checkpoint nem ose a jelenlegi HEAD-nek: $head" }
    & git diff --quiet $sourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Az application HTML elter a C013.1 source HEAD-tol; C013.2 STOP.' }
    $blockedC013Path = '.\test-artifacts\V003-C013\fresh-release-candidate\sPg Crafting List V003 RC.html'
    $blockedC013Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath $blockedC013Path).Hash.ToLowerInvariant()
    if ($blockedC013Sha -ne $expectedBlockedC013Sha) { throw 'A blokkolt C013 candidate megvaltozott.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'candidate-build' 'node' @('.\tools\build-v003-c0132-fresh-candidate.mjs')
    Invoke-BoundedCheck 'candidate-rebuild' 'node' @('.\tools\build-v003-c0132-fresh-candidate.mjs', "--output=$temporaryCandidate")

    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytes = (Get-Item -LiteralPath $candidatePath).Length
    $temporarySha = (Get-FileHash -Algorithm SHA256 -LiteralPath $temporaryCandidate).Hash.ToLowerInvariant()
    if ($candidateShaBefore -ne $temporarySha -or $candidateBytes -ne (Get-Item -LiteralPath $temporaryCandidate).Length) { throw 'A C013.2 candidate determinisztikus rebuildje elter.' }
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifest.sourceHead -ne $sourceHead -or $manifest.sha256 -ne $candidateShaBefore -or [int64]$manifest.bytes -ne $candidateBytes) { throw 'A C013.2 manifest elter.' }

    Invoke-BoundedCheck 'full-c001-c0122-m1-m61-c04' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-v003-c0122.ps1')
    Invoke-BoundedCheck 'c0123-quality-semantics' 'node' @('.\tools\run-v003-c0123-tests.mjs')
    Invoke-BoundedCheck 'c0124-numeric-lifecycle' 'node' @('.\tools\run-v003-c0124-tests.mjs')
    Invoke-BoundedCheck 'c0125a-through-c3b2' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-v003-c0125c3b2.ps1')
    Invoke-BoundedCheck 'candidate-c0131-d1-target' 'node' @('.\tools\run-v003-c0132-fresh-tests.mjs')

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    if ($candidateShaAfter -ne $candidateShaBefore) { throw 'A C013.2 candidate SHA megvaltozott a regresszio alatt.' }
    & git diff --quiet $sourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Az application code megvaltozott a C013.2 alatt.' }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integritas elter.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integritas elter.' }
    if (@(& git tag --list 'V003*').Count -gt 0 -or (Test-Path -LiteralPath '.\releases\V003')) { throw 'V003 tag vagy stable release jelent meg.' }

    $targetEvidence = Get-Content -Raw -LiteralPath (Join-Path $artifactDirectory 'target-evidence.json') | ConvertFrom-Json
    $evidence = [ordered]@{
        cycle = 'V003-C013.2'
        status = 'AUTOMATED_PASS_CHROME_PENDING'
        sourceHead = $sourceHead
        candidate = [ordered]@{ path = 'test-artifacts/V003-C013.2/fresh-release-candidate/sPg Crafting List V003 RC.html'; bytes = $candidateBytes; sha256Before = $candidateShaBefore; sha256After = $candidateShaAfter; immutable = $true; singleFile = $true; embeddedCss = $true; embeddedJavaScript = $true; localRuntimeSidecars = 0 }
        regression = [ordered]@{ C001_C0122_M1_M61_C04 = 'PASS'; C0123 = 'PASS'; C0124 = 'PASS'; C0125A_C0125C3B2 = 'PASS'; C0125D1 = 'PASS'; C0131 = 'PASS'; staticSingleFile = 'PASS'; backupRestore = 'PASS' }
        mixedShortage = $targetEvidence.mixedShortage
        standalone = $targetEvidence.standalone
        blockedC013Candidate = [ordered]@{ status = 'UNCHANGED_BLOCKED'; sha256 = $blockedC013Sha }
        v001V002Integrity = [ordered]@{ status = 'PASS'; v001Commit = $v001Commit; v002Commit = $v002Commit; v002ArtifactSha256 = $v002Sha }
        applicationCodeChanged = $false
        chrome = 'PENDING'
        exactManualCandidateFileGate = 'NOT_RUN'
        stableRelease = $false
    }
    [System.IO.File]::WriteAllText($evidencePath, (($evidence | ConvertTo-Json -Depth 20) + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('CANDIDATE_SHA_BEFORE_AFTER=PASS')
    $lines.Add('BLOCKED_C013_CANDIDATE_UNCHANGED=PASS')
    $lines.Add('V001_V002_INTEGRITY=PASS')
    $lines.Add('APPLICATION_CODE_CHANGED=NO')
    $lines.Add('V003_TAG_RELEASE=NONE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C0132_FRESH_AUTOMATED_PASS candidate=$candidatePath bytes=$candidateBytes sha256=$candidateShaAfter"
} finally {
    if (Test-Path -LiteralPath $temporaryCandidate) { Remove-Item -LiteralPath $temporaryCandidate -Force }
    Pop-Location
}
