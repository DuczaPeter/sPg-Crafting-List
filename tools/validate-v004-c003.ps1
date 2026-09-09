#Requires -Version 5.1
param(
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$c002Checkpoint = 'd773dc21d9dede6e6a5c71b11d433b5b4b4bdcdd'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C003'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C003 targeted revision and reservation snapshot infrastructure validation')

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
    foreach ($line in @($output | Select-Object -Last 40)) { $lines.Add([string]$line) }
    if ($exitCode -ne 0) {
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $Name exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $Name"
}

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($branch -ne 'develop/V004') { throw "Unexpected branch: $branch" }
    & git merge-base --is-ancestor $c002Checkpoint HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The C002 checkpoint is not an ancestor of HEAD.' }

    $gitDir = (& git rev-parse --git-dir).Trim()
    $operations = @(@('MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply') | Where-Object {
        Test-Path -LiteralPath (Join-Path $gitDir $_)
    })
    if ($operations.Count -gt 0) { throw "Git operation in progress: $($operations -join ', ')" }

    $tagTypeBefore = (& git cat-file -t V003).Trim()
    $tagTargetBefore = (& git rev-parse 'V003^{}').Trim()
    $stableItemBefore = Get-Item -LiteralPath $stablePath
    $stableShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeBefore -ne 'tag' -or $tagTargetBefore -ne $expectedV003TagTarget) { throw 'V003 annotated tag target mismatch.' }
    if ($stableItemBefore.Length -ne $expectedV003ArtifactSize -or $stableShaBefore -ne $expectedV003ArtifactSha) { throw 'V003 stable artifact size or SHA mismatch.' }
    & git diff --quiet V003 HEAD -- releases/V001 releases/V002 releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'V001/V002/V003 release path differs from the V003 baseline.' }
    & git diff --quiet HEAD -- releases/V001 releases/V002 releases/V003 'test-artifacts/V003-*' 'docs/V003*'
    if ($LASTEXITCODE -ne 0) { throw 'Protected V003/V001/V002 working-tree change detected.' }

    Invoke-BoundedCheck 'baseline-static' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c003-targeted-model' 'node' @('.\tools\run-v004-c003-tests.mjs')
    if ($PlaywrightModulePath) {
        if (-not (Test-Path -LiteralPath $PlaywrightModulePath)) { throw "Playwright module not found: $PlaywrightModulePath" }
        Invoke-BoundedCheck 'c003-targeted-chrome' 'node' @('.\tools\run-v004-c003-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    }

    $modelEvidencePath = Join-Path $artifactDirectory 'model-evidence.json'
    $browserEvidencePath = Join-Path $artifactDirectory 'browser-evidence.json'
    $modelEvidence = [System.IO.File]::ReadAllText($modelEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = if (Test-Path -LiteralPath $browserEvidencePath) { [System.IO.File]::ReadAllText($browserEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json } else { $null }
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL') { throw 'A C003 modell-evidence nem PASS.' }
    if ($modelEvidence.revision.initial.inventoryRevision -ne 0 -or $modelEvidence.revision.initial.craftListRevision -ne 0 -or $modelEvidence.revision.initial.allocationRevision -ne 0) { throw 'Revision initialization mismatch.' }
    if ($modelEvidence.revision.overflow -ne 'V004_REVISION_OVERFLOW') { throw 'Revision overflow blocker mismatch.' }
    if ($modelEvidence.reservation.marker -ne 'V004_RESERVATION_SNAPSHOT_1' -or $modelEvidence.reservation.deterministic -ne $true) { throw 'Reservation payload marker or determinism mismatch.' }
    if ($modelEvidence.reservation.cryptoUnavailable -ne 'HASH_UNAVAILABLE') { throw 'Crypto-unavailable fail-closed proof missing.' }
    if ($modelEvidence.capability.fullMax -ne 5 -or $modelEvidence.capability.limitedVisibleReservationMax -ne 3) { throw 'Reservation-based MAX capability mismatch.' }
    if ($modelEvidence.capability.outputCountUnproven -ne 'OUTPUT_COUNT_UNPROVEN') { throw 'Output-count blocker mismatch.' }
    if ($modelEvidence.singleFile.applicationRuntimeFileCount -ne 1 -or $modelEvidence.singleFile.localRuntimeSidecars -ne 0) { throw 'A single-file runtime gate sikertelen.' }
    if ($modelEvidence.exclusions.inventoryDeduction -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.craftHistoryEvent -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.undo -ne 'NOT_IMPLEMENTED') { throw 'C003 scope exclusion mismatch.' }

    $browserPass = $null -ne $browserEvidence -and $browserEvidence.status -eq 'PASS_TARGETED_CHROME'
    if (-not $browserPass) { throw 'Targeted Chrome evidence is missing or not PASS.' }
    if ($browserEvidence.applicationSha256 -ne $modelEvidence.applicationSha256) { throw 'Chrome evidence does not match current application bytes.' }
    if ($browserEvidence.startup.revisions.inventoryRevision -ne 0 -or $browserEvidence.startup.revisions.craftListRevision -ne 0 -or $browserEvidence.startup.revisions.allocationRevision -ne 0) { throw 'Chrome revision initialization mismatch.' }
    if ($browserEvidence.atomicRollback.recordsUnchanged -ne $true -or $browserEvidence.atomicRollback.revisionsUnchanged -ne $true) { throw 'Az atomi rollback proof sikertelen.' }
    if ($browserEvidence.reloadGate.explicitReallocateRequired -ne $true -or $browserEvidence.reloadGate.reallocateAfterReload -ne 'PASS') { throw 'Reload stale/Reallocate proof sikertelen.' }
    if ($browserEvidence.reservation.outputCountBlocker.capability.blockerReason -ne 'OUTPUT_COUNT_UNPROVEN') { throw 'Chrome output-count blocker mismatch.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED') { throw 'A direct file gate nem PASS.' }
    if (@($browserEvidence.applicationOriginConsoleErrors).Count -ne 0 -or @($browserEvidence.fileGate.consoleErrors).Count -ne 0) { throw 'Browser console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C003'
        status = 'PASS_REVISION_RESERVATION_SNAPSHOT_INFRASTRUCTURE'
        validationHead = (& git rev-parse HEAD).Trim()
        c002Checkpoint = $c002Checkpoint
        applicationRuntimeIdentity = 'V004-dev'
        applicationSchemaVersion = 7
        databaseName = 'spg-crafting-list-v004'
        databaseVersion = 1
        backupSchemaVersion = 3
        revisionInitialValue = 0
        revisionOverflow = 'V004_REVISION_OVERFLOW'
        reservationMarker = 'V004_RESERVATION_SNAPSHOT_1'
        reservationHash = 'SHA-256_WEB_CRYPTO_LOWERCASE_HEX'
        hashUnavailable = 'BLOCKED_HASH_UNAVAILABLE'
        reservationStates = @('VALID', 'STALE', 'BLOCKED')
        reloadState = 'STALE_REQUIRES_EXPLICIT_REALLOCATION'
        fullMax = $modelEvidence.capability.fullMax
        limitedVisibleReservationMax = $modelEvidence.capability.limitedVisibleReservationMax
        outputCountBlocker = $modelEvidence.capability.outputCountUnproven
        chromeStartup = $browserEvidence.startup.status
        chromeReallocate = $browserEvidence.reloadGate.reallocateAfterReload
        directFileGate = $browserEvidence.fileGate.status
        applicationOriginConsoleErrors = 0
        localRuntimeSidecars = 0
        applicationRuntimeFileCount = 1
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        v001V002Unchanged = $true
        craftCompleteInventoryDeduction = 'NOT_IMPLEMENTED'
        partialCompletionExecution = 'NOT_IMPLEMENTED'
        craftHistoryEvent = 'NOT_IMPLEMENTED'
        undo = 'NOT_IMPLEMENTED'
        broadcastChannel = 'NOT_IMPLEMENTED'
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_REVISION_RESERVATION_SNAPSHOT_INFRASTRUCTURE')
    $lines.Add("applicationSha256=$($modelEvidence.applicationSha256)")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add("directFileGate=$($browserEvidence.fileGate.status)")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C003_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
