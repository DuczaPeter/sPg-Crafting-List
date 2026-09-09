#Requires -Version 5.1
param(
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$c001Checkpoint = '0b44909256bb776d91717d6578a1088399cfb149'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C002'
$logPath = Join-Path $artifactDirectory 'validation.log'
$summaryPath = Join-Path $artifactDirectory 'target-summary.json'
$stablePath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C002 targeted database/schema and safe V003 migration validation')

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
    & git merge-base --is-ancestor $c001Checkpoint HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The C001 checkpoint is not an ancestor of HEAD.' }

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

    Invoke-BoundedCheck 'baseline-static' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c002-targeted-model' 'node' @('.\tools\run-v004-c002-tests.mjs')
    if ($PlaywrightModulePath) {
        if (-not (Test-Path -LiteralPath $PlaywrightModulePath)) { throw "Playwright module not found: $PlaywrightModulePath" }
        Invoke-BoundedCheck 'c002-targeted-chrome' 'node' @('.\tools\run-v004-c002-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath")
    }

    $modelEvidencePath = Join-Path $artifactDirectory 'model-evidence.json'
    $browserEvidencePath = Join-Path $artifactDirectory 'browser-evidence.json'
    $modelEvidence = [System.IO.File]::ReadAllText($modelEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
    $browserEvidence = if (Test-Path -LiteralPath $browserEvidencePath) { [System.IO.File]::ReadAllText($browserEvidencePath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json } else { $null }
    if ($modelEvidence.status -ne 'PASS_TARGETED_MODEL') { throw 'A C002 modell-evidence nem PASS.' }
    if ($modelEvidence.identity.applicationVersion -ne 'V004-dev' -or $modelEvidence.identity.applicationSchemaVersion -ne 7) { throw 'V004 application identity mismatch.' }
    if ($modelEvidence.identity.databaseName -ne 'spg-crafting-list-v004' -or $modelEvidence.identity.databaseVersion -ne 1) { throw 'V004 database identity mismatch.' }
    if ($modelEvidence.identity.backupSchemaVersion -ne 3) { throw 'A V004 backup schema nem 3.' }
    if ($modelEvidence.migration.sourceAccessMode -ne 'READ_ONLY') { throw 'A V003 source access nem read-only.' }
    if ($modelEvidence.singleFile.applicationRuntimeFileCount -ne 1 -or $modelEvidence.singleFile.localRuntimeSidecars -ne 0) { throw 'A single-file runtime gate sikertelen.' }
    $expectedOutputCount = 'OUTPUT_COUNT_UNPROVEN ' + [char]0x2013 + ' COMPLETION MUST BLOCK AFFECTED RECIPES'
    if ($modelEvidence.outputCount.conclusion -ne $expectedOutputCount) { throw 'Output-count evidence conclusion mismatch.' }

    $browserPass = $null -ne $browserEvidence -and $browserEvidence.status -eq 'PASS_TARGETED_CHROME'
    if (-not $browserPass) { throw 'Targeted Chrome evidence is missing or not PASS.' }
    if ($browserEvidence.applicationSha256 -ne $modelEvidence.applicationSha256) { throw 'Chrome evidence does not match current application bytes.' }
    if ($browserEvidence.migration.sourceAccess -ne 'READ_ONLY' -or $browserEvidence.migration.sourceUnchangedAfterMigration -ne $true) { throw 'A Chrome V003 read-only proof sikertelen.' }
    if ($browserEvidence.atomicFailure.partialUserData -ne $false -or $browserEvidence.atomicFailure.successLedgerAfterFailure -ne $false) { throw 'Az atomi rollback proof sikertelen.' }
    if (@($browserEvidence.applicationOriginConsoleErrors).Count -ne 0) { throw 'Application-origin console or page error detected.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $tagTypeAfter = (& git cat-file -t V003).Trim()
    $tagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $stableItemAfter = Get-Item -LiteralPath $stablePath
    $stableShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $stablePath).Hash.ToLowerInvariant()
    if ($tagTypeAfter -ne $tagTypeBefore -or $tagTargetAfter -ne $tagTargetBefore) { throw 'V003 tag changed during validation.' }
    if ($stableItemAfter.Length -ne $stableItemBefore.Length -or $stableShaAfter -ne $stableShaBefore) { throw 'V003 artifact changed during validation.' }

    $summary = [ordered]@{
        cycle = 'V004-C002'
        status = 'PASS_DATABASE_SCHEMA_SAFE_V003_MIGRATION_FOUNDATION'
        validationHead = (& git rev-parse HEAD).Trim()
        c001Checkpoint = $c001Checkpoint
        applicationRuntimeIdentity = 'V004-dev'
        applicationSchemaVersion = 7
        databaseName = 'spg-crafting-list-v004'
        databaseVersion = 1
        backupSchemaVersion = 3
        sourceDatabase = 'spg-crafting-list'
        sourceDatabaseVersion = 4
        sourceAccess = 'READ_ONLY'
        sourceUnchanged = $true
        craftHistoryAfterMigration = 0
        revisionInitialValue = 0
        migrationFingerprint = 'SHA-256'
        duplicateMigration = 'V003_MIGRATION_ALREADY_APPLIED'
        changedSource = 'V003_SOURCE_CHANGED_AFTER_MIGRATION'
        nonPristineTarget = 'V004_TARGET_NOT_PRISTINE'
        atomicFailureRollback = 'PASS'
        outputCount = $expectedOutputCount
        chromeStartup = $browserEvidence.startup.status
        chromeRefreshReopen = $browserEvidence.startup.refreshReopen
        directFileGate = $browserEvidence.fileGate.status
        applicationOriginConsoleErrors = 0
        localRuntimeSidecars = 0
        applicationRuntimeFileCount = 1
        v003TagTarget = $tagTargetAfter
        v003ArtifactBytes = $stableItemAfter.Length
        v003ArtifactSha256 = $stableShaAfter
        v001V002Unchanged = $true
        craftCompleteInventoryDeduction = 'NOT_IMPLEMENTED'
        undo = 'NOT_IMPLEMENTED'
        fullRegression = 'NOT_RUN_BY_SCOPE'
        push = 'NO'
        forcePush = 'NO'
    }
    [System.IO.File]::WriteAllText($summaryPath, (($summary | ConvertTo-Json -Depth 8) + "`n"), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('result=PASS_DATABASE_SCHEMA_SAFE_V003_MIGRATION_FOUNDATION')
    $lines.Add("applicationSha256=$($modelEvidence.applicationSha256)")
    $lines.Add("v003ArtifactSha256=$stableShaAfter")
    $lines.Add("directFileGate=$($browserEvidence.fileGate.status)")
    $lines.Add('fullRegression=NOT_RUN_BY_SCOPE')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V004_C002_VALIDATION_PASS summary=$summaryPath"
} finally {
    Pop-Location
}
