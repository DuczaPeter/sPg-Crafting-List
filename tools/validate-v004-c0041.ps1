#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$c004Checkpoint = 'f7125a96d092ba2765ad48b09145d40d501f9edd'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004.1'
$c004ArtifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C004'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C004.1 targeted revision semantics and live output eligibility audit')

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
    & git merge-base --is-ancestor $c004Checkpoint HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The C004 checkpoint is not an ancestor of HEAD.' }
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
    if ($LASTEXITCODE -ne 0) { throw 'V001/V002/V003 release path differs from the V003 baseline.' }
    & git diff --quiet HEAD -- releases/V001 releases/V002 releases/V003 'test-artifacts/V003-*' 'docs/V003*'
    if ($LASTEXITCODE -ne 0) { throw 'Protected V003/V001/V002 working-tree change detected.' }

    Invoke-BoundedCheck 'c004-repaired-target-gate' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-v004-c004.ps1', '-PlaywrightModulePath', $PlaywrightModulePath)
    Invoke-BoundedCheck 'live-output-eligibility-read-only-audit' 'node' @('.\tools\audit-v004-c0041-output-eligibility.mjs')

    $modelEvidence = [System.IO.File]::ReadAllText((Join-Path $c004ArtifactDirectory 'model-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = [System.IO.File]::ReadAllText((Join-Path $c004ArtifactDirectory 'browser-evidence.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $liveEvidence = [System.IO.File]::ReadAllText((Join-Path $artifactDirectory 'live-output-eligibility.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $applicationSha = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectRoot 'sPg Crafting List.html')).Hash.ToLowerInvariant()

    if ($modelEvidence.applicationSha256 -ne $applicationSha -or $browserEvidence.applicationSha256 -ne $applicationSha) { throw 'C004 evidence does not match current application bytes.' }
    if ($modelEvidence.partial.craftListRevisionBefore -ne $modelEvidence.partial.craftListRevisionAfter) { throw 'Model partial completion changed craftListRevision.' }
    if ($modelEvidence.partial.cardRevisionAfter -ne ($modelEvidence.partial.cardRevisionBefore + 1)) { throw 'Model partial cardRevision mismatch.' }
    if ($modelEvidence.full.craftListRevisionAfter -ne ($modelEvidence.full.craftListRevisionBefore + 1)) { throw 'Model full craftListRevision mismatch.' }
    if ($browserEvidence.partialCompletion.craftListRevisionBefore -ne $browserEvidence.partialCompletion.craftListRevisionAfter) { throw 'Chrome partial completion changed craftListRevision.' }
    if ($browserEvidence.partialCompletion.cardRevisionAfter -ne ($browserEvidence.partialCompletion.cardRevisionBefore + 1)) { throw 'Chrome partial cardRevision mismatch.' }
    if ($browserEvidence.fullCompletion.craftListRevisionAfter -ne ($browserEvidence.fullCompletion.craftListRevisionBefore + 1)) { throw 'Chrome full craftListRevision mismatch.' }
    if (@($browserEvidence.atomicRollback.failures).Count -lt 4 -or @($browserEvidence.atomicRollback.failures | Where-Object { -not $_.allStoresUnchanged }).Count -ne 0) { throw 'Atomic rollback proof mismatch.' }
    if ($browserEvidence.partialCompletion.reservationAfter -ne 'STALE' -or $browserEvidence.partialCompletion.automaticReallocate -ne $false) { throw 'Partial reservation invalidation mismatch.' }
    if ($browserEvidence.fileGate.status -ne 'PASS_AUTOMATED' -or @($browserEvidence.applicationOriginConsoleErrors).Count -ne 0 -or @($browserEvidence.fileGate.consoleErrors).Count -ne 0) { throw 'Chrome or direct-file gate mismatch.' }
    if ($modelEvidence.singleFile.applicationRuntimeFileCount -ne 1 -or $modelEvidence.singleFile.localRuntimeSidecars -ne 0) { throw 'Single-file runtime gate failed.' }

    if ($liveEvidence.status -ne 'PASS_READ_ONLY_LIVE_OUTPUT_ELIGIBILITY_AUDIT') { throw 'Live output eligibility audit did not pass.' }
    if ($liveEvidence.conclusion -ne 'LIVE_COMPLETION_CURRENTLY_BLOCKED_BY_OUTPUT_COUNT_UNPROVEN') { throw 'Unexpected live completion eligibility conclusion.' }
    if (@($liveEvidence.liveApi.outputCountCandidateFields).Count -ne 0) { throw 'Live API output-count candidate field requires a new semantic audit.' }
    if ($liveEvidence.liveApi.outputTypes -lt 1 -or $liveEvidence.liveApi.detailRecordsSampled -ne $liveEvidence.liveApi.outputTypes) { throw 'Live output-class detail coverage mismatch.' }
    if ($liveEvidence.productionCardModel.newCardAssignment -ne 'OUTPUT_COUNT_UNPROVEN' -or $liveEvidence.productionCardModel.storedOrMigratedCardDefault -ne 'OUTPUT_COUNT_UNPROVEN' -or $liveEvidence.productionCardModel.exactProductionAssignmentCount -ne 0) { throw 'Production Card fail-closed evidence mismatch.' }
    if ($liveEvidence.safety.outputCountDefaultedToOne -ne $false -or $liveEvidence.safety.remoteWrites -ne 0) { throw 'Live audit safety contract mismatch.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C004.1'
        status = 'PASS_REVISION_SEMANTICS'
        liveCompletionEligibility = $liveEvidence.conclusion
        validationHead = (& git rev-parse HEAD).Trim()
        inputC004Checkpoint = $c004Checkpoint
        applicationRuntimeIdentity = 'V004-dev'
        applicationSha256 = $applicationSha
        implementationDeviation = $true
        codeRepair = $true
        partialCraftListRevisionBefore = $browserEvidence.partialCompletion.craftListRevisionBefore
        partialCraftListRevisionAfter = $browserEvidence.partialCompletion.craftListRevisionAfter
        partialCardRevisionBefore = $browserEvidence.partialCompletion.cardRevisionBefore
        partialCardRevisionAfter = $browserEvidence.partialCompletion.cardRevisionAfter
        fullCraftListRevisionBefore = $browserEvidence.fullCompletion.craftListRevisionBefore
        fullCraftListRevisionAfter = $browserEvidence.fullCompletion.craftListRevisionAfter
        atomicRollbackStages = @($browserEvidence.atomicRollback.failures).Count
        liveGameVersion = $liveEvidence.gameVersion
        liveBlueprintRecords = $liveEvidence.liveApi.indexRecords
        liveOutputTypesAudited = $liveEvidence.liveApi.outputTypes
        liveDetailRecordsAudited = $liveEvidence.liveApi.detailRecordsSampled
        liveOutputCountCandidateFields = @($liveEvidence.liveApi.outputCountCandidateFields)
        exactProductionAssignmentCount = $liveEvidence.productionCardModel.exactProductionAssignmentCount
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
        broadcastChannel = 'NOT_IMPLEMENTED'
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_REVISION_SEMANTICS')
    $lines.Add("liveCompletionEligibility=$($liveEvidence.conclusion)")
    $lines.Add("applicationSha256=$applicationSha")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C0041_VALIDATION_PASS eligibility=$($liveEvidence.conclusion) summary=$summaryPath"
} finally {
    Pop-Location
}
