#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$inputCheckpoint = '82d4814afa2697ebc625f118dde57caa30e372f3'
$expectedApplicationSha = '0a0a57ffe689134bb36f7cffc1443dbafbfbdbd8d5e3647affa9194770ee2764'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004.2'
$evidencePath = Join-Path $artifactDirectory 'production-output-semantics.json'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$logPath = Join-Path $artifactDirectory 'validation.log'
$applicationPath = Join-Path $projectRoot 'sPg Crafting List.html'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C004.2 production output semantics bounded audit')

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
    & git merge-base --is-ancestor $inputCheckpoint HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The C004.1 input checkpoint is not an ancestor of HEAD.' }

    $gitDir = (& git rev-parse --git-dir).Trim()
    $operations = @(@('MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply') | Where-Object {
        Test-Path -LiteralPath (Join-Path $gitDir $_)
    })
    if ($operations.Count -gt 0) { throw "Git operation in progress: $($operations -join ', ')" }

    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath $applicationPath).Hash.ToLowerInvariant()
    if ($applicationSha -ne $expectedApplicationSha) { throw "Application SHA mismatch: $applicationSha" }
    & git diff --quiet $inputCheckpoint -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Application HTML changed during the audit-only C004.2 cycle.' }

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

    Invoke-BoundedCheck 'production-output-semantics-read-only-audit' 'node' @('.\tools\audit-v004-c0042-production-output-semantics.mjs')
    $evidence = [System.IO.File]::ReadAllText($evidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

    if ($evidence.status -ne 'PASS_READ_ONLY_SEMANTIC_AUDIT') { throw 'Semantic audit execution status mismatch.' }
    if ($evidence.conclusion -ne 'PRODUCTION_OUTPUT_SEMANTICS_UNPROVEN') { throw 'Unexpected production output semantics conclusion.' }
    if ($evidence.liveCraftCompleteGate -ne 'LIVE_CRAFT_COMPLETE_GATE_BLOCKED_BY_UNPROVEN_OUTPUT_SEMANTICS') { throw 'Live Craft Complete blocker mismatch.' }
    if ($evidence.productionCardOutputCountEvidence -ne 'OUTPUT_COUNT_UNPROVEN') { throw 'Production Card output evidence mismatch.' }
    if ($evidence.application.sha256 -ne $expectedApplicationSha -or $evidence.application.changedByAudit -ne $false) { throw 'Application byte evidence mismatch.' }
    if ($evidence.application.semantics.exactProductionAssignmentCount -ne 0 -or $evidence.application.semantics.newCardDefault -ne 'OUTPUT_COUNT_UNPROVEN' -or $evidence.application.semantics.storedOrMigratedCardDefault -ne 'OUTPUT_COUNT_UNPROVEN') { throw 'Production Card fail-closed model mismatch.' }
    if ($evidence.liveApi.indexRecords -lt 1 -or $evidence.liveApi.ingredientQuantitiesAudited -lt 1) { throw 'Live production dataset coverage is empty.' }
    if (@($evidence.liveApi.sampleCategories).Count -lt 4 -or @($evidence.liveApi.sampleCategories | Sort-Object -Unique).Count -lt 4) { throw 'Multiple production category coverage mismatch.' }
    if (@($evidence.liveApi.nonExactQuantityConversions).Count -lt 1) { throw 'Expected non-exact live quantity evidence is missing; semantic audit must be reviewed.' }
    if (@($evidence.liveApi.indexOutputCardinalityCandidates).Count -ne 0 -or @($evidence.officialOpenApi.outputCardinalityFields).Count -ne 0 -or @($evidence.officialSource.outputCardinalityMatches).Count -ne 0) { throw 'An output-cardinality candidate requires a new decision.' }
    if ($evidence.semanticDecision.sourceRequirementQuantityConversionExactForCurrentDataset -ne $false -or $evidence.semanticDecision.perFinishedItemNormalizationProven -ne $false -or $evidence.semanticDecision.outputCountDefaultedToOne -ne $false) { throw 'Semantic proof boundary mismatch.' }
    if (@($evidence.semanticDecision.promotedProductionCardClasses).Count -ne 0 -or $evidence.semanticDecision.fullCompletionAllowedForProductionCards -ne $false -or $evidence.semanticDecision.partialCompletionAllowedForProductionCards -ne $false -or $evidence.semanticDecision.oldOrMigratedCardsRemainBlockedWithoutProof -ne $true) { throw 'Fail-closed production eligibility mismatch.' }
    if ($evidence.singleFile.localRuntimeSidecars -ne 0 -or $evidence.singleFile.applicationRuntimeFileCount -ne 1) { throw 'Single-file runtime gate failed.' }
    if ($evidence.safety.remoteWrites -ne 0 -or $evidence.safety.applicationWrites -ne 0 -or $evidence.safety.fullRegression -ne 'NOT_RUN_BY_SCOPE' -or $evidence.safety.c005 -ne 'NOT_STARTED') { throw 'Audit scope safety mismatch.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C004.2'
        status = 'PASS_AUDIT_OUTPUT_SEMANTICS_UNPROVEN'
        conclusion = $evidence.conclusion
        liveCraftCompleteGate = $evidence.liveCraftCompleteGate
        productionCardOutputCountEvidence = $evidence.productionCardOutputCountEvidence
        validationHead = (& git rev-parse HEAD).Trim()
        inputCheckpoint = $inputCheckpoint
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        applicationChanged = $false
        liveGameVersion = $evidence.liveApi.gameVersion
        liveBlueprintRecords = $evidence.liveApi.indexRecords
        liveIngredientQuantitiesAudited = $evidence.liveApi.ingredientQuantitiesAudited
        liveSampleCategories = @($evidence.liveApi.sampleCategories)
        officialSourceCommit = $evidence.officialSource.commit
        outputCardinalityFieldsFound = 0
        nonExactQuantityConversions = @($evidence.liveApi.nonExactQuantityConversions).Count
        sourceRequirementQuantityConversionExactForCurrentDataset = $false
        perFinishedItemNormalizationProven = $false
        outputCountDefaultedToOne = $false
        exactProductionAssignmentCount = 0
        productionCompletionAllowed = $false
        localRuntimeSidecars = 0
        applicationRuntimeFileCount = 1
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        v001V002Unchanged = $true
        fullRegression = 'NOT_RUN_BY_SCOPE'
        chromeGate = 'NOT_RUN_AUDIT_ONLY_APPLICATION_BYTES_UNCHANGED'
        c005 = 'NOT_STARTED'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_AUDIT_OUTPUT_SEMANTICS_UNPROVEN')
    $lines.Add("conclusion=$($evidence.conclusion)")
    $lines.Add("liveCraftCompleteGate=$($evidence.liveCraftCompleteGate)")
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0042_VALIDATION_PASS conclusion=$($evidence.conclusion) summary=$summaryPath"
} finally {
    Pop-Location
}
