#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$c003Checkpoint = '4a65c6ad02f052198cef4ef69d66f2046be47030'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C004 targeted atomic Craft Complete core validation')

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
    & git merge-base --is-ancestor $c003Checkpoint HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The C003 checkpoint is not an ancestor of HEAD.' }

    $gitDir = (& git rev-parse --git-dir).Trim()
    $operations = @(@('MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply') | Where-Object {
        Test-Path -LiteralPath (Join-Path $gitDir $_)
    })
    if ($operations.Count -gt 0) { throw "Git operation in progress: $($operations -join ', ')" }
    if (-not (Test-Path -LiteralPath $PlaywrightModulePath)) { throw "Playwright module not found: $PlaywrightModulePath" }

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
    Invoke-BoundedCheck 'c004-targeted-model' 'node' @('.\tools\run-v004-c004-tests.mjs')
    Invoke-BoundedCheck 'c004-targeted-chrome' 'node' @('.\tools\run-v004-c004-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidencePath = Join-Path $artifactDirectory 'model-evidence.json'
    $browserEvidencePath = Join-Path $artifactDirectory 'browser-evidence.json'
    $modelEvidence = [System.IO.File]::ReadAllText($modelEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText($browserEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL') { throw 'C004 model evidence is not PASS.' }
    if ($browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C004 Chrome evidence is not PASS.' }
    if ($modelEvidence.applicationSha256 -ne $browserEvidence.applicationSha256) { throw 'Model and Chrome evidence application hashes differ.' }
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectRoot 'sPg Crafting List.html')).Hash.ToLowerInvariant()
    if ($modelEvidence.applicationSha256 -ne $applicationSha) { throw 'Evidence does not match current application bytes.' }

    if (@($modelEvidence.transaction.stores).Count -ne 5) { throw 'Craft Complete transaction store count mismatch.' }
    foreach ($requiredStore in @('materialBatches', 'userInventory', 'craftingCards', 'craftHistory', 'userMeta')) {
        if ($requiredStore -notin @($modelEvidence.transaction.stores)) { throw "Missing transaction store: $requiredStore" }
    }
    if ($modelEvidence.transaction.resolvesOn -ne 'transaction.oncomplete' -or $modelEvidence.transaction.historyWrite -ne 'add') { throw 'Transaction completion or History add contract mismatch.' }
    if ($modelEvidence.transaction.duplicateStatus -ne 'ALREADY_COMPLETED') { throw 'Idempotency status mismatch.' }
    if ($modelEvidence.partial.proportionalRedistribution -ne $false) { throw 'Partial completion used proportional redistribution.' }
    if ($modelEvidence.partial.craftListRevisionBefore -ne $modelEvidence.partial.craftListRevisionAfter) { throw 'Partial completion changed craftListRevision.' }
    if ($modelEvidence.partial.cardRevisionAfter -ne ($modelEvidence.partial.cardRevisionBefore + 1)) { throw 'Partial completion cardRevision mismatch.' }
    if ($modelEvidence.full.craftListRevisionAfter -ne ($modelEvidence.full.craftListRevisionBefore + 1)) { throw 'Full completion craftListRevision mismatch.' }
    if ($modelEvidence.conservation.toleranceUnits -ne 0 -or $modelEvidence.conservation.oneUnitRemainder -ne 1 -or $modelEvidence.conservation.roundingCallsInC004Model -ne 0) { throw 'Exact-unit conservation proof mismatch.' }
    if ($modelEvidence.outputCountDiagnostic -ne 'OUTPUT_COUNT_UNPROVEN' -or $modelEvidence.craftRunInputBlocker -ne 'CRAFT_RUN_INPUTS_UNPROVEN') { throw 'Craft-run input blocker or output diagnostic mismatch.' }
    if ($modelEvidence.history.eventSchema -ne 'V004_CRAFT_HISTORY_EVENT_2' -or $modelEvidence.history.status -ne 'COMPLETED') { throw 'Craft History event contract mismatch.' }
    if ($modelEvidence.singleFile.applicationRuntimeFileCount -ne 1 -or $modelEvidence.singleFile.localRuntimeSidecars -ne 0) { throw 'Single-file runtime gate failed.' }
    if ($modelEvidence.exclusions.historyUi -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.undo -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.broadcastChannel -ne 'NOT_IMPLEMENTED') { throw 'C004 scope exclusion mismatch.' }

    if ($browserEvidence.confirmation.cancelWrites -ne 0 -or $browserEvidence.confirmation.maxWrites -ne 0) { throw 'Cancel or MAX caused a durable write.' }
    if ($browserEvidence.partialCompletion.status -ne 'PASS' -or $browserEvidence.partialCompletion.automaticReallocate -ne $false) { throw 'Partial completion behavior mismatch.' }
    if ($browserEvidence.partialCompletion.craftListRevisionBefore -ne $browserEvidence.partialCompletion.craftListRevisionAfter) { throw 'Chrome partial completion changed craftListRevision.' }
    if ($browserEvidence.partialCompletion.cardRevisionAfter -ne ($browserEvidence.partialCompletion.cardRevisionBefore + 1)) { throw 'Chrome partial cardRevision mismatch.' }
    if ($browserEvidence.staleReservation.code -ne 'STALE_RESERVATION' -or $browserEvidence.staleReservation.writesByAttempt -ne 0 -or $browserEvidence.staleReservation.fallbackConsumed -ne $false) { throw 'Stale-reservation fail-closed proof mismatch.' }
    if ($browserEvidence.idempotency.replayCode -ne 'ALREADY_COMPLETED' -or $browserEvidence.idempotency.secondDeduction -ne $false) { throw 'Replay idempotency proof mismatch.' }
    if (@($browserEvidence.atomicRollback.failures).Count -lt 4 -or @($browserEvidence.atomicRollback.failures | Where-Object { -not $_.allStoresUnchanged }).Count -ne 0) { throw 'Atomic rollback proof mismatch.' }
    if ($browserEvidence.fullCompletion.cardRemoved -ne $true -or $browserEvidence.fullCompletion.oneUnitRemainder -ne 1) { throw 'Full completion or exact one-unit remainder mismatch.' }
    if ($browserEvidence.fullCompletion.craftListRevisionAfter -ne ($browserEvidence.fullCompletion.craftListRevisionBefore + 1)) { throw 'Chrome full completion craftListRevision mismatch.' }
    if ($browserEvidence.reloadGate.inventoryUnits -ne 1 -or $browserEvidence.reloadGate.historyEvents -ne 2 -or $browserEvidence.reloadGate.reservationAutomaticallyValid -ne $false) { throw 'Reload persistence proof mismatch.' }
    if ($browserEvidence.craftRunInputBlocker.reservationReason -ne 'CRAFT_RUN_INPUTS_UNPROVEN' -or $browserEvidence.craftRunInputBlocker.confirmationReachable -ne $false -or $browserEvidence.craftRunInputBlocker.outputCountEvidence -ne 'OUTPUT_COUNT_UNPROVEN') { throw 'Chrome craft-run input blocker mismatch.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED') { throw 'Direct file gate is not PASS.' }
    if (@($browserEvidence.applicationOriginConsoleErrors).Count -ne 0 -or @($browserEvidence.fileGate.consoleErrors).Count -ne 0) { throw 'Browser console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C004'
        status = 'PASS_ATOMIC_CRAFT_COMPLETE_CORE'
        validationHead = (& git rev-parse HEAD).Trim()
        c003Checkpoint = $c003Checkpoint
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        transactionStores = @($modelEvidence.transaction.stores)
        transactionResolution = 'transaction.oncomplete'
        historyWrite = 'add'
        idempotencyReplay = $browserEvidence.idempotency.replayCode
        staleReservation = $browserEvidence.staleReservation.code
        fallbackConsumption = $browserEvidence.staleReservation.fallbackConsumed
        exactUnitTolerance = 0
        oneUnitRemainder = $browserEvidence.fullCompletion.oneUnitRemainder
        partialCompletion = $browserEvidence.partialCompletion.status
        fullCompletion = $browserEvidence.fullCompletion.status
        atomicRollbackStages = @($browserEvidence.atomicRollback.failures).Count
        reloadPersistence = $browserEvidence.reloadGate.status
        craftRunInputBlocker = $browserEvidence.craftRunInputBlocker.reservationReason
        outputCountDiagnostic = $browserEvidence.craftRunInputBlocker.outputCountEvidence
        directFileGate = $browserEvidence.fileGate.status
        applicationOriginConsoleErrors = 0
        localRuntimeSidecars = 0
        applicationRuntimeFileCount = 1
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        v001V002Unchanged = $true
        historyUi = 'NOT_IMPLEMENTED'
        undo = 'NOT_IMPLEMENTED'
        redo = 'NOT_IMPLEMENTED'
        broadcastChannel = 'NOT_IMPLEMENTED'
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_ATOMIC_CRAFT_COMPLETE_CORE')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add("directFileGate=$($browserEvidence.fileGate.status)")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C004_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
