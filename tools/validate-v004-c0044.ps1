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
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004.4'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C004.4 deterministic 4-decimal SCU normalization validation')

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
    Invoke-BoundedCheck 'c0044-targeted-model' 'node' @('.\tools\run-v004-c0044-tests.mjs')
    Invoke-BoundedCheck 'c0044-production-dataset-audit' 'node' @('.\tools\audit-v004-c0044-production-scu-normalization.mjs')
    Invoke-BoundedCheck 'c0044-targeted-chrome' 'node' @('.\tools\run-v004-c0044-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $productionEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'production-scu-normalization.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectRoot 'sPg Crafting List.html')).Hash.ToLowerInvariant()
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL' -or $productionEvidence.status -ne 'PASS_PRODUCTION_INPUT_NORMALIZATION' -or $browserEvidence.status -ne 'PASS_TARGETED_CHROME') { throw 'C004.4 model, production audit, or Chrome evidence is not PASS.' }
    if ($modelEvidence.applicationSha256 -ne $applicationSha -or $productionEvidence.applicationSha256 -ne $applicationSha -or $browserEvidence.applicationSha256 -ne $applicationSha) { throw 'C004.4 evidence does not match current application bytes.' }

    if ($modelEvidence.normalization.scuRule -ne 'SCU_4DP_HALF_UP_V1' -or $modelEvidence.normalization.itemRule -ne 'ITEM_POSITIVE_SAFE_INTEGER_V1') { throw 'Normalization rule marker mismatch.' }
    if ($modelEvidence.normalization.rounding -ne 'DECIMAL_HALF_UP_4DP' -or $modelEvidence.normalization.floatRoundingCalls -ne 0 -or $modelEvidence.normalization.postNormalizationArithmetic -ne 'SAFE_INTEGER_UNITS_ONLY') { throw 'Deterministic decimal normalization contract mismatch.' }
    if (@($modelEvidence.exactScuCases).Count -ne 13 -or @($modelEvidence.blockedScuCases).Count -lt 6) { throw 'Required SCU numeric matrix is incomplete.' }
    $model014 = @($modelEvidence.exactScuCases | Where-Object { $_.source -eq 0.14 })[0]
    $modelNoisy011 = @($modelEvidence.exactScuCases | Where-Object { $_.source -eq 0.11000000000000001 })[0]
    $modelHalfUp = @($modelEvidence.exactScuCases | Where-Object { $_.source -eq 0.12345 })[0]
    $modelRoundsZero = @($modelEvidence.blockedScuCases | Where-Object { $_.label -eq 'rounds to zero' })[0]
    if ($model014.normalizedScu -ne '0.1400' -or $model014.units -ne 1400) { throw '0.14 SCU normalization mismatch.' }
    if ($modelNoisy011.normalizedScu -ne '0.1100' -or $modelNoisy011.units -ne 1100) { throw 'Noisy 0.11 SCU normalization mismatch.' }
    if ($modelHalfUp.normalizedScu -ne '0.1235' -or $modelHalfUp.units -ne 1235) { throw 'HALF-UP tie normalization mismatch.' }
    if ($modelRoundsZero.reason -ne 'ROUNDS_TO_ZERO') { throw 'ROUNDS_TO_ZERO model blocker missing.' }
    if ($modelEvidence.item.sevenUnits -ne 7 -or $modelEvidence.item.fractionalBlocked -ne $true -or $modelEvidence.item.nonfiniteBlocked -ne $true -or $modelEvidence.item.negativeOrZeroBlocked -ne $true -or $modelEvidence.item.unsafeBlocked -ne $true) { throw 'ITEM positive-safe-integer rule mismatch.' }
    if ($modelEvidence.c0043Compatibility.falseNegative014Upgraded -ne $true -or $modelEvidence.c0043Compatibility.legacySemanticsStillRequired -ne 'LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED') { throw 'C004.3 or legacy compatibility mismatch.' }
    if ($modelEvidence.outputCardinality.evidence -ne 'OUTPUT_COUNT_UNPROVEN' -or $modelEvidence.outputCardinality.claimed -ne $false -or $modelEvidence.outputCardinality.completionGate -ne $false) { throw 'Output cardinality was claimed or made gating.' }
    if ($modelEvidence.singleFile.applicationRuntimeFileCount -ne 1 -or $modelEvidence.singleFile.localRuntimeSidecars -ne 0 -or $modelEvidence.singleFile.localScriptSrc -ne 0 -or $modelEvidence.singleFile.localStylesheet -ne 0 -or $modelEvidence.singleFile.localRuntimeJson -ne 0) { throw 'Model single-file dependency gate failed.' }

    $totals = $productionEvidence.totals
    if ($totals.scuSuccessfullyNormalizedCount -ne $totals.scuRequirementCount -or $totals.itemSuccessfullyNormalizedCount -ne $totals.itemRequirementCount) { throw 'Production requirements were not fully normalized.' }
    if ($totals.blockedScuCount -ne 0 -or $totals.blockedItemCount -ne 0 -or $totals.unsupportedRequirementCount -ne 0 -or $totals.affectedBlueprintCount -ne 0) { throw 'Production normalization has blockers.' }
    if ($productionEvidence.normalizationRule.scu -ne 'SCU_4DP_HALF_UP_V1' -or $productionEvidence.normalizationRule.postNormalizationToleranceUnits -ne 0) { throw 'Production normalization rule or tolerance mismatch.' }
    if ($productionEvidence.sourceLiteralAudit.canonicalDecimalSource -ne 'String(JSON.parse numeric Number)' -or $productionEvidence.sourceLiteralAudit.scientificNotation -notmatch '^SUPPORTED') { throw 'Upstream canonical decimal boundary evidence mismatch.' }
    if ($productionEvidence.previousFloatingRepresentationCases.allNormalized -ne $true -or $productionEvidence.previousFloatingRepresentationCases.count -lt 1) { throw 'Historical floating representation cases were not normalized.' }
    $priorSteadfast = @($productionEvidence.previousFloatingRepresentationCases.cases | Where-Object { $_.outputName -eq 'Steadfast' -and $_.canonicalDecimal -eq '0.11000000000000001' })[0]
    if ($priorSteadfast.normalizedScu -ne '0.1100' -or $priorSteadfast.normalizedUnits -ne 1100) { throw 'Steadfast aggregate 0.11000000000000001 normalization mismatch.' }
    $lumaAudit = $productionEvidence.productionSamples.lumaCore
    $steadfastAudit = $productionEvidence.productionSamples.steadfast
    $omniskyAudit = $productionEvidence.productionSamples.omnisky
    $luma014 = @($lumaAudit.requirements | Where-Object { $_.sourceQuantityCanonicalDecimal -eq '0.14' })[0]
    $steadfast007 = @($steadfastAudit.requirements | Where-Object { $_.sourceQuantityCanonicalDecimal -eq '0.07' })[0]
    if ($lumaAudit.completionInputEligible -ne $true -or $luma014.normalizedQuantityText -ne '0.1400' -or $luma014.normalizedRequiredQuantityUnits -ne 1400) { throw 'LumaCore 0.14 production normalization mismatch.' }
    if ($steadfastAudit.completionInputEligible -ne $true -or $steadfast007.normalizedQuantityText -ne '0.0700' -or $steadfast007.normalizedRequiredQuantityUnits -ne 700) { throw 'Steadfast 0.07 production detail mismatch.' }
    if ($omniskyAudit.completionInputEligible -ne $true) { throw 'Omnisky production input eligibility failed.' }

    $lumaChrome = $browserEvidence.productionSamples.lumaCore
    $steadfastChrome = $browserEvidence.productionSamples.steadfast
    if ($lumaChrome.status -ne 'PASS_COMPLETION_READY' -or $lumaChrome.ready -ne $true -or $lumaChrome.reservationStatus -ne 'VALID') { throw 'LumaCore Chrome completion-ready path failed.' }
    if ($steadfastChrome.status -ne 'PASS_COMPLETION_READY' -or $steadfastChrome.ready -ne $true -or $steadfastChrome.reservationStatus -ne 'VALID') { throw 'Steadfast Chrome completion-ready path failed.' }
    $lumaChrome014 = @($lumaChrome.requirements | Where-Object { $_.canonicalDecimal -eq '0.14' })[0]
    $steadfastChrome007 = @($steadfastChrome.requirements | Where-Object { $_.canonicalDecimal -eq '0.07' })[0]
    if ($lumaChrome014.normalizedQuantityText -ne '0.1400' -or $lumaChrome014.normalizedUnits -ne 1400) { throw 'LumaCore Chrome normalized requirement mismatch.' }
    if ($steadfastChrome007.normalizedQuantityText -ne '0.0700' -or $steadfastChrome007.normalizedUnits -ne 700) { throw 'Steadfast Chrome normalized requirement mismatch.' }

    $exact = $browserEvidence.productionExact
    if ($exact.status -ne 'PASS' -or $exact.quantitySemantics -ne 'CRAFT_RUN_COUNT' -or $exact.craftRunInputEvidence -ne 'CRAFT_RUN_INPUTS_EXACT') { throw 'Omnisky exact production path failed.' }
    if ($exact.outputCountEvidence -ne 'OUTPUT_COUNT_UNPROVEN' -or $exact.outputCardinalityClaimed -ne $false) { throw 'Omnisky path claimed output cardinality.' }
    if ($exact.partial.completedCraftRuns -ne 5 -or $exact.partial.remainingCraftRuns -ne 16 -or $exact.full.completedRemainingCraftRuns -ne 16 -or $exact.full.cardRemoved -ne $true) { throw 'Omnisky partial/full result mismatch.' }
    if (@($exact.partial.consumedUnits) -join ',' -ne '18000,35,35') { throw 'Omnisky exact partial deltas mismatch.' }
    if ($exact.staleAttempt.code -ne 'STALE_RESERVATION' -or $exact.staleAttempt.writes -ne 0 -or $exact.staleAttempt.fallbackConsumption -ne $false) { throw 'Stale reservation handling mismatch.' }
    if ($exact.maxWrites -ne 0 -or $exact.cancelWrites -ne 0 -or $exact.materialLossUnits -ne 0) { throw 'MAX, cancel, or inventory conservation mismatch.' }
    if (@($exact.full.finalBatchUnits | Where-Object { $_ -ne 1 }).Count -ne 0) { throw 'Every remaining unit was not preserved.' }
    if (@($exact.recipeSlots | Where-Object { $_.quantityNormalizationStatus -ne 'NORMALIZED_EXACT_INTEGER_UNITS' }).Count -ne 0) { throw 'Omnisky Card normalization evidence missing.' }
    if (@($exact.myMaterials.finalRows | Where-Object { $_.visible -ne $true -or $_.quality -ne '900' }).Count -ne 0) { throw 'My Materials final unit evidence missing.' }

    $legacy = $browserEvidence.legacyConfirmation
    if ($legacy.visibleAction -notmatch '^21 craft' -or $legacy.quantityBefore -ne 21 -or $legacy.quantityAfter -ne 21) { throw 'Legacy confirmation UI or numeric preservation mismatch.' }
    if ($legacy.semanticsBefore -ne 'LEGACY_QUANTITY_SEMANTICS_UNCONFIRMED' -or $legacy.semanticsAfter -ne 'CRAFT_RUN_COUNT') { throw 'Legacy semantics transition mismatch.' }
    if ($legacy.cardRevisionAfter -ne ($legacy.cardRevisionBefore + 1) -or $legacy.allocationRevisionDelta -ne 1 -or $legacy.inventoryRevisionDelta -ne 0 -or $legacy.craftListRevisionDelta -ne 0) { throw 'Legacy confirmation revision contract mismatch.' }
    if ($legacy.reservationAfterConfirmation -ne 'STALE' -or $legacy.explicitReallocateRequired -ne $true) { throw 'Legacy confirmation did not require explicit Reallocate.' }
    if ('REQUIREMENT_QUANTITY_NORMALIZATION_EVIDENCE_V1' -notin @($legacy.schema3Compatibility.migrationSteps)) { throw 'Schema 3 normalization-evidence migration step missing.' }
    if ($legacy.c0043Upgrade.quantity -ne 21 -or $legacy.c0043Upgrade.inputEvidence -ne 'CRAFT_RUN_INPUTS_EXACT' -or $legacy.c0043Upgrade.allNormalized -ne $true) { throw 'C004.3 Card normalization upgrade mismatch.' }

    $invalid = $browserEvidence.invalidZero
    if ($invalid.status -ne 'PASS_BLOCKED_ZERO_WRITES' -or $invalid.sourceQuantityValue -ne 0.00004 -or $invalid.normalizedQuantityText -ne '0.0000' -or $invalid.normalizedUnits -ne 0) { throw 'ROUNDS_TO_ZERO Chrome case mismatch.' }
    if ($invalid.normalizationStatus -ne 'NORMALIZATION_BLOCKED' -or $invalid.blockerReason -ne 'ROUNDS_TO_ZERO' -or $invalid.completionDisabled -ne $true) { throw 'ROUNDS_TO_ZERO was not fail-closed.' }
    if ($invalid.inventoryWrites -ne 0 -or $invalid.completionReached -ne $false -or $invalid.attempt.code -ne 'STALE_RESERVATION') { throw 'ROUNDS_TO_ZERO zero-write contract failed.' }
    if ($invalid.visibleErrorText -notmatch 'ROUNDS_TO_ZERO' -or $invalid.visibleErrorText -notmatch 'Reallocate') { throw 'ROUNDS_TO_ZERO visible recovery message missing.' }

    if ($browserEvidence.reload.status -ne 'PASS' -or $browserEvidence.reload.activeCards -ne 0 -or $browserEvidence.reload.historyEvents -ne 2) { throw 'Reload persistence gate failed.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED' -or $browserEvidence.fileGate.version -ne 'V004-dev') { throw 'Direct file gate failed.' }
    if ($browserEvidence.fileGate.runtimeFileCount -ne 1 -or $browserEvidence.fileGate.localRuntimeSidecars -ne 0) { throw 'Single-file runtime gate failed.' }
    if ($browserEvidence.fileGate.luma014.normalizedRequiredQuantityUnits -ne 1400 -or $browserEvidence.fileGate.roundsToZero.quantityExactnessReason -ne 'ROUNDS_TO_ZERO') { throw 'Direct file normalization helper mismatch.' }
    if (@($browserEvidence.consoleErrors).Count -ne 0) { throw 'Chrome console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C004.4'
        status = 'PASS_4DP_SCU_NORMALIZATION'
        validationHead = (& git rev-parse HEAD).Trim()
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        scuUnitScale = 10000
        scuNormalizationRule = 'SCU_4DP_HALF_UP_V1'
        itemNormalizationRule = 'ITEM_POSITIVE_SAFE_INTEGER_V1'
        decimalSource = 'String(JSON.parse numeric Number)'
        materialLossToleranceUnits = 0
        quantitySemantics = 'CRAFT_RUN_COUNT'
        craftRunInputEvidence = 'CRAFT_RUN_INPUTS_EXACT'
        outputCountEvidence = 'OUTPUT_COUNT_UNPROVEN'
        outputCardinalityClaimed = $false
        productionBlueprintCount = $totals.blueprintCount
        productionIngredientCount = $totals.ingredientCount
        productionScuNormalized = "$($totals.scuSuccessfullyNormalizedCount)/$($totals.scuRequirementCount)"
        productionItemNormalized = "$($totals.itemSuccessfullyNormalizedCount)/$($totals.itemRequirementCount)"
        lumaCore = '0.14 SCU -> 0.1400 SCU -> 1400 unit; READY'
        steadfastDetail = '0.07 SCU -> 0.0700 SCU -> 700 unit; READY'
        steadfastAggregate = '0.11000000000000001 SCU -> 0.1100 SCU -> 1100 unit'
        omnisky = [ordered]@{
            blueprintUuid = $exact.blueprintUuid
            partial = '21 -> complete 5 -> remain 16'
            full = 'complete 16 -> card removed'
            finalBatchUnits = @($exact.full.finalBatchUnits)
        }
        roundsToZero = [ordered]@{
            source = 0.00004
            normalizedScu = '0.0000'
            blocker = $invalid.blockerReason
            writes = $invalid.inventoryWrites
        }
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
    $lines.Add('result=PASS_4DP_SCU_NORMALIZATION')
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add("productionBlueprints=$($totals.blueprintCount)")
    $lines.Add("productionScuNormalized=$($totals.scuSuccessfullyNormalizedCount)/$($totals.scuRequirementCount)")
    $lines.Add("roundsToZero=$($invalid.blockerReason)")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0044_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
