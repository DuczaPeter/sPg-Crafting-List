#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath,
    [switch]$ReuseExistingEvidence
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedInputHead = '8b7efea39a79d7d22cc61ef8634b1320c8db81ed'
$expectedInputApplicationSha = '9cf79521aa9d1e46ed2494cdbbed80723f6cb52c2937497f264bc146ed20d365'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C007.1'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C007.1 Multi-tab User Data Safety validation')

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
        throw "$Name failed with exit code $exitCode"
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
    Invoke-BoundedCheck 'c0071-node-syntax-model' 'node' @('--check', '.\tools\run-v004-c0071-tests.mjs')
    Invoke-BoundedCheck 'c0071-node-syntax-browser' 'node' @('--check', '.\tools\run-v004-c0071-browser-tests.mjs')
    Invoke-BoundedCheck 'c0071-node-syntax-bfcache-probe' 'node' @('--check', '.\tools\probe-v004-c0071-bfcache.mjs')

    if (-not $ReuseExistingEvidence) {
        Invoke-BoundedCheck 'c0061-backup-model-regression' 'node' @('.\tools\run-v004-c0061-tests.mjs')
        Invoke-BoundedCheck 'c0061-backup-chrome-regression' 'node' @('.\tools\run-v004-c0061-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
        Invoke-BoundedCheck 'c007-multi-tab-model-regression' 'node' @('.\tools\run-v004-c007-tests.mjs')
        Invoke-BoundedCheck 'c007-multi-tab-chrome-regression' 'node' @('.\tools\run-v004-c007-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
        Invoke-BoundedCheck 'c0071-user-data-safety-model' 'node' @('.\tools\run-v004-c0071-tests.mjs')
        Invoke-BoundedCheck 'c0071-user-data-safety-chrome' 'node' @('.\tools\run-v004-c0071-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    } else {
        $lines.Add('targeted-execution=REUSED_FRESH_CURRENT_BYTE_EVIDENCE')
        Write-Output 'PASS targeted-execution-reuse'
    }

    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()
    $evidenceSet = @(
        @{ Name = 'C006.1 model'; Value = Read-Evidence 'test-artifacts\V004-C006.1\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C006.1 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C006.1\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C007 model'; Value = Read-Evidence 'test-artifacts\V004-C007\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C007 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C007\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' },
        @{ Name = 'C007.1 model'; Value = Read-Evidence 'test-artifacts\V004-C007.1\model-evidence.json'; Status = 'PASS_TARGETED_MODEL' },
        @{ Name = 'C007.1 Chrome'; Value = Read-Evidence 'test-artifacts\V004-C007.1\browser-evidence.json'; Status = 'PASS_TARGETED_CHROME' }
    )
    foreach ($entry in $evidenceSet) {
        if ($entry.Value.status -ne $entry.Status) { throw "$($entry.Name) status mismatch." }
        if ($entry.Value.applicationSha256 -ne $applicationSha) { throw "$($entry.Name) evidence does not match current application bytes." }
    }

    $modelEvidence = $evidenceSet[4].Value
    $browserEvidence = $evidenceSet[5].Value
    $preFixEvidence = Read-Evidence 'test-artifacts\V004-C007.1\bfcache-pre-fix-evidence.json'
    if ($preFixEvidence.applicationRef -ne $expectedInputHead -or $preFixEvidence.checkpointWorkingTreeSha256 -ne $expectedInputApplicationSha -or $preFixEvidence.status -ne 'FAIL_REPRODUCED') { throw 'C007 input-checkpoint BFCache reproduction evidence mismatch.' }
    if ($preFixEvidence.result.pageShows[-1].persisted -ne $true -or $preFixEvidence.result.signalStatus -ne 'CLOSED' -or $preFixEvidence.result.runtimeBatchCount -ne 0 -or $preFixEvidence.result.durableBatchCount -ne 1) { throw 'C007 BFCache defect was not reproduced as documented.' }

    if ($modelEvidence.miningLoadouts.mutationType -ne 'MINING_LOADOUTS_CHANGED' -or $modelEvidence.miningLoadouts.signalAfterDurableCommit -ne $true -or $modelEvidence.miningLoadouts.payloadContainsLoadoutData -ne $false -or $modelEvidence.miningLoadouts.durableRereadForced -ne $true) { throw 'Mining Loadouts signal/authority contract mismatch.' }
    if ($modelEvidence.importPrecondition.authority -ne 'INDEXEDDB_TRANSACTION_EXACT_PRE_STATE_FINGERPRINT' -or $modelEvidence.importPrecondition.comparisonBeforeWrite -ne $true -or $modelEvidence.importPrecondition.blocker -ne 'IMPORT_BASE_STATE_CHANGED' -or $modelEvidence.importPrecondition.automaticRetry -ne $false -or $modelEvidence.importPrecondition.snapshotSameTransaction -ne $true -or $modelEvidence.importPrecondition.snapshotUsesExactDurablePreState -ne $true) { throw 'Backup import durable precondition contract mismatch.' }
    if ($modelEvidence.bfcache.pagehideClose -ne $true -or $modelEvidence.bfcache.persistedPageshowReopen -ne $true -or $modelEvidence.bfcache.durableReread -ne $true -or $modelEvidence.bfcache.activeListenerCountContract -ne 1) { throw 'BFCache lifecycle model mismatch.' }
    if ($modelEvidence.backup.schemaVersion -ne 3 -or $modelEvidence.backup.sessionFieldsIncluded -ne 0) { throw 'Backup schema/session contract changed.' }
    if ($modelEvidence.singleFile.runtimeFiles -ne 1 -or $modelEvidence.singleFile.sidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0) { throw 'Single-file model gate failed.' }

    if ($browserEvidence.miningLoadoutsCrossTab.status -ne 'PASS' -or $browserEvidence.miningLoadoutsCrossTab.payloadContainsLoadoutData -ne $false -or $browserEvidence.miningLoadoutsCrossTab.presentationOnlyBroadcasts -ne 0 -or $browserEvidence.miningLoadoutsCrossTab.presentationOnlyDurableWrites -ne 0 -or $browserEvidence.miningLoadoutsCrossTab.automaticReallocate -ne $false) { throw 'Mining Loadouts cross-tab Chrome gate failed.' }
    if ($browserEvidence.concurrentCompleteImport.status -ne 'PRESERVED' -or $browserEvidence.concurrentCompleteImport.blocker -ne 'IMPORT_BASE_STATE_CHANGED' -or $browserEvidence.concurrentCompleteImport.historyStatusAfterBlockedImport -ne 'COMPLETED' -or $browserEvidence.concurrentCompleteImport.blockedSnapshotWrites -ne 0 -or $browserEvidence.concurrentCompleteImport.newPreviewImport -ne 'PASS' -or $browserEvidence.concurrentCompleteImport.automaticRetry -ne $false -or $browserEvidence.concurrentCompleteImport.exactPreImportSnapshot -ne $true) { throw 'Concurrent Complete/import safety failed.' }
    if ($browserEvidence.concurrentUndoImport.status -ne 'PRESERVED' -or $browserEvidence.concurrentUndoImport.blocker -ne 'IMPORT_BASE_STATE_CHANGED' -or $browserEvidence.concurrentUndoImport.historyStatus -ne 'UNDONE' -or $browserEvidence.concurrentUndoImport.blockedSnapshotWrites -ne 0 -or $browserEvidence.concurrentUndoImport.automaticRetry -ne $false) { throw 'Concurrent Undo/import safety failed.' }
    if ($browserEvidence.concurrentLoadoutImport.status -ne 'PRESERVED' -or $browserEvidence.concurrentLoadoutImport.blocker -ne 'IMPORT_BASE_STATE_CHANGED' -or $browserEvidence.concurrentLoadoutImport.blockedSnapshotWrites -ne 0) { throw 'Concurrent Mining Loadout/import safety failed.' }
    if ($browserEvidence.pristineReplace.status -ne 'PASS' -or $browserEvidence.pristineReplace.schemaVersion -ne 3 -or $browserEvidence.pristineReplace.structuralJsonEqual -ne $true -or $browserEvidence.pristineReplace.extraRevisionIncrement -ne 0 -or $browserEvidence.pristineReplace.backupDataLoss -ne 0) { throw 'C006.1 pristine exact REPLACE regression failed.' }
    if ($browserEvidence.bfcache.status -ne 'PASS' -or $browserEvidence.bfcache.persisted -ne $true -or $browserEvidence.bfcache.channelAfterReturn -ne 'READY' -or $browserEvidence.bfcache.durableUiRefreshed -ne $true -or $browserEvidence.bfcache.listenerCount -ne 1 -or $browserEvidence.bfcache.duplicateListener -ne 0 -or $browserEvidence.bfcache.reloadTabIdChanged -ne $true -or $browserEvidence.bfcache.listenerAfterReload -ne 1) { throw 'BFCache/reload lifecycle Chrome gate failed.' }
    if ($browserEvidence.directFile.status -ne 'PASS_AUTOMATED' -or $browserEvidence.directFile.protocol -ne 'file:' -or $browserEvidence.directFile.miningLoadoutSignal -ne 'PASS' -or $browserEvidence.directFile.durableReread -ne 'PASS' -or $browserEvidence.directFile.runtimeFiles -ne 1 -or $browserEvidence.directFile.sidecars -ne 0 -or $browserEvidence.directFile.overflow -gt 0) { throw 'Direct file/single-file gate failed.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'C007.1 Chrome console errors detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C007.1'
        status = 'PASS_MULTI_TAB_USER_DATA_SAFETY_RELEASE_GATE_READY'
        validationHead = $head
        inputApplicationSha256 = $expectedInputApplicationSha
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        miningLoadoutsCrossTab = 'PASS'
        backupImportConcurrentChange = 'FAIL_CLOSED_PASS'
        concurrentComplete = 'PRESERVED'
        concurrentUndo = 'PRESERVED'
        concurrentMiningLoadout = 'PRESERVED'
        automaticImportRetry = 'NO'
        exactPreImportSnapshot = 'PASS'
        backupSchemaVersion = 3
        backupDataLoss = 0
        pristineReplace = 'PASS'
        bfcacheDefectAtInputCheckpoint = 'REPRODUCED'
        bfcacheLifecycle = 'PASS'
        duplicateListener = 0
        directFileGate = $browserEvidence.directFile.status
        runtimeFiles = 1
        sidecars = 0
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        fullRegression = 'NOT_RUN_BY_SCOPE'
        releaseGate = 'NOT_STARTED_BY_SCOPE'
        push = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_MULTI_TAB_USER_DATA_SAFETY_RELEASE_GATE_READY')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add('backupDataLoss=0')
    $lines.Add('duplicateListener=0')
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    $lines.Add('releaseGate=NOT_STARTED_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0071_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
