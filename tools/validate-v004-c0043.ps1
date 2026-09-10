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
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004.3'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C004.3 targeted craft-run quantity semantics validation')

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
    Invoke-BoundedCheck 'c004-atomic-model-regression' 'node' @('.\tools\run-v004-c004-tests.mjs')
    Invoke-BoundedCheck 'c0043-targeted-model' 'node' @('.\tools\run-v004-c0043-tests.mjs')
    Invoke-BoundedCheck 'c0043-targeted-chrome' 'node' @('.\tools\run-v004-c0043-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectRoot 'sPg Crafting List.html')).Hash.ToLowerInvariant()
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C004.3 model or Chrome evidence is not PASS.' }
    if ($modelEvidence.applicationSha256 -ne $applicationSha -or $browserEvidence.applicationSha256 -ne $applicationSha) { throw 'C004.3 evidence does not match current application bytes.' }

    if ($modelEvidence.exactArithmetic.scuScale -ne 10000 -or $modelEvidence.exactArithmetic.roundingCalls -ne 0 -or $modelEvidence.exactArithmetic.epsilonTolerance -ne 0) { throw 'Exact-unit arithmetic contract mismatch.' }
    if ($modelEvidence.semantics.quantitySemantics -ne 'CRAFT_RUN_COUNT' -or $modelEvidence.semantics.craftRunInputEvidence -ne 'CRAFT_RUN_INPUTS_EXACT') { throw 'Craft-run semantics marker mismatch.' }
    if ($modelEvidence.semantics.outputCountEvidence -ne 'OUTPUT_COUNT_UNPROVEN' -or $modelEvidence.semantics.outputCountIsCompletionGate -ne $false) { throw 'Output cardinality must remain unproven and non-gating.' }
    if ($modelEvidence.semantics.legacyMissingSemanticsBlocker -ne 'LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED' -or $modelEvidence.semantics.nonexactInputBlocker -ne 'CRAFT_RUN_INPUTS_UNPROVEN') { throw 'Legacy or nonexact blocker mismatch.' }
    if ($modelEvidence.schemas.reservation -ne 'V004_RESERVATION_SNAPSHOT_2' -or $modelEvidence.schemas.completionRequest -ne 'V004_CRAFT_COMPLETE_REQUEST_2' -or $modelEvidence.schemas.historyEvent -ne 'V004_CRAFT_HISTORY_EVENT_2') { throw 'C004.3 schema marker mismatch.' }
    if (@($modelEvidence.exactCases).Count -lt 3 -or @($modelEvidence.blockedCases).Count -lt 6) { throw 'Required exact/nonexact numeric matrix is incomplete.' }

    $exact = $browserEvidence.productionExact
    if ($exact.status -ne 'PASS' -or $exact.quantitySemantics -ne 'CRAFT_RUN_COUNT' -or $exact.craftRunInputEvidence -ne 'CRAFT_RUN_INPUTS_EXACT') { throw 'Real exact production blueprint path failed.' }
    if ($exact.outputCountEvidence -ne 'OUTPUT_COUNT_UNPROVEN' -or $exact.outputCardinalityClaimed -ne $false) { throw 'Real production path claimed output cardinality.' }
    if ($exact.cache.rawPresent -ne $true -or $exact.cache.normalizedPresent -ne $true -or @($exact.recipeSlots).Count -lt 2) { throw 'Real API/cache/normalize/Card evidence is incomplete.' }
    if ($exact.partial.completedCraftRuns -ne 5 -or $exact.partial.remainingCraftRuns -ne 16 -or $exact.full.cardRemoved -ne $true) { throw 'Partial/full craft-run result mismatch.' }
    if ($exact.staleAttempt.code -ne 'STALE_RESERVATION' -or $exact.staleAttempt.writes -ne 0 -or $exact.staleAttempt.fallbackConsumption -ne $false) { throw 'Stale reservation handling mismatch.' }
    if ($exact.maxWrites -ne 0 -or $exact.cancelWrites -ne 0 -or $exact.materialLossUnits -ne 0) { throw 'MAX, cancel, or conservation contract mismatch.' }
    if (@($exact.full.finalBatchUnits | Where-Object { $_ -ne 1 }).Count -ne 0) { throw 'Exact remaining-unit preservation mismatch.' }

    $legacy = $browserEvidence.legacyConfirmation
    if ($legacy.visibleAction -notmatch '^21 craft' -or $legacy.quantityBefore -ne 21 -or $legacy.quantityAfter -ne 21) { throw 'Legacy confirmation UI or numeric preservation mismatch.' }
    if ($legacy.semanticsBefore -ne 'LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED' -or $legacy.semanticsAfter -ne 'CRAFT_RUN_COUNT') { throw 'Legacy semantics transition mismatch.' }
    if ($legacy.cardRevisionAfter -ne ($legacy.cardRevisionBefore + 1) -or $legacy.allocationRevisionDelta -ne 1 -or $legacy.inventoryRevisionDelta -ne 0 -or $legacy.craftListRevisionDelta -ne 0) { throw 'Legacy confirmation revision contract mismatch.' }
    if ($legacy.reservationAfterConfirmation -ne 'STALE' -or $legacy.explicitReallocateRequired -ne $true -or $legacy.markerlessHistoryClassification -ne 'LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN') { throw 'Legacy stale or History classification mismatch.' }
    if ($legacy.schema3Compatibility.cardSemantics -ne 'LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED' -or $legacy.schema3Compatibility.cardInputEvidence -ne 'CRAFT_RUN_INPUTS_UNPROVEN' -or $legacy.schema3Compatibility.historySemantics -ne 'LEGACY_HISTORY_QUANTITY_SEMANTICS_UNKNOWN') { throw 'Schema 3 legacy quantity-semantics classification mismatch.' }
    if ('CARD_QUANTITY_SEMANTICS_CLASSIFICATION' -notin @($legacy.schema3Compatibility.migrationSteps) -or 'HISTORY_QUANTITY_SEMANTICS_CLASSIFICATION' -notin @($legacy.schema3Compatibility.migrationSteps)) { throw 'Schema 3 compatibility migration steps missing.' }

    $nonexact = $browserEvidence.productionNonexact
    if ($nonexact.status -ne 'PASS_BLOCKED_ZERO_WRITES' -or $nonexact.inputEvidence -ne 'CRAFT_RUN_INPUTS_UNPROVEN' -or $nonexact.reason -ne 'CRAFT_RUN_INPUTS_UNPROVEN') { throw 'Real nonexact production blueprint was not fail-closed.' }
    if ($nonexact.visible -ne $true -or $nonexact.completionDisabled -ne $true -or $nonexact.inventoryWrites -ne 0 -or $nonexact.completionReached -ne $false) { throw 'Nonexact visible/plannable zero-write contract mismatch.' }
    if ($nonexact.cache.rawPresent -ne $true -or $nonexact.cache.normalizedPresent -ne $true -or @($nonexact.nonexactRequirements).Count -lt 1) { throw 'Nonexact API/cache evidence is incomplete.' }
    if ($browserEvidence.reload.status -ne 'PASS' -or $browserEvidence.fileGate.status -ne 'PASS_AUTOMATED') { throw 'Reload or direct file gate failed.' }
    if ($browserEvidence.fileGate.runtimeFileCount -ne 1 -or $browserEvidence.fileGate.localRuntimeSidecars -ne 0) { throw 'Single-file runtime gate failed.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'Chrome console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C004.3'
        status = 'PASS_CRAFT_RUN_QUANTITY_SEMANTICS'
        validationHead = (& git rev-parse HEAD).Trim()
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        quantitySemantics = 'CRAFT_RUN_COUNT'
        craftRunInputEvidence = 'CRAFT_RUN_INPUTS_EXACT'
        outputCountEvidence = 'OUTPUT_COUNT_UNPROVEN'
        outputCardinalityClaimed = $false
        exactProductionBlueprint = $exact.blueprintUuid
        exactProductionOutput = $exact.outputName
        nonexactProductionBlueprint = $nonexact.blueprintUuid
        nonexactProductionOutput = $nonexact.outputName
        nonexactBlocker = $nonexact.reason
        legacyConfirmation = $legacy.visibleAction
        staleReservation = $exact.staleAttempt.code
        materialLossUnits = 0
        exactUnitTolerance = 0
        directFileGate = $browserEvidence.fileGate.status
        applicationRuntimeFileCount = 1
        localRuntimeSidecars = 0
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
        c005Started = $false
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_CRAFT_RUN_QUANTITY_SEMANTICS')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add("exactProductionBlueprint=$($exact.blueprintUuid)")
    $lines.Add("nonexactProductionBlueprint=$($nonexact.blueprintUuid)")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0043_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
