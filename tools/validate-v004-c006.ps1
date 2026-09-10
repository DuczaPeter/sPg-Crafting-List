#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedInputHead = '7972659a1cc987a2056eedf5703992183ec58770'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C006'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C006 Craft History Undo validation')

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
    foreach ($line in @($output | Select-Object -Last 50)) { $lines.Add([string]$line) }
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
    Invoke-BoundedCheck 'c006-node-syntax-model' 'node' @('--check', '.\tools\run-v004-c006-tests.mjs')
    Invoke-BoundedCheck 'c006-node-syntax-browser' 'node' @('--check', '.\tools\run-v004-c006-browser-tests.mjs')
    Invoke-BoundedCheck 'c0044-completion-model-regression' 'node' @('.\tools\run-v004-c0044-tests.mjs')
    Invoke-BoundedCheck 'c0044-completion-chrome-regression' 'node' @('.\tools\run-v004-c0044-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c005-history-model-regression' 'node' @('.\tools\run-v004-c005-tests.mjs')
    Invoke-BoundedCheck 'c005-history-chrome-regression' 'node' @('.\tools\run-v004-c005-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c006-undo-model' 'node' @('.\tools\run-v004-c006-tests.mjs')
    Invoke-BoundedCheck 'c006-undo-chrome' 'node' @('.\tools\run-v004-c006-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c005ModelEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C005\model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c005BrowserEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C005\browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c0044ModelEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C004.4\model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c0044BrowserEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C004.4\browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()

    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C006 model or Chrome evidence is not PASS.' }
    if ($c005ModelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $c005BrowserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C005 History regression evidence is not PASS.' }
    if ($c0044ModelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $c0044BrowserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C004.4 completion regression evidence is not PASS.' }
    foreach ($evidence in @($modelEvidence, $browserEvidence, $c005ModelEvidence, $c005BrowserEvidence, $c0044ModelEvidence, $c0044BrowserEvidence)) {
        if ($evidence.applicationSha256 -ne $applicationSha) { throw 'Evidence does not match current application bytes.' }
    }

    if ($modelEvidence.eligibility.latestActiveOnly -ne $true -or $modelEvidence.eligibility.lifo -ne $true -or $modelEvidence.eligibility.legacy -ne 'BLOCKED') { throw 'Undo eligibility/LIFO model mismatch.' }
    if ($modelEvidence.eligibility.cardEdit -ne 'BLOCKED' -or $modelEvidence.eligibility.fullListChange -ne 'BLOCKED') { throw 'Card/list revision blocker model mismatch.' }
    if ($modelEvidence.partialUndo.quantity -ne '1 -> 5' -or @($modelEvidence.partialUndo.restoreModes) -join ',' -ne 'RECREATED,MERGED,MERGED') { throw 'Partial Undo model mismatch.' }
    if ($modelEvidence.fullUndo.restoredQuantity -ne 5 -or $modelEvidence.fullUndo.restoredOrder -ne 0) { throw 'Full Undo model mismatch.' }
    if ($modelEvidence.targetedDeltaRestore.unrelatedBatchUnitsAfter -ne 5000 -or $modelEvidence.targetedDeltaRestore.globalInventoryRevisionMismatchAllowed -ne $true) { throw 'Targeted inventory delta model mismatch.' }
    if ($modelEvidence.exactBatchRestore.recreated -ne $true -or $modelEvidence.exactBatchRestore.merged -ne $true -or $modelEvidence.exactBatchRestore.incompatibleCollision -ne 'UNDO_BATCH_ID_COLLISION') { throw 'Exact batch restore model mismatch.' }
    if ($modelEvidence.lifo.beforeUndoB -ne 'NOT_LATEST_ACTIVE_EVENT' -or $modelEvidence.lifo.afterUndoBEventAEligible -ne $true -or $modelEvidence.lifo.finalCardQuantity -ne 5) { throw 'LIFO chain model mismatch.' }
    if ($modelEvidence.idempotency.secondUndo -ne 'ALREADY_UNDONE' -or $modelEvidence.idempotency.writes -ne 0) { throw 'Double Undo model mismatch.' }
    if ($modelEvidence.history.status -ne 'UNDONE' -or $modelEvidence.history.historySequenceChanged -ne $false -or $modelEvidence.history.immutableCompletionEvidence -ne $true) { throw 'History Undo evidence model mismatch.' }
    if (@($modelEvidence.transaction.stores) -join ',' -ne 'materialBatches,userInventory,craftingCards,craftHistory,userMeta' -or @($modelEvidence.transaction.failureStages).Count -ne 4) { throw 'Undo transaction model mismatch.' }
    if ($modelEvidence.exclusions.redo -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.historyDelete -ne 'NOT_IMPLEMENTED' -or $modelEvidence.exclusions.fullInventorySnapshotRollback -ne $false) { throw 'C006 scope exclusion mismatch.' }
    if ($modelEvidence.backup.schema -ne 3 -or $modelEvidence.conservation.materialRoundTripLossUnits -ne 0 -or $modelEvidence.conservation.normalizationRerun -ne $false) { throw 'Backup/conservation model mismatch.' }
    if ($modelEvidence.singleFile.runtimeFiles -ne 1 -or $modelEvidence.singleFile.sidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0 -or $modelEvidence.singleFile.localRuntimeJson -ne 0) { throw 'Single-file model gate failed.' }

    if ($browserEvidence.productionBlueprint.uuid -ne '280f47b7-8434-410c-b854-380768fdccec' -or @($browserEvidence.productionBlueprint.requiredUnitsPerCraft) -join ',' -ne '3600,7,7') { throw 'Production blueprint evidence mismatch.' }
    if ($browserEvidence.partialUndo.status -ne 'PASS' -or $browserEvidence.partialUndo.quantity -ne '21 -> 16 -> 21' -or @($browserEvidence.partialUndo.consumedAndRestoredUnits) -join ',' -ne '18000,35,35') { throw 'Partial Undo Chrome path failed.' }
    if ($browserEvidence.partialUndo.cancelDurableWrites -ne 0 -or $browserEvidence.partialUndo.doubleUndo.durableWrites -ne 0 -or $browserEvidence.partialUndo.doubleUndo.code -ne 'ALREADY_UNDONE') { throw 'Cancel or double Undo wrote data.' }
    if ($browserEvidence.partialUndo.unrelatedBatchUnits -ne 5000 -or $browserEvidence.partialUndo.materialRoundTripLossUnits -ne 0 -or $browserEvidence.partialUndo.automaticReallocate -ne $false -or $browserEvidence.partialUndo.reservationAfter -ne 'STALE') { throw 'Targeted restore/stale reservation Chrome mismatch.' }
    if ($browserEvidence.lifo.status -ne 'PASS' -or $browserEvidence.lifo.order -ne 'SECOND_THEN_FIRST' -or $browserEvidence.lifo.finalInventoryEqualsInitial -ne $true) { throw 'LIFO Chrome path failed.' }
    if ($browserEvidence.fullUndo.status -ne 'PASS' -or $browserEvidence.fullUndo.cardRemovedThenRestored -ne $true -or $browserEvidence.fullUndo.exactOriginalIdentityAndSettings -ne $true -or @($browserEvidence.fullUndo.restoreModes) -join ',' -ne 'RECREATED,RECREATED,RECREATED') { throw 'Full Undo Chrome path failed.' }
    if ($browserEvidence.blockers.cardSemanticEdit.code -ne 'UNDO_CARD_REVISION_MISMATCH' -or $browserEvidence.blockers.cardSemanticEdit.durableWrites -ne 0) { throw 'Card edit blocker failed.' }
    if ($browserEvidence.blockers.fullListMutation.code -ne 'UNDO_CRAFT_LIST_REVISION_MISMATCH' -or $browserEvidence.blockers.fullListMutation.durableWrites -ne 0) { throw 'Full list blocker failed.' }
    if ($browserEvidence.blockers.incompatibleBatchId.code -ne 'UNDO_BATCH_ID_COLLISION' -or $browserEvidence.blockers.incompatibleBatchId.durableWrites -ne 0) { throw 'Batch collision blocker failed.' }
    if ($browserEvidence.rollback.status -ne 'PASS_ATOMIC' -or @($browserEvidence.rollback.stages).Count -ne 4 -or @($browserEvidence.rollback.stages | Where-Object { $_.durableWrites -ne 0 -or $_.status -ne 'ROLLED_BACK' }).Count -ne 0) { throw 'Injected transaction rollback failed.' }
    if ($browserEvidence.legacy.status -ne 'BLOCKED' -or $browserEvidence.legacy.undoButton -ne $false -or $browserEvidence.legacy.fabricatedEvidence -ne $false) { throw 'Legacy Undo fail-closed UI failed.' }
    if ($browserEvidence.layout.status -ne 'PASS_NO_HORIZONTAL_OVERFLOW' -or $browserEvidence.layout.desktop.documentOverflow -gt 1 -or $browserEvidence.layout.mobile.documentOverflow -gt 1) { throw 'Undo desktop/mobile overflow gate failed.' }
    if ($browserEvidence.reload.partial.status -ne 'PASS' -or $browserEvidence.reload.full.status -ne 'PASS') { throw 'Undo reload gate failed.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED_DIRECT_FILE' -or $browserEvidence.fileGate.version -ne 'V004-dev' -or $browserEvidence.fileGate.runtimeFileCount -ne 1 -or $browserEvidence.fileGate.localRuntimeSidecars -ne 0) { throw 'Direct file or single-file gate failed.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'C006 Chrome console or page error detected.' }

    if ($c005ModelEvidence.grouping.cardIdentity -ne 'craftingCardId' -or @($c005ModelEvidence.grouping.firstOrder) -join ',' -ne 'card-b,card-a' -or @($c005ModelEvidence.grouping.eventOrder) -join ',' -ne '4,2,1') { throw 'C005 grouping/sort regression failed.' }
    if ($c005BrowserEvidence.presentationOnly.status -ne 'PASS_ZERO_WRITES' -or $c005BrowserEvidence.production.materialLossUnits -ne 0 -or $c005BrowserEvidence.fileGate.status -ne 'PASS_AUTOMATED') { throw 'C005 UI/Complete/direct-file regression failed.' }
    if ($c0044BrowserEvidence.productionExact.status -ne 'PASS' -or $c0044BrowserEvidence.productionExact.materialLossUnits -ne 0 -or $c0044BrowserEvidence.fileGate.status -ne 'PASS_AUTOMATED') { throw 'C004.4 exact completion regression failed.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C006'
        status = 'PASS_CRAFT_HISTORY_UNDO'
        validationHead = $head
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        undoEligibility = 'LIFO PASS'
        partialUndo = 'PASS'
        fullUndo = 'PASS'
        exactBatchRestore = 'PASS'
        targetedDeltaRestore = 'PASS'
        legacyUndo = 'BLOCKED'
        doubleUndo = 'BLOCKED'
        redo = 'NOT_IMPLEMENTED'
        historyDelete = 'NOT_IMPLEMENTED'
        materialRoundTripLossUnits = 0
        craftCompleteRegression = 'PASS'
        directFileGate = $browserEvidence.fileGate.status
        runtimeFiles = 1
        sidecars = 0
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_CRAFT_HISTORY_UNDO')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add('materialRoundTripLossUnits=0')
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C006_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
