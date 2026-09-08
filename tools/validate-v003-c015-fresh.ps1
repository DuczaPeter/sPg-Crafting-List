#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceHead = '37f8852b4ddfd5b628d952a445f97ee5a5179a11'
$oldV003ReleaseCommit = '045bd8ce38dde5e2ef43999a038c4d835d644b9a'
$oldV003ReleaseSha = 'bb35a1a820385880c927f0a35b6dbb586a88c05ecbb3f9126cfc949517956469'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV001HtmlSha = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
$expectedV001CssSha = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C015\fresh-release-candidate'
$candidatePath = Join-Path $artifactDirectory 'sPg Crafting List V003 RC.html'
$manifestPath = Join-Path $artifactDirectory 'candidate-manifest.json'
$evidencePath = Join-Path $artifactDirectory 'automated-evidence.json'
$logPath = Join-Path $artifactDirectory 'validation.log'
$temporaryBase = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$temporaryProject = Join-Path $temporaryBase ('spg-v003-c015-regression-' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('V003-C015 fresh release candidate validation')

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
    $checkStatus = if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }
    $lines.Add("$Name=$checkStatus")
    if ($exitCode -ne 0) {
        foreach ($line in @($output | Select-Object -Last 80)) { $lines.Add([string]$line) }
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $Name exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $Name"
}

function Assert-PathWithin {
    param([string]$Path, [string]$Parent)
    $resolvedPath = [System.IO.Path]::GetFullPath($Path)
    $resolvedParent = [System.IO.Path]::GetFullPath($Parent)
    if (-not $resolvedPath.StartsWith($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase) -or $resolvedPath -eq $resolvedParent) {
        throw "Unsafe temporary path: $resolvedPath"
    }
    return $resolvedPath
}

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    $head = (& git rev-parse HEAD).Trim()
    if ($branch -ne 'develop/V003') { throw "Hibas branch: $branch" }
    if ($head -ne $sourceHead) { throw "A C015 exact source HEAD elter: $head" }
    if (@(& git status --porcelain --untracked-files=no).Count -gt 0) { throw 'Tracked working tree dirty a C015 indulaskor.' }
    & git diff --quiet $sourceHead -- 'sPg Crafting List.html'
    if ($LASTEXITCODE -ne 0) { throw 'Az application HTML elter a C014 source HEAD-tol.' }
    $appShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()

    $oldTagTargetBefore = (& git rev-parse 'V003^{}').Trim()
    $oldReleaseShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V003\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($oldTagTargetBefore -ne $oldV003ReleaseCommit) { throw 'A regi invalidalt V003 tag target elter.' }
    if ($oldReleaseShaBefore -ne $oldV003ReleaseSha) { throw 'A regi invalidalt V003 artifact SHA elter.' }
    & git diff --quiet V003 -- releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'A regi invalidalt releases/V003 fa elter a tagtol.' }

    Invoke-BoundedCheck 'static-single-file' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'candidate-raw-byte-copy' 'node' @('.\tools\build-v003-c015-fresh-candidate.mjs')
    Invoke-BoundedCheck 'c014-runtime-identity' 'node' @('.\tools\run-v003-c014-tests.mjs')

    $candidateShaBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $candidateBytes = (Get-Item -LiteralPath $candidatePath).Length
    if ($candidateShaBefore -ne $appShaBefore) { throw 'A C015 candidate nem raw-byte azonos a main HTML-lel.' }
    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifest.sourceHead -ne $sourceHead -or $manifest.sha256 -ne $candidateShaBefore -or [int64]$manifest.bytes -ne $candidateBytes) { throw 'A C015 manifest elter.' }

    Invoke-BoundedCheck 'isolated-regression-clone' 'git' @('clone', '--no-hardlinks', '--no-tags', '--single-branch', '--branch', 'develop/V003', $projectRoot, $temporaryProject)
    $temporaryProject = Assert-PathWithin -Path $temporaryProject -Parent $temporaryBase
    $temporaryHead = (& git -C $temporaryProject rev-parse HEAD).Trim()
    if ($temporaryHead -ne $sourceHead) { throw "Az izolalt regression clone HEAD elter: $temporaryHead" }
    if (@(& git -C $temporaryProject tag --list 'V003*').Count -ne 0) { throw 'Az izolalt regression clone V003 taget tartalmaz.' }
    & git -C $temporaryProject tag V001 $expectedV001Commit
    if ($LASTEXITCODE -ne 0) { throw 'Az izolalt V001 integrity ref nem hozhato letre.' }
    & git -C $temporaryProject tag V002 $expectedV002Commit
    if ($LASTEXITCODE -ne 0) { throw 'Az izolalt V002 integrity ref nem hozhato letre.' }
    $temporaryV003Release = Assert-PathWithin -Path (Join-Path $temporaryProject 'releases\V003') -Parent $temporaryProject
    if (-not (Test-Path -LiteralPath $temporaryV003Release)) { throw 'Az izolalt clone-bol hianyzik az invalidalt V003 evidence fa.' }
    Remove-Item -LiteralPath $temporaryV003Release -Recurse -Force
    Copy-Item -LiteralPath (Join-Path $projectRoot 'releases\V001\sPg Crafting List.html') -Destination (Join-Path $temporaryProject 'releases\V001\sPg Crafting List.html') -Force
    Copy-Item -LiteralPath (Join-Path $projectRoot 'releases\V001\Info\style.css') -Destination (Join-Path $temporaryProject 'releases\V001\Info\style.css') -Force
    Copy-Item -LiteralPath (Join-Path $projectRoot 'releases\V002\sPg Crafting List.html') -Destination (Join-Path $temporaryProject 'releases\V002\sPg Crafting List.html') -Force
    Copy-Item -LiteralPath $candidatePath -Destination (Join-Path $temporaryProject 'sPg Crafting List.html') -Force
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $temporaryProject 'sPg Crafting List.html')).Hash.ToLowerInvariant() -ne $candidateShaBefore) { throw 'Az izolalt regression HTML nem egyezik az exact candidate-tel.' }

    Push-Location $temporaryProject
    try {
        Invoke-BoundedCheck 'full-c001-c0122-m1-m61-c04' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-v003-c0122.ps1')
        Invoke-BoundedCheck 'c0123-quality-semantics' 'node' @('.\tools\run-v003-c0123-tests.mjs')
        Invoke-BoundedCheck 'c0124-numeric-lifecycle' 'node' @('.\tools\run-v003-c0124-tests.mjs')
        Invoke-BoundedCheck 'c0125a-through-c3b2' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-v003-c0125c3b2.ps1')
    } finally {
        Pop-Location
    }

    Invoke-BoundedCheck 'candidate-d1-c0131-c0133-c0135-c0137-c014-target' 'node' @('.\tools\run-v003-c015-fresh-tests.mjs')

    $oldAppPath = $env:SPG_APP_PATH
    $oldArtifactDirectory = $env:SPG_ARTIFACT_DIRECTORY
    try {
        $env:SPG_APP_PATH = $candidatePath
        $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory 'active-4.10-audit'
        Invoke-BoundedCheck 'active-4.10-identity-audit' 'node' @('.\tools\audit-v003-c0135-active-materials.mjs')
    } finally {
        if ($null -eq $oldAppPath) { Remove-Item Env:SPG_APP_PATH -ErrorAction SilentlyContinue } else { $env:SPG_APP_PATH = $oldAppPath }
        if ($null -eq $oldArtifactDirectory) { Remove-Item Env:SPG_ARTIFACT_DIRECTORY -ErrorAction SilentlyContinue } else { $env:SPG_ARTIFACT_DIRECTORY = $oldArtifactDirectory }
    }

    $targetEvidence = Get-Content -Raw -LiteralPath (Join-Path $artifactDirectory 'target-evidence.json') | ConvertFrom-Json
    $liveAudit = Get-Content -Raw -LiteralPath (Join-Path $artifactDirectory 'active-4.10-audit\active-4.10-material-identity-audit.json') | ConvertFrom-Json
    if ($targetEvidence.status -ne 'TARGET_PASS') { throw 'A C015 target evidence nem PASS.' }
    if ($targetEvidence.candidate.runtimeIdentity -ne 'V003' -or $targetEvidence.candidate.v003DevRuntimeIdentityOccurrences -ne 0) { throw 'A C015 candidate runtime identity elter.' }
    if ($liveAudit.activeScVersion -ne '4.10.0-LIVE.12519617') { throw 'Az aktiv SC dataset verzio elter.' }
    if ($liveAudit.feynmaline.visibleCount -ne 1 -or $liveAudit.feynmaline.canonicalUuid -ne '7310c15d-359c-42b4-b61e-7da3d0da3384') { throw 'Feynmaline canonical picker gate elter.' }
    if ($liveAudit.titanium.visibleCount -ne 1 -or $liveAudit.titanium.canonicalUuid -ne '64978449-1d87-4a16-ba55-4b5f94fee217') { throw 'Titanium canonical picker gate elter.' }
    if (@($liveAudit.titanium.sourceUuids) -notcontains '07570c9f-fdf6-4bca-a56b-c42809ec0e01') { throw 'A Titanium legacy source UUID provenance hianyzik.' }
    if ([int]$liveAudit.pickerSafety.visibleDuplicatePickerCount -ne 0 -or [int]$liveAudit.pickerSafety.guessedCanonicalUuidCount -ne 0) { throw 'Canonical picker safety gate elter.' }

    $candidateShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
    $appShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($candidateShaAfter -ne $candidateShaBefore -or $appShaAfter -ne $appShaBefore) { throw 'A candidate vagy application bytejai megvaltoztak a regresszio alatt.' }

    $v001Commit = (& git rev-parse 'V001^{}').Trim()
    $v002Commit = (& git rev-parse 'V002^{}').Trim()
    $v001HtmlSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\sPg Crafting List.html').Hash.ToLowerInvariant()
    $v001CssSha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V001\Info\style.css').Hash.ToLowerInvariant()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit -or $v001HtmlSha -ne $expectedV001HtmlSha -or $v001CssSha -ne $expectedV001CssSha) { throw 'V001 integritas elter.' }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw 'V002 integritas elter.' }

    $oldTagTargetAfter = (& git rev-parse 'V003^{}').Trim()
    $oldReleaseShaAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V003\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($oldTagTargetAfter -ne $oldTagTargetBefore -or $oldReleaseShaAfter -ne $oldReleaseShaBefore) { throw 'A regi invalidalt V003 tag/artifact megvaltozott.' }
    & git diff --quiet V003 -- releases/V003
    if ($LASTEXITCODE -ne 0) { throw 'A regi releases/V003 evidence fa megvaltozott.' }

    Invoke-BoundedCheck 'git-diff-check' 'git' @('diff', '--check')
    $evidence = [ordered]@{
        cycle = 'V003-C015'
        status = 'AUTOMATED_PASS_CHROME_PENDING'
        sourceHead = $sourceHead
        candidate = [ordered]@{ path = 'test-artifacts/V003-C015/fresh-release-candidate/sPg Crafting List V003 RC.html'; bytes = $candidateBytes; sha256Before = $candidateShaBefore; sha256After = $candidateShaAfter; mainSha256 = $appShaAfter; sourceByteIdentical = $true; immutable = $true; runtimeIdentity = 'V003'; v003DevRuntimeIdentityOccurrences = 0; singleFile = $true; embeddedCss = $true; embeddedJavaScript = $true; localRuntimeSidecars = 0 }
        regression = [ordered]@{ C001_C0122_M1_M61_C04 = 'PASS'; C0123 = 'PASS'; C0124 = 'PASS'; C0125A_C0125C3B2 = 'PASS'; C0125D1 = 'PASS'; C0131 = 'PASS'; C0133 = 'PASS'; C0135 = 'PASS'; C0137 = 'PASS'; C014 = 'PASS'; staticSingleFile = 'PASS'; standalone = 'PASS'; backupRestore = 'PASS'; combinedAllocationNoDoubleReserve = 'PASS' }
        canonicalPicker = [ordered]@{ activeScVersion = $liveAudit.activeScVersion; feynmalineCanonicalUuid = $liveAudit.feynmaline.canonicalUuid; titaniumCanonicalUuid = $liveAudit.titanium.canonicalUuid; titaniumLegacySourceUuid = '07570c9f-fdf6-4bca-a56b-c42809ec0e01'; tungstenCanonicalUuid = 'addc9aa4-5d2d-4c0d-b01b-ad2b2e50a5d6'; goldCanonicalUuid = '57aba429-cf97-4fdd-8042-94b1d643f5bd'; visibleDuplicatePickerCount = $liveAudit.pickerSafety.visibleDuplicatePickerCount; guessedCanonicalUuidCount = $liveAudit.pickerSafety.guessedCanonicalUuidCount; userDataIndependent = 'PASS' }
        qualityPools = [ordered]@{ minimumRange = 'Q_GTE_MINIMUM_AND_Q_LT_MAXIMUM'; maximumRange = 'Q_GTE_MAXIMUM'; overlap = $false; borrowing = $false; invalidRange = 'POOL_RANGE_INVALID'; allocationBlockedOnInvalidRange = $true }
        v001V002Integrity = 'PASS'
        oldInvalidatedV003 = [ordered]@{ tagTarget = $oldTagTargetAfter; artifactSha256 = $oldReleaseShaAfter; tagMovedOrDeleted = $false; releaseTreeChanged = $false }
        applicationCodeChanged = $false
        chrome = 'PENDING'
        exactManualCandidateFileGate = 'NOT_RUN'
        stableReplacementRelease = $false
    }
    [System.IO.File]::WriteAllText($evidencePath, (($evidence | ConvertTo-Json -Depth 30) + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
    $lines.Add('CANDIDATE_MAIN_BYTE_IDENTITY=PASS')
    $lines.Add("CANDIDATE_BYTES=$candidateBytes")
    $lines.Add("CANDIDATE_SHA256=$candidateShaAfter")
    $lines.Add('FULL_RELEVANT_RELEASE_REGRESSION=PASS')
    $lines.Add('C014_RUNTIME_IDENTITY=PASS')
    $lines.Add('OLD_INVALIDATED_V003_TAG_ARTIFACT_UNCHANGED=PASS')
    $lines.Add('V001_V002_INTEGRITY=PASS')
    $lines.Add('CHROME=PENDING')
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "V003_C015_FRESH_AUTOMATED_PASS candidate=$candidatePath bytes=$candidateBytes sha256=$candidateShaAfter"
} finally {
    if (Test-Path -LiteralPath $temporaryProject) {
        $safeTemporaryProject = Assert-PathWithin -Path $temporaryProject -Parent $temporaryBase
        Remove-Item -LiteralPath $safeTemporaryProject -Recurse -Force
    }
    Pop-Location
}
