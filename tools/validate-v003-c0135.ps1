#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$baselineHead = '75950192ff73b49672aaf459de6ac3dffc3daf38'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C013.5'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$expectedC0134Sha = '38e5533da6b4699b98c3cf7c7f481f5755167fbab515336dd71e6d691bf9149b'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C013.5 targeted validation')

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
    if ($head -ne $baselineHead) { throw "Unexpected C013.5 baseline: $head" }
    $appShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    $candidatePath = '.\test-artifacts\V003-C013.4\fresh-release-candidate\sPg Crafting List V003 RC.html'
    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    if ($candidateShaBefore -ne $expectedC0134Sha) { throw 'The invalidated C013.4 candidate changed before validation.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c0135-canonical-material-picker' 'node' @('.\tools\run-v003-c0135-tests.mjs')
    Invoke-BoundedCheck 'c0135-active-4.10-identity-audit' 'node' @('.\tools\audit-v003-c0135-active-materials.mjs')
    $oldArtifactDirectory = $env:SPG_ARTIFACT_DIRECTORY
    try {
        $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory 'c0133-regression'
        Invoke-BoundedCheck 'c0133-titanium-canonical-regression' 'node' @('.\tools\run-v003-c0133-tests.mjs')
    } finally {
        if ($null -eq $oldArtifactDirectory) { Remove-Item Env:SPG_ARTIFACT_DIRECTORY -ErrorAction SilentlyContinue } else { $env:SPG_ARTIFACT_DIRECTORY = $oldArtifactDirectory }
    }
    Invoke-BoundedCheck 'c0125a-known-material-regression' 'node' @('.\tools\run-v003-c0125a-tests.mjs')
    Invoke-BoundedCheck 'm2-allocation-regression' 'node' @('.\tools\run-m2-tests.mjs')
    Invoke-BoundedCheck 'm4-combined-backup-regression' 'node' @('.\tools\run-m4-tests.mjs')

    $liveAudit = Get-Content -LiteralPath '.\test-artifacts\V003-C013.5\active-4.10-material-identity-audit.json' -Raw | ConvertFrom-Json
    if ($liveAudit.activeScVersion -ne '4.10.0-LIVE.12519617') { throw 'Unexpected live audit SC version.' }
    if ($liveAudit.feynmaline.visibleCount -ne 1) { throw 'Feynmaline picker dedup failed in the active audit.' }
    if ($liveAudit.feynmaline.canonicalUuid -ne '7310c15d-359c-42b4-b61e-7da3d0da3384') { throw 'Feynmaline canonical UUID mismatch.' }
    if ($liveAudit.titanium.visibleCount -ne 1) { throw 'Titanium picker dedup failed in the active audit.' }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integrity mismatch.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integrity mismatch.' }
    if (@(& git tag --list 'V003').Count -ne 0) { throw 'Unexpected V003 tag exists.' }

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $appShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($candidateShaAfter -ne $candidateShaBefore) { throw 'The invalidated C013.4 candidate changed during validation.' }
    if ($appShaAfter -ne $appShaBefore) { throw 'Validation modified the application HTML.' }
    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $summary = [ordered]@{
        cycle = 'V003-C013.5'
        status = 'PASS'
        sourceHead = $head
        applicationSha256 = $appShaAfter
        c0134CandidateStatus = 'BLOCKED_INVALIDATED_UNCHANGED'
        c0134CandidateSha256 = $candidateShaAfter
        activeScVersion = $liveAudit.activeScVersion
        activeAudit = [ordered]@{
            userFacingMaterialNameCount = $liveAudit.picker.userFacingMaterialNameCount
            visiblePickerOptionCount = $liveAudit.picker.visiblePickerOptionCount
            exactCanonicalMultiUuidMaterialCount = $liveAudit.picker.exactCanonicalMultiUuidMaterialCount
            duplicatePickerOptionNames = @($liveAudit.picker.duplicatePickerOptionNames)
            exactMergedMaterials = @($liveAudit.picker.exactMergedMaterials)
            unresolvedDuplicates = @($liveAudit.picker.unresolvedDuplicates)
        }
        feynmalineVisibleCount = $liveAudit.feynmaline.visibleCount
        feynmalineCanonicalUuid = $liveAudit.feynmaline.canonicalUuid
        titaniumVisibleCount = $liveAudit.titanium.visibleCount
        userDataMutation = $false
        fullReleaseRegression = 'NOT_RUN_BY_SCOPE'
        freshReleaseCandidateRequired = $true
        v001Integrity = 'PASS'
        v002Integrity = 'PASS'
        v003Tag = 'ABSENT'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 10) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS')
    $lines.Add("applicationSha256=$appShaAfter")
    $lines.Add("activeAuditNames=$($liveAudit.picker.userFacingMaterialNameCount)")
    $lines.Add("activeAuditExactMultiUuid=$($liveAudit.picker.exactCanonicalMultiUuidMaterialCount)")
    $lines.Add("activeAuditUnresolved=$($liveAudit.picker.unresolvedDuplicateCount)")
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C0135_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
