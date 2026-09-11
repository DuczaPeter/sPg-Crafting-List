#Requires -Version 5.1
param(
    [Parameter(Mandatory = $true)]
    [string]$PlaywrightModulePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$inputHead = '4923aae9948666aeb6acdb793b64f77706419648'
$candidateSourceHead = 'c4fef88d5d0a910437b814aa2bd9f90b9375c877'
$expectedV003TagTarget = 'ebc83281769fd212d988ee55957b1c2754256490'
$expectedV003ArtifactSize = 835820
$expectedV003ArtifactSha = '87382a8f3c43f939647702b30d6c1c2a697e3e76347b788e3ef4555bb44775c8'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V004-C008'
$candidateDirectory = Join-Path $artifactDirectory 'fresh-release-candidate'
$candidatePath = Join-Path $candidateDirectory 'sPg Crafting List V004 RC.html'
$manifestPath = Join-Path $candidateDirectory 'candidate-manifest.json'
$validationLogPath = Join-Path $artifactDirectory 'validation.log'
$regressionEvidencePath = Join-Path $artifactDirectory 'release-regression-evidence.json'
$targetSummaryPath = Join-Path $artifactDirectory 'target-summary.json'
$v003ArtifactPath = Join-Path $projectRoot 'releases\V003\sPg Crafting List.html'
$stableV004Path = Join-Path $projectRoot 'releases\V004'
$temporaryProject = $null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V004-C008 fresh release candidate validation')
$leafResults = [ordered]@{}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

function Invoke-BoundedCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $previousErrorActionPreference = $ErrorActionPreference
    $started = Get-Date
    try {
        $ErrorActionPreference = 'Continue'
        $output = & $Executable @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    $durationMs = [int64]((Get-Date) - $started).TotalMilliseconds
    $status = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $lines.Add("$Name=$status durationMs=$durationMs")
    foreach ($line in @($output | Select-Object -Last 40)) { $lines.Add([string]$line) }
    if ($exitCode -ne 0) { throw "$Name failed with exit code $exitCode" }
    Write-Output "PASS $Name"
}

function Invoke-LeafCheck {
    param([string]$Name, [hashtable]$Definition)
    $started = Get-Date
    Invoke-BoundedCheck $Name $Definition.Executable $Definition.Arguments
    $leafResults[$Name] = [ordered]@{
        status = 'PASS'
        durationMs = [int64]((Get-Date) - $started).TotalMilliseconds
    }
}

function Read-Json {
    param([string]$Path)
    return [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
}

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $validationHead = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'candidate/V004') { throw "Unexpected branch: $branch" }
    & git merge-base --is-ancestor $candidateSourceHead HEAD
    if ($LASTEXITCODE -ne 0) { throw 'The candidate identity commit is not an ancestor of validation HEAD.' }
    if ((& git rev-parse "$candidateSourceHead^").Trim() -ne $inputHead) { throw 'The candidate identity commit is not the direct child of the exact C007.1 checkpoint.' }
    if (@(& git status --porcelain=v1).Count -ne 0) { throw 'The release validator requires a clean working tree.' }
    if (-not (Test-Path -LiteralPath $PlaywrightModulePath)) { throw "Playwright module not found: $PlaywrightModulePath" }
    if (Test-Path -LiteralPath $stableV004Path) { throw 'V004 stable artifact path already exists; C008 cannot overwrite it.' }
    & git show-ref --verify --quiet refs/tags/V004
    if ($LASTEXITCODE -eq 0) { throw 'V004 tag already exists; C008 cannot continue.' }

    $gitDir = (& git rev-parse --git-dir).Trim()
    $operations = @(@('MERGE_HEAD', 'REBASE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply') | Where-Object {
        Test-Path -LiteralPath (Join-Path $gitDir $_)
    })
    if ($operations.Count -gt 0) { throw "Git operation in progress: $($operations -join ', ')" }

    $v003TagTypeBefore = (& git cat-file -t V003).Trim()
    $v003TagTargetBefore = (& git rev-parse 'V003^{}').Trim()
    $v003ArtifactBefore = Get-Item -LiteralPath $v003ArtifactPath
    $v003ArtifactShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $v003ArtifactPath).Hash.ToLowerInvariant()
    if ($v003TagTypeBefore -ne 'tag' -or $v003TagTargetBefore -ne $expectedV003TagTarget) { throw 'V003 annotated tag mismatch.' }
    if ($v003ArtifactBefore.Length -ne $expectedV003ArtifactSize -or $v003ArtifactShaBefore -ne $expectedV003ArtifactSha) { throw 'V003 artifact mismatch.' }
    & git diff --quiet V003 HEAD -- releases/V001 releases/V002 releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'Protected V001/V002/V003 release path differs from V003.' }

    Invoke-BoundedCheck 'candidate-raw-byte-build' 'node' @('.\tools\build-v004-c008-release-candidate.mjs')
    Invoke-BoundedCheck 'identity-dataset-adapter-freeze' 'node' @('.\tools\run-v004-c008-identity-freeze-tests.mjs')
    $manifest = Read-Json $manifestPath
    $identityEvidence = Read-Json (Join-Path $artifactDirectory 'identity-freeze-evidence.json')
    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytes = (Get-Item -LiteralPath $candidatePath).Length
    if ($manifest.sourceHead -ne $candidateSourceHead -or $manifest.sha256 -ne $candidateShaBefore -or [int64]$manifest.bytes -ne $candidateBytes) { throw 'Candidate manifest mismatch.' }
    if ($manifest.runtimeIdentity -ne 'V004' -or $manifest.v004DevRuntimeIdentityOccurrences -ne 0 -or $manifest.backupSchemaVersion -ne 3 -or $manifest.applicationRuntimeFileCount -ne 1 -or $manifest.localRuntimeSidecars -ne 0) { throw 'Candidate identity/schema/single-file manifest mismatch.' }
    if ($identityEvidence.status -ne 'PASS_IDENTITY_ONLY_DATASET_ADAPTER_FREEZE' -or $identityEvidence.allOtherApplicationBytesUnchanged -ne $true -or $identityEvidence.full1606BlueprintAuditRequired -ne $false) { throw 'Dataset/adapter freeze proof mismatch.' }

    $testPlan = Read-Json (Join-Path $projectRoot 'tests\test-plan.json')
    $releaseTest = @($testPlan.tests | Where-Object { $_.id -eq 'v004-c008-release-candidate' })
    if ($releaseTest.Count -ne 1) { throw 'Missing or duplicate v004-c008-release-candidate test-plan entry.' }
    $configuredLeafTests = @($releaseTest[0].leafTests)

    $temporaryProject = Join-Path ([System.IO.Path]::GetTempPath()) ("spg-v004-c008-" + [guid]::NewGuid().ToString('N'))
    Invoke-BoundedCheck 'isolated-candidate-clone' 'git' @('clone', '--no-hardlinks', '--no-tags', '--single-branch', '--branch', 'candidate/V004', $projectRoot, $temporaryProject)
    Copy-Item -LiteralPath $candidatePath -Destination (Join-Path $temporaryProject 'sPg Crafting List.html') -Force
    $isolatedApplicationPath = Join-Path $temporaryProject 'sPg Crafting List.html'
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $isolatedApplicationPath).Hash.ToLowerInvariant() -ne $candidateShaBefore) { throw 'The isolated test application differs from the exact candidate.' }

    $leafCommands = [ordered]@{
        'baseline-static' = @{ Executable = 'powershell.exe'; Arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1') }
        'm1-model-cache' = @{ Executable = 'node'; Arguments = @('.\tools\run-m1-tests.mjs') }
        'm2-inventory-allocation' = @{ Executable = 'node'; Arguments = @('.\tools\run-m2-tests.mjs') }
        'm3-mining' = @{ Executable = 'node'; Arguments = @('.\tools\run-m3-tests.mjs') }
        'm4-combined-backup' = @{ Executable = 'node'; Arguments = @('.\tools\run-m4-tests.mjs') }
        'm5-uex-refinery' = @{ Executable = 'node'; Arguments = @('.\tools\run-m5-tests.mjs') }
        'm6-standalone-export' = @{ Executable = 'node'; Arguments = @('.\tools\run-m6-tests.mjs') }
        'm61-ui-completeness' = @{ Executable = 'node'; Arguments = @('.\tools\run-m61-ui-tests.mjs') }
        'c04-embedded-css' = @{ Executable = 'node'; Arguments = @('.\tools\verify-embedded-application-css.mjs') }
        'c04-file-export' = @{ Executable = 'node'; Arguments = @('.\tools\run-c04-file-export-tests.mjs') }
        'v003-c003-material-naming' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c003-tests.mjs') }
        'v003-c004-radar-top3' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c004-tests.mjs') }
        'v003-c005-consistency' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c005-tests.mjs') }
        'v003-c006-final-card' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c006-tests.mjs') }
        'v003-c007-color' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c007-tests.mjs') }
        'v003-c008-detail' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c008-tests.mjs') }
        'v003-c0081-detail-fix' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0081-tests.mjs') }
        'v003-c009-api-main-card' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c009-tests.mjs') }
        'v003-c010-final-card' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c010-tests.mjs') }
        'v003-c0101-compact-mining-refinery' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0101-tests.mjs') }
        'v003-c011-visual-cleanup' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c011-tests.mjs') }
        'v003-c012-card-parity' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c012-tests.mjs') }
        'v003-c0121-quality-planner' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0121-tests.mjs') }
        'v003-c0122-version-consistency' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0122-tests.mjs') }
        'v003-c0123-quality-constraints' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0123-tests.mjs') }
        'v003-c0124-numeric-editing' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0124-tests.mjs') }
        'v003-c0125a-inventory-independence' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125a-tests.mjs') }
        'v003-c0125b-quality-pools' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125b-tests.mjs') }
        'v003-c0125c1-slot-assignment' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125c1-tests.mjs') }
        'v003-c0125c2-pool-dropdown' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125c2-tests.mjs') }
        'v003-c0125c3a-allocation-integration' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125c3a-tests.mjs') }
        'v003-c0125c3b1-material-database-pools' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125c3b1-tests.mjs') }
        'v003-c0125c3b2-preview-parity' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125c3b2-tests.mjs') }
        'v003-c0125d1-integrated-fixture' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0125d1-tests.mjs') }
        'v003-c0131-strict-allocation' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0131-tests.mjs') }
        'v003-c0133-disjoint-canonical' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0133-tests.mjs') }
        'v003-c0135-canonical-picker' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0135-tests.mjs') }
        'v003-c0137-user-data-independent-picker' = @{ Executable = 'node'; Arguments = @('.\tools\run-v003-c0137-tests.mjs') }
        'v004-c002-migration-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c002-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c003-revision-reservation-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c003-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c004-complete-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c004-tests.mjs') }
        'v004-c004-complete-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c004-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c0044-normalization-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0044-tests.mjs') }
        'v004-c0044-normalization-chrome-wiki-smoke' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0044-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c005-history-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c005-tests.mjs') }
        'v004-c005-history-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c005-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c006-undo-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c006-tests.mjs') }
        'v004-c006-undo-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c006-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c0061-backup-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0061-tests.mjs') }
        'v004-c0061-backup-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0061-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c007-multi-tab-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c007-tests.mjs') }
        'v004-c007-multi-tab-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c007-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c0071-user-data-safety-model' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0071-tests.mjs') }
        'v004-c0071-user-data-safety-chrome' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c0071-browser-tests.mjs', "--playwright-module=$PlaywrightModulePath") }
        'v004-c008-candidate-chrome-direct-live' = @{ Executable = 'node'; Arguments = @('.\tools\run-v004-c008-candidate-browser-tests.mjs', '--application=.\sPg Crafting List.html', '--evidence=.\test-artifacts\V004-C008\candidate-browser-evidence.json', "--playwright-module=$PlaywrightModulePath") }
    }
    if ($configuredLeafTests.Count -ne $leafCommands.Count) { throw "Test-plan/validator leaf count mismatch: $($configuredLeafTests.Count) vs $($leafCommands.Count)" }
    foreach ($leafId in $configuredLeafTests) {
        if (-not $leafCommands.Contains($leafId)) { throw "Unknown configured C008 leaf: $leafId" }
    }
    foreach ($leafId in $leafCommands.Keys) {
        if ($configuredLeafTests -notcontains $leafId) { throw "Validator leaf missing from test plan: $leafId" }
    }

    $previousExpectedRuntimeIdentity = $env:SPG_EXPECTED_RUNTIME_IDENTITY
    $env:SPG_EXPECTED_RUNTIME_IDENTITY = 'V004'
    Push-Location $temporaryProject
    try {
        foreach ($leafId in $configuredLeafTests) {
            Invoke-LeafCheck $leafId $leafCommands[$leafId]
        }
    } finally {
        Pop-Location
        $env:SPG_EXPECTED_RUNTIME_IDENTITY = $previousExpectedRuntimeIdentity
    }

    $isolatedShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $isolatedApplicationPath).Hash.ToLowerInvariant()
    if ($isolatedShaAfter -ne $candidateShaBefore) { throw 'The exact candidate changed during isolated regression.' }
    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    if ($candidateShaAfter -ne $candidateShaBefore -or (Get-Item -LiteralPath $candidatePath).Length -ne $candidateBytes) { throw 'The frozen candidate changed during release validation.' }

    $isolatedEvidence = @(
        'test-artifacts\V004-C002\browser-evidence.json',
        'test-artifacts\V004-C003\browser-evidence.json',
        'test-artifacts\V004-C004\model-evidence.json',
        'test-artifacts\V004-C004\browser-evidence.json',
        'test-artifacts\V004-C004.4\model-evidence.json',
        'test-artifacts\V004-C004.4\browser-evidence.json',
        'test-artifacts\V004-C005\model-evidence.json',
        'test-artifacts\V004-C005\browser-evidence.json',
        'test-artifacts\V004-C006\model-evidence.json',
        'test-artifacts\V004-C006\browser-evidence.json',
        'test-artifacts\V004-C006.1\model-evidence.json',
        'test-artifacts\V004-C006.1\browser-evidence.json',
        'test-artifacts\V004-C007\model-evidence.json',
        'test-artifacts\V004-C007\browser-evidence.json',
        'test-artifacts\V004-C007.1\model-evidence.json',
        'test-artifacts\V004-C007.1\browser-evidence.json'
    )
    foreach ($relativePath in $isolatedEvidence) {
        $evidence = Read-Json (Join-Path $temporaryProject $relativePath)
        if (-not ([string]$evidence.status).StartsWith('PASS')) { throw "Non-PASS current V004 evidence: $relativePath" }
        if ($evidence.applicationSha256 -ne $candidateShaBefore) { throw "Current V004 evidence is not candidate-byte scoped: $relativePath" }
    }

    $candidateBrowserSource = Join-Path $temporaryProject 'test-artifacts\V004-C008\candidate-browser-evidence.json'
    $candidateBrowserTarget = Join-Path $artifactDirectory 'candidate-browser-evidence.json'
    Copy-Item -LiteralPath $candidateBrowserSource -Destination $candidateBrowserTarget -Force
    $candidateBrowser = Read-Json $candidateBrowserTarget
    if ($candidateBrowser.status -ne 'PASS_CANDIDATE_GOOGLE_CHROME' -or $candidateBrowser.candidateSha256 -ne $candidateShaBefore -or $candidateBrowser.runtimeIdentity -ne 'V004') { throw 'Candidate Chrome identity/SHA gate failed.' }
    if ($candidateBrowser.desktop.overflow -ne 0 -or $candidateBrowser.mobile.overflow -ne 0 -or @($candidateBrowser.consoleErrors).Count -ne 0 -or @($candidateBrowser.pageErrors).Count -ne 0) { throw 'Candidate Chrome responsive/console/page gate failed.' }
    if ($candidateBrowser.directFile.status -ne 'PASS_AUTOMATED' -or $candidateBrowser.directFile.protocol -ne 'file:' -or $candidateBrowser.directFile.gameDataIdentity -ne '4.10.0-LIVE.12519617' -or $candidateBrowser.directFile.uexHttpStatus -ne 200) { throw 'Candidate direct-file live Wiki/UEX gate failed.' }

    $v003TagTypeAfter = (& git cat-file -t V003).Trim()
    $v003TagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $v003ArtifactAfter = Get-Item -LiteralPath $v003ArtifactPath
    $v003ArtifactShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $v003ArtifactPath).Hash.ToLowerInvariant()
    if ($v003TagTypeAfter -ne $v003TagTypeBefore -or $v003TagTargetAfter -ne $v003TagTargetBefore) { throw 'V003 tag changed during C008.' }
    if ($v003ArtifactAfter.Length -ne $v003ArtifactBefore.Length -or $v003ArtifactShaAfter -ne $v003ArtifactShaBefore) { throw 'V003 artifact changed during C008.' }
    & git show-ref --verify --quiet refs/tags/V004
    if ($LASTEXITCODE -eq 0) { throw 'V004 tag was created during C008.' }
    if (Test-Path -LiteralPath $stableV004Path) { throw 'V004 stable artifact was created during C008.' }
    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')

    $regressionEvidence = [ordered]@{
        cycle = 'V004-C008'
        status = 'PASS_FULL_INTEGRATION_EXACT_CANDIDATE_BYTES'
        candidateSourceHead = $candidateSourceHead
        validationHead = $validationHead
        candidateSha256 = $candidateShaAfter
        candidateBytes = $candidateBytes
        exactCandidateImmutable = $true
        leafTests = $leafResults
        leafTestCount = $leafResults.Count
        nestedLegacyValidators = 0
        gameDataIdentity = $candidateBrowser.directFile.gameDataIdentity
        datasetAdapterFreeze = 'PASS_IDENTITY_ONLY'
        full1606BlueprintAudit = 'NOT_RERUN_UNCHANGED_ADAPTER_AND_DATASET_CONTRACT'
        representativeWikiSmoke = 'PASS'
        representativeUexSmoke = 'PASS'
        googleChrome = 'PASS'
        automatedDirectFile = 'PASS'
        desktopViewport = '1920x1080_PASS_OVERFLOW_0'
        mobileViewport = '390x844_PASS_OVERFLOW_0'
        consoleErrors = 0
        pageErrors = 0
        protectedV001V002V003 = 'PASS'
    }
    Write-Utf8NoBom $regressionEvidencePath (($regressionEvidence | ConvertTo-Json -Depth 12) + "`n")

    $summary = [ordered]@{
        cycle = 'V004-C008'
        status = 'AUTOMATED_RELEASE_CANDIDATE_PASS_MANUAL_FILE_GATE_REQUIRED'
        inputCheckpoint = $inputHead
        candidateBranch = 'candidate/V004'
        candidateCommit = $candidateSourceHead
        validationHead = $validationHead
        candidatePath = 'test-artifacts/V004-C008/fresh-release-candidate/sPg Crafting List V004 RC.html'
        candidateSha256 = $candidateShaAfter
        candidateBytes = $candidateBytes
        runtimeIdentity = 'V004'
        v004DevRuntimeOccurrences = 0
        gameDataIdentity = '4.10.0-LIVE.12519617'
        backupSchemaVersion = 3
        fullIntegrationRegression = 'PASS'
        chromeCandidateGate = 'PASS'
        automatedDirectFile = 'PASS'
        singleFile = 'PASS'
        applicationRuntimeFileCount = 1
        localRuntimeSidecars = 0
        protectedV001V002V003 = 'PASS'
        manualFileGate = 'REQUIRED'
        stableArtifact = 'NOT_CREATED'
        v004Tag = 'NOT_CREATED'
        push = 'NO'
    }
    Write-Utf8NoBom $targetSummaryPath (($summary | ConvertTo-Json -Depth 8) + "`n")
    $lines.Add('result=AUTOMATED_RELEASE_CANDIDATE_PASS_MANUAL_FILE_GATE_REQUIRED')
    $lines.Add("candidateSha256=$candidateShaAfter")
    $lines.Add("candidateBytes=$candidateBytes")
    $lines.Add('manualFileGate=REQUIRED')
    $lines.Add('stableArtifact=NOT_CREATED')
    $lines.Add('v004Tag=NOT_CREATED')
    $lines.Add('push=NO')
    Write-Utf8NoBom $validationLogPath (($lines -join "`n") + "`n")
    Write-Output "V004_C008_AUTOMATED_RELEASE_CANDIDATE_PASS candidate=$candidatePath bytes=$candidateBytes sha256=$candidateShaAfter"
} catch {
    $failure = $_.Exception.Message
    $lines.Add("result=V004-C008_RELEASE_CANDIDATE_BLOCKED")
    $lines.Add("failure=$failure")
    $lines.Add('stableArtifact=NOT_CREATED')
    $lines.Add('v004Tag=NOT_CREATED')
    $lines.Add('push=NO')
    Write-Utf8NoBom $validationLogPath (($lines -join "`n") + "`n")
    $blocked = [ordered]@{
        cycle = 'V004-C008'
        status = 'RELEASE_CANDIDATE_BLOCKED'
        failure = $failure
        candidateCommit = $candidateSourceHead
        stableArtifact = 'NOT_CREATED'
        v004Tag = 'NOT_CREATED'
        push = 'NO'
    }
    Write-Utf8NoBom $targetSummaryPath (($blocked | ConvertTo-Json -Depth 6) + "`n")
    throw
} finally {
    Pop-Location
    if ($temporaryProject -and (Test-Path -LiteralPath $temporaryProject)) {
        $resolvedTempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
        $resolvedTemporaryProject = [System.IO.Path]::GetFullPath($temporaryProject)
        if (-not $resolvedTemporaryProject.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Unsafe temporary cleanup target: $resolvedTemporaryProject"
        }
        Remove-Item -LiteralPath $resolvedTemporaryProject -Recurse -Force
    }
}
