#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedInputHead = 'da8515accbc8e60f22a76d32be2427a314cef77f'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C007'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C007 Multi-tab coherence validation')

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
    foreach ($line in @($output | Select-Object -Last 60)) { $lines.Add([string]$line) }
    if ($exitCode -ne 0) {
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $Name exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $Name"
}

function Read-Evidence {
    param([string]$RelativePath)
    $path = Join-Path $projectRoot $RelativePath
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
}

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $head = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'develop/V004') { throw "Unexpected branch: $branch" }
    if ($head -ne $expectedInputHead) { throw "Unexpected input HEAD: $head" }
    if (-not (Test-Path -LiteralPath $PlaywrightModulePath)) { throw "Playwright module not found: $PlaywrightModulePath" }

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
    if ($LASTEXITCODE -ne 0) { throw 'V001/V002/V003 release path differs from the protected baseline.' }
    & git diff --quiet HEAD -- releases/V001 releases/V002 releases/V003 'test-artifacts/V003-*' 'docs/V003*'
    if ($LASTEXITCODE -ne 0) { throw 'Protected V003/V001/V002 working-tree change detected.' }

    Invoke-BoundedCheck 'baseline-static' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c007-node-syntax-model' 'node' @('--check', '.\tools\run-v004-c007-tests.mjs')
    Invoke-BoundedCheck 'c007-node-syntax-browser' 'node' @('--check', '.\tools\run-v004-c007-browser-tests.mjs')
    Invoke-BoundedCheck 'c0044-exact-consumption-model-regression' 'node' @('.\tools\run-v004-c0044-tests.mjs')
    Invoke-BoundedCheck 'c0044-exact-consumption-chrome-regression' 'node' @('.\tools\run-v004-c0044-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c005-history-model-regression' 'node' @('.\tools\run-v004-c005-tests.mjs')
    Invoke-BoundedCheck 'c005-history-chrome-regression' 'node' @('.\tools\run-v004-c005-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c006-undo-model-regression' 'node' @('.\tools\run-v004-c006-tests.mjs')
    Invoke-BoundedCheck 'c006-undo-chrome-regression' 'node' @('.\tools\run-v004-c006-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c0061-backup-model-regression' 'node' @('.\tools\run-v004-c0061-tests.mjs')
    Invoke-BoundedCheck 'c0061-backup-chrome-regression' 'node' @('.\tools\run-v004-c0061-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c007-multi-tab-model' 'node' @('.\tools\run-v004-c007-tests.mjs')
    Invoke-BoundedCheck 'c007-multi-tab-chrome' 'node' @('.\tools\run-v004-c007-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()
    $evidenceSet = @(
        @{ Name = 'C004.4 model'; Value = Read-Evidence 'test-artifacts\V004-C004.4\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C004.4 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C004.4\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C005 model'; Value = Read-Evidence 'test-artifacts\V004-C005\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C005 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C005\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C006 model'; Value = Read-Evidence 'test-artifacts\V004-C006\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C006 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C006\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C006.1 model'; Value = Read-Evidence 'test-artifacts\V004-C006.1\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C006.1 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C006.1\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C007 model'; Value = Read-Evidence 'test-artifacts\V004-C007\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C007 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C007\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' }
    )
    foreach ($entry in $evidenceSet) {
        if ($entry.Value.status -ne $entry.Status) { throw "$($entry.Name) status mismatch." }
        if ($entry.Value.applicationSha256 -ne $applicationSha) { throw "$($entry.Name) evidence does not match current application bytes." }
    }

    $modelEvidence = $evidenceSet[8].Value
    $browserEvidence = $evidenceSet[9].Value
    if ($modelEvidence.authority.broadcastChannel -ne 'UI_SIGNAL_ONLY' -or $modelEvidence.authority.indexedDb -ne 'DURABLE_AUTHORITY' -or $modelEvidence.authority.receiverAppliesPayloadAsState -ne $false -or $modelEvidence.authority.durableRereadBeforeUiUpdate -ne $true) { throw 'C007 durable-authority model mismatch.' }
    if ($modelEvidence.validation.valid -ne 'ACCEPTED' -or $modelEvidence.validation.malformed -ne 'IGNORED' -or $modelEvidence.validation.unsupportedVersion -ne 'IGNORED' -or $modelEvidence.validation.selfMessage -ne 'IGNORED' -or $modelEvidence.validation.duplicate -ne 'IGNORED' -or $modelEvidence.validation.outOfOrder -ne 'IGNORED') { throw 'C007 protocol validation mismatch.' }
    if ($modelEvidence.revisionReconciliation.newerDurableRefresh -ne $true -or $modelEvidence.revisionReconciliation.equalIgnored -ne $true -or $modelEvidence.revisionReconciliation.normalRegressionIgnored -ne $true -or $modelEvidence.revisionReconciliation.backupImportForceAllowsExactLowerOrEqualRestore -ne $true) { throw 'C007 revision reconciliation mismatch.' }
    if ($modelEvidence.lifecycle.repeatedOpenListenerRegistrations -ne 1 -or $modelEvidence.lifecycle.senderRefreshLoop -ne $false -or $modelEvidence.lifecycle.unavailableFallback -ne 'MULTI_TAB_SIGNAL_UNAVAILABLE') { throw 'C007 lifecycle/fallback model mismatch.' }
    if ($modelEvidence.authority.automaticReallocate -ne $false -or $modelEvidence.presentationOnly.broadcasts -ne 0 -or $modelEvidence.presentationOnly.durableWrites -ne 0) { throw 'C007 prohibited automatic behavior detected.' }
    if ($modelEvidence.singleFile.runtimeFiles -ne 1 -or $modelEvidence.singleFile.sidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0) { throw 'C007 single-file model gate failed.' }

    if ($browserEvidence.architecture.broadcastChannel -ne 'UI_SIGNAL_ONLY' -or $browserEvidence.architecture.indexedDb -ne 'DURABLE_AUTHORITY') { throw 'C007 Chrome architecture mismatch.' }
    if ($browserEvidence.twoTabCraftComplete.status -ne 'PASS' -or $browserEvidence.twoTabCraftComplete.reservationStatus -ne 'STALE' -or $browserEvidence.twoTabCraftComplete.automaticReallocate -ne $false -or $browserEvidence.twoTabCraftComplete.doubleConsumptionUnits -ne 0) { throw 'Two-tab Craft Complete failed.' }
    if ($browserEvidence.twoTabUndo.status -ne 'PASS' -or $browserEvidence.twoTabUndo.secondUndo -ne 'ALREADY_UNDONE' -or $browserEvidence.twoTabUndo.doubleRestoreUnits -ne 0 -or $browserEvidence.twoTabUndo.inventoryEqualsInitial -ne $true) { throw 'Two-tab Undo failed.' }
    if ($browserEvidence.concurrency.complete -ne 'SINGLE_COMMIT_PASS' -or $browserEvidence.concurrency.undo -ne 'SINGLE_RESTORE_PASS' -or $browserEvidence.concurrency.negativeInventory -ne $false -or $browserEvidence.concurrency.duplicateHistoryCompletion -ne $false -or $browserEvidence.concurrency.materialLossUnits -ne 0) { throw 'Concurrent Complete/Undo conservation failed.' }
    if ($browserEvidence.messageLoss.status -ne 'PASS' -or $browserEvidence.messageLoss.oldCompletion -ne 'STALE_RESERVATION' -or $browserEvidence.messageLoss.doubleConsumptionUnits -ne 0) { throw 'Message-loss correctness failed.' }
    if ($browserEvidence.inventorySync.status -ne 'PASS' -or $browserEvidence.inventorySync.automaticReallocate -ne $false -or $browserEvidence.cardSync.status -ne 'PASS' -or $browserEvidence.cardSync.automaticReallocate -ne $false) { throw 'Cross-tab inventory/card sync failed.' }
    if ($browserEvidence.backupImport.status -ne 'PASS' -or $browserEvidence.backupImport.dedicatedSignal -ne 'BACKUP_IMPORTED' -or $browserEvidence.backupImport.equalRevisionForcedRefresh -ne $true -or $browserEvidence.backupImport.exactZeroRevisionsPreserved -ne $true -or $browserEvidence.backupImport.automaticReallocate -ne $false) { throw 'Backup import cross-tab refresh failed.' }
    if ($browserEvidence.migration.status -ne 'PASS' -or $browserEvidence.migration.sourceAccess -ne 'READ_ONLY' -or $browserEvidence.migration.sourceUnchanged -ne $true) { throw 'Migration cross-tab refresh failed.' }
    if ($browserEvidence.unavailableFallback.status -ne 'PASS' -or $browserEvidence.unavailableFallback.staleCompletion -ne 'STALE_RESERVATION' -or $browserEvidence.unavailableFallback.doubleConsumptionUnits -ne 0) { throw 'BroadcastChannel unavailable fallback failed.' }
    if ($browserEvidence.fullCompletionListGuard.status -ne 'PASS' -or $browserEvidence.fullCompletionListGuard.undoBlocker -ne 'UNDO_CRAFT_LIST_REVISION_MISMATCH' -or $browserEvidence.fullCompletionListGuard.broadcastBypass -ne $false) { throw 'Stale reservation/list protection failed.' }
    if ($browserEvidence.lifecycle.status -ne 'PASS' -or $browserEvidence.lifecycle.tabIdChangedOnReload -ne $true -or $browserEvidence.lifecycle.listenerRegistrationsAfterReload -ne 1 -or $browserEvidence.lifecycle.repeatedOpenListenerRegistrations -ne 1) { throw 'Multi-tab reload lifecycle failed.' }
    if ($browserEvidence.directFile.status -ne 'PASS_AUTOMATED' -or $browserEvidence.directFile.protocol -ne 'file:' -or $browserEvidence.directFile.sameFileMultiTabSignal -ne 'PASS' -or $browserEvidence.directFile.durableAuthority -ne 'PASS' -or $browserEvidence.directFile.runtimeFiles -ne 1 -or $browserEvidence.directFile.sidecars -ne 0 -or $browserEvidence.directFile.overflow -gt 0) { throw 'Direct file/single-file multi-tab gate failed.' }
    if ($browserEvidence.responsive.status -ne 'PASS_NO_HORIZONTAL_OVERFLOW' -or @($browserEvidence.consoleErrors).Count -ne 0) { throw 'C007 responsive or console gate failed.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C007'
        status = 'PASS_MULTI_TAB_COHERENCE'
        validationHead = $head
        inputApplicationSha256 = 'ecbb85cee6fc0ae92c0b2338e392806f7fac72befb430e2bbb40f3ab717f71b5'
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        broadcastChannel = 'UI_SIGNAL_ONLY'
        indexedDb = 'DURABLE_AUTHORITY'
        twoTabCraftComplete = 'PASS'
        twoTabUndo = 'PASS'
        concurrentComplete = 'SINGLE_COMMIT_PASS'
        concurrentUndo = 'SINGLE_RESTORE_PASS'
        messageLossCorrectness = 'PASS'
        staleReservationProtection = 'PASS'
        backupImportCrossTabRefresh = 'PASS'
        automaticReallocate = 'NO'
        broadcastChannelUnavailableFallback = 'PASS'
        craftUndoMaterialLossUnits = 0
        directFileGate = $browserEvidence.directFile.status
        runtimeFiles = 1
        sidecars = 0
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_MULTI_TAB_COHERENCE')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add('craftUndoMaterialLossUnits=0')
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C007_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
