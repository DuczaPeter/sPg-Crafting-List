#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C005'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C005 Craft History UI validation')

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
    if ($branch -ne 'develop/V004') { throw "Unexpected branch: $branch" }
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
    Invoke-BoundedCheck 'c0044-completion-model-regression' 'node' @('.\tools\run-v004-c0044-tests.mjs')
    Invoke-BoundedCheck 'c0044-completion-chrome-regression' 'node' @('.\tools\run-v004-c0044-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    Invoke-BoundedCheck 'c005-history-model' 'node' @('.\tools\run-v004-c005-tests.mjs')
    Invoke-BoundedCheck 'c005-history-chrome' 'node' @('.\tools\run-v004-c005-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c0044ModelEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C004.4\model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $c0044BrowserEvidence = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'test-artifacts\V004-C004.4\browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()

    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C005 model or Chrome evidence is not PASS.' }
    if ($c0044ModelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $c0044BrowserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C004.4 completion regression evidence is not PASS.' }
    if ($modelEvidence.applicationSha256 -ne $applicationSha -or $browserEvidence.applicationSha256 -ne $applicationSha -or $c0044ModelEvidence.applicationSha256 -ne $applicationSha -or $c0044BrowserEvidence.applicationSha256 -ne $applicationSha) { throw 'Evidence does not match current application bytes.' }

    if ($modelEvidence.grouping.cardIdentity -ne 'craftingCardId' -or $modelEvidence.grouping.sameCardPartialAndFullOneGroup -ne $true) { throw 'History grouping contract mismatch.' }
    if (@($modelEvidence.grouping.firstOrder) -join ',' -ne 'card-b,card-a' -or @($modelEvidence.grouping.afterASequence4Order) -join ',' -ne 'card-a,card-b') { throw 'Newest group ordering mismatch.' }
    if (@($modelEvidence.grouping.eventOrder) -join ',' -ne '4,2,1' -or $modelEvidence.grouping.localeStringSorting -ne $false) { throw 'Newest event ordering or locale-independent tie-break mismatch.' }
    $expectedCompletedLabel = 'K' + [char]233 + 'sz'
    if ($modelEvidence.statusHandling.completed -ne $expectedCompletedLabel -or $modelEvidence.statusHandling.undone -ne 'Visszavonva' -or $modelEvidence.statusHandling.unknown -ne 'FAIL_SAFE_VISIBLE') { throw 'History status mapping mismatch.' }
    if ($modelEvidence.statusHandling.undoneExcludedFromActiveTotal -ne $true -or $modelEvidence.statusHandling.legacyExcludedFromCraftRunTotal -ne $true) { throw 'History active-total contract mismatch.' }
    if ($modelEvidence.storedDeltaTruth.source -ne 'event.consumedDeltas' -or $modelEvidence.storedDeltaTruth.currentCardUsed -ne $false -or $modelEvidence.storedDeltaTruth.currentInventoryUsed -ne $false -or $modelEvidence.storedDeltaTruth.liveRecipeFetchUsed -ne $false -or $modelEvidence.storedDeltaTruth.renormalizationUsed -ne $false) { throw 'History renderer truth source mismatch.' }
    $expectedScuDeltaText = '17500 unit ' + [char]183 + ' 1.7500 SCU'
    if ($modelEvidence.storedDeltaTruth.scu17500 -ne $expectedScuDeltaText -or $modelEvidence.storedDeltaTruth.item35 -ne '35 db') { throw 'Exact stored delta formatting mismatch.' }
    if ($modelEvidence.presentation.defaultView -ne 'ACTIVE' -or $modelEvidence.presentation.deleteImplemented -ne $false -or $modelEvidence.presentation.undoImplemented -ne $false -or $modelEvidence.presentation.redoImplemented -ne $false) { throw 'Presentation scope mismatch.' }
    if ($modelEvidence.presentation.databaseSchemaChanged -ne $false -or $modelEvidence.presentation.backupSchemaChanged -ne $false) { throw 'C005 changed a forbidden schema.' }
    if ($modelEvidence.singleFile.runtimeFiles -ne 1 -or $modelEvidence.singleFile.sidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0 -or $modelEvidence.singleFile.localRuntimeJson -ne 0) { throw 'Single-file model gate failed.' }

    if ($browserEvidence.production.status -ne 'PASS_PARTIAL_AND_FULL' -or $browserEvidence.production.blueprintUuid -ne '280f47b7-8434-410c-b854-380768fdccec') { throw 'Production partial/full History path failed.' }
    if (@($browserEvidence.production.partial.consumedUnits) -join ',' -ne '18000,35,35' -or $browserEvidence.production.partial.remainingCraftRuns -ne 16) { throw 'Production partial exact deltas mismatch.' }
    if (@($browserEvidence.production.full.finalBatchUnits) -join ',' -ne '1,1,1' -or $browserEvidence.production.full.activeCards -ne 0 -or $browserEvidence.production.materialLossUnits -ne 0) { throw 'Production full completion conservation mismatch.' }
    if ($browserEvidence.production.history.groups -ne 1 -or $browserEvidence.production.history.events -ne 2 -or @($browserEvidence.production.history.newestFirst) -join ',' -ne '2,1' -or $browserEvidence.production.history.activeCompletedCraftRuns -ne 21) { throw 'Production History grouping/order/total mismatch.' }
    if ($browserEvidence.fixtures.status -ne 'PASS' -or @($browserEvidence.fixtures.groupOrder) -join ',' -ne 'card-a,card-b,legacy-missing' -or @($browserEvidence.fixtures.cardAEventOrder) -join ',' -ne '4,2,1') { throw 'Fixture History grouping/order mismatch.' }
    if (@($browserEvidence.fixtures.cardAStatuses) -join ',' -ne 'COMPLETED,UNDONE,COMPLETED' -or $browserEvidence.fixtures.legacy -ne 'FAIL_CLOSED_DISPLAY' -or $browserEvidence.fixtures.unknownStatusVisible -ne $true) { throw 'Fixture status/legacy handling mismatch.' }
    if ($browserEvidence.presentationOnly.status -ne 'PASS_ZERO_WRITES' -or $browserEvidence.presentationOnly.durableWrites -ne 0 -or $browserEvidence.presentationOnly.revisionChanges -ne 0 -or $browserEvidence.presentationOnly.allocationChanges -ne 0 -or $browserEvidence.presentationOnly.reservationChanges -ne 0) { throw 'History presentation mutated durable or domain state.' }
    if ($browserEvidence.layout.status -ne 'PASS_NO_HORIZONTAL_OVERFLOW' -or $browserEvidence.layout.desktop.documentScrollWidth -gt $browserEvidence.layout.desktop.documentClientWidth -or $browserEvidence.layout.mobile.documentScrollWidth -gt $browserEvidence.layout.mobile.documentClientWidth) { throw 'Desktop/mobile History overflow gate failed.' }
    if ($browserEvidence.reload.production.status -ne 'PASS' -or $browserEvidence.reload.fixtures.status -ne 'PASS') { throw 'History reload gate failed.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED' -or $browserEvidence.fileGate.version -ne 'V004-dev' -or $browserEvidence.fileGate.runtimeFileCount -ne 1 -or $browserEvidence.fileGate.localRuntimeSidecars -ne 0) { throw 'Direct file or single-file gate failed.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'Chrome console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C005'
        status = 'PASS_CRAFT_HISTORY_UI'
        validationHead = (& git rev-parse HEAD).Trim()
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        historyGrouping = 'PASS'
        newestGroupFirst = 'PASS'
        newestEventFirst = 'PASS'
        exactMaterialQualityBatchDeltas = 'PASS'
        legacyHistory = 'FAIL_CLOSED_DISPLAY'
        historyDelete = 'NOT_IMPLEMENTED'
        undo = 'NOT_IMPLEMENTED'
        presentationDurableWrites = 0
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
        c006 = 'NOT_STARTED'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 6) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_CRAFT_HISTORY_UI')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add('presentationDurableWrites=0')
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C005_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
