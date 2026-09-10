#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedInputHead = '4bb3303dea206b65dd51d9c911ac69b5517a443d'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C006.1'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C006.1 Undo backup round-trip validation')

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
    Invoke-BoundedCheck 'c0061-node-syntax-model' 'node' @('--check', '.\tools\run-v004-c0061-tests.mjs')
    Invoke-BoundedCheck 'c0061-node-syntax-browser' 'node' @('--check', '.\tools\run-v004-c0061-browser-tests.mjs')
    Invoke-BoundedCheck 'c002-v003-migration-chrome-regression' 'node' @('.\tools\run-v004-c002-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c006-undo-model-regression' 'node' @('.\tools\run-v004-c006-tests.mjs')
    Invoke-BoundedCheck 'c006-undo-chrome-regression' 'node' @('.\tools\run-v004-c006-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c0061-roundtrip-model' 'node' @('.\tools\run-v004-c0061-tests.mjs')
    Invoke-BoundedCheck 'c0061-roundtrip-chrome' 'node' @('.\tools\run-v004-c0061-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c006ModelEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C006\model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c006BrowserEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C006\browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c002BrowserEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C002\browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()

    foreach ($evidence in @($modelEvidence, $browserEvidence, $c006ModelEvidence, $c006BrowserEvidence, $c002BrowserEvidence)) {
        if ($evidence.applicationSha256 -ne $applicationSha) { throw 'Evidence does not match current application bytes.' }
    }
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C006.1 model or Chrome evidence is not PASS.' }
    if ($c006ModelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $c006BrowserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C006 Undo regression evidence is not PASS.' }
    if ($c002BrowserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C002 V003 migration regression evidence is not PASS.' }

    if ($modelEvidence.backupSchemaVersion -ne 3 -or $modelEvidence.pristineReplace.exactRestore -ne $true -or $modelEvidence.pristineReplace.revisionIncrementAtSerializationBoundary -ne 0 -or $modelEvidence.pristineReplace.nonPristineRevisionInvalidationUnchanged -ne $true) { throw 'Pristine REPLACE round-trip model mismatch.' }
    if ($modelEvidence.partialUndo.structuralRoundTrip -ne $true -or $modelEvidence.partialUndo.historyStatus -ne 'UNDONE' -or $modelEvidence.partialUndo.consumedDeltasPreserved -ne $true -or $modelEvidence.partialUndo.restoredBatchEvidencePreserved -ne $true -or $modelEvidence.partialUndo.undoRevisionEvidencePreserved -ne $true) { throw 'Partial UNDONE History model mismatch.' }
    if ($modelEvidence.partialUndo.restoredInventoryPreserved -ne $true -or $modelEvidence.partialUndo.restoredCardPreserved -ne $true -or $modelEvidence.partialUndo.unknownHistoryFieldPreserved -ne $true) { throw 'Partial restored state model mismatch.' }
    if ($modelEvidence.fullUndo.structuralRoundTrip -ne $true -or $modelEvidence.fullUndo.restoredInventoryPreserved -ne $true -or $modelEvidence.fullUndo.restoredCardPreserved -ne $true -or $modelEvidence.fullUndo.userMetaPreserved -ne $true) { throw 'Full Undo round-trip model mismatch.' }
    if ($modelEvidence.lifoAfterImport.eventAEligible -ne $true -or $modelEvidence.lifoAfterImport.eventBStatus -ne 'UNDONE' -or $modelEvidence.lifoAfterImport.secondUndo -ne 'ALREADY_UNDONE' -or $modelEvidence.lifoAfterImport.writes -ne 0) { throw 'Imported LIFO/double Undo model mismatch.' }
    if ($modelEvidence.legacySchema3.status -ne 'FAIL_CLOSED_COMPATIBLE' -or $modelEvidence.legacySchema3.undoFieldsFabricated -ne $false -or $modelEvidence.legacySchema3.unknownFieldPreserved -ne $true) { throw 'Legacy schema-3 model mismatch.' }
    if ($modelEvidence.v003Migration.status -ne 'UNCHANGED' -or $modelEvidence.v003Migration.craftHistoryCount -ne 0 -or @($modelEvidence.v003Migration.revisionValues | Where-Object { $_ -ne 0 }).Count -ne 0) { throw 'V003 migration model changed.' }
    if ($modelEvidence.conservation.relevantDurableDelta -ne 0 -or $modelEvidence.conservation.backupDataLoss -ne 0 -or $modelEvidence.conservation.normalizationRerun -ne $false -or $modelEvidence.conservation.liveApiUsed -ne $false) { throw 'Round-trip conservation model mismatch.' }
    if ($modelEvidence.singleFile.runtimeFiles -ne 1 -or $modelEvidence.singleFile.sidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0) { throw 'Single-file model gate failed.' }

    if ($browserEvidence.backupSchemaVersion -ne 3) { throw 'Chrome backup schema mismatch.' }
    if ($browserEvidence.partialLifoRoundTrip.status -ne 'PASS' -or $browserEvidence.partialLifoRoundTrip.structuralJsonEqual -ne $true -or $browserEvidence.partialLifoRoundTrip.historyFieldsExact -ne $true -or $browserEvidence.partialLifoRoundTrip.consumedDeltasExact -ne $true -or $browserEvidence.partialLifoRoundTrip.restoredBatchEvidenceExact -ne $true) { throw 'Partial/LIFO Chrome round-trip failed.' }
    if ($browserEvidence.partialLifoRoundTrip.inventoryExact -ne $true -or $browserEvidence.partialLifoRoundTrip.cardExact -ne $true -or $browserEvidence.partialLifoRoundTrip.userMetaExact -ne $true -or $browserEvidence.partialLifoRoundTrip.unknownHistoryFieldPreserved -ne $true -or $browserEvidence.partialLifoRoundTrip.backupDataLoss -ne 0) { throw 'Partial Chrome durable state mismatch.' }
    if (@($browserEvidence.partialLifoRoundTrip.historyDom.sequences) -join ',' -ne '2,1' -or @($browserEvidence.partialLifoRoundTrip.historyDom.statuses) -join ',' -ne 'UNDONE,COMPLETED' -or $browserEvidence.partialLifoRoundTrip.historyDom.activeTotal -ne 5) { throw 'Imported History grouping/order mismatch.' }
    if ($browserEvidence.partialLifoRoundTrip.eligibilityAfterImport.completed -ne 'UNDO_READY' -or $browserEvidence.partialLifoRoundTrip.eligibilityAfterImport.undone -ne 'ALREADY_UNDONE' -or $browserEvidence.partialLifoRoundTrip.eligibilityAfterImport.durableWrites -ne 0) { throw 'LIFO/double Undo Chrome mismatch.' }
    if ($browserEvidence.fullRoundTrip.status -ne 'PASS' -or $browserEvidence.fullRoundTrip.structuralJsonEqual -ne $true -or $browserEvidence.fullRoundTrip.historyFieldsExact -ne $true -or $browserEvidence.fullRoundTrip.inventoryExact -ne $true -or $browserEvidence.fullRoundTrip.cardIdentityQuantityOrderBlueprintSlotsPoolsRevisionExact -ne $true -or $browserEvidence.fullRoundTrip.userMetaExact -ne $true -or $browserEvidence.fullRoundTrip.backupDataLoss -ne 0) { throw 'Full Undo Chrome round-trip failed.' }
    if ($browserEvidence.legacySchema3.status -ne 'FAIL_CLOSED_COMPATIBLE' -or $browserEvidence.legacySchema3.undoFieldsFabricated -ne $false -or $browserEvidence.legacySchema3.unknownFieldPreserved -ne $true -or $browserEvidence.legacySchema3.undoButtons -ne 0) { throw 'Legacy schema-3 Chrome compatibility failed.' }
    if ($browserEvidence.directFile.status -ne 'PASS_AUTOMATED' -or $browserEvidence.directFile.protocol -ne 'file:' -or $browserEvidence.directFile.runtimeFiles -ne 1 -or $browserEvidence.directFile.sidecars -ne 0 -or $browserEvidence.directFile.overflow -gt 1 -or $browserEvidence.directFile.structuralJsonEqual -ne $true -or $browserEvidence.directFile.backupDataLoss -ne 0) { throw 'Direct file/single-file round-trip failed.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'C006.1 Chrome console or page error detected.' }

    if ($c006ModelEvidence.idempotency.secondUndo -ne 'ALREADY_UNDONE' -or $c006ModelEvidence.idempotency.writes -ne 0 -or $c006ModelEvidence.conservation.materialRoundTripLossUnits -ne 0) { throw 'C006 model Undo regression failed.' }
    if ($c006BrowserEvidence.partialUndo.status -ne 'PASS' -or $c006BrowserEvidence.fullUndo.status -ne 'PASS' -or $c006BrowserEvidence.lifo.status -ne 'PASS' -or $c006BrowserEvidence.partialUndo.doubleUndo.durableWrites -ne 0 -or $c006BrowserEvidence.fileGate.status -ne 'PASS_AUTOMATED_DIRECT_FILE') { throw 'C006 Chrome Undo regression failed.' }
    if ($c002BrowserEvidence.migration.status -ne 'PASS' -or $c002BrowserEvidence.migration.sourceAccess -ne 'READ_ONLY' -or $c002BrowserEvidence.migration.sourceUnchangedAfterMigration -ne $true -or $c002BrowserEvidence.migration.craftHistoryLength -ne 0) { throw 'V003 migration Chrome regression failed.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C006.1'
        status = 'PASS_UNDO_BACKUP_ROUNDTRIP'
        validationHead = $head
        inputApplicationSha256 = 'ad0457cdf9655bfb03dfb4b6e9f924d5db71c2e8c55d1d8be215c0beea3b6ce5'
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        backupSchemaVersion = 3
        undoneHistoryRoundTrip = 'PASS'
        consumedDeltaPreservation = 'PASS'
        restoredInventoryPreservation = 'PASS'
        restoredCardPreservation = 'PASS'
        lifoAfterImport = 'PASS'
        doubleUndoAfterImport = 'BLOCKED'
        legacySchema3 = 'FAIL-CLOSED COMPATIBLE'
        v003Migration = 'UNCHANGED'
        backupDataLoss = 0
        directFileGate = $browserEvidence.directFile.status
        runtimeFiles = 1
        sidecars = 0
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        c007 = 'NOT STARTED'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_UNDO_BACKUP_ROUNDTRIP')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add('backupDataLoss=0')
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0061_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
