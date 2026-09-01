param()

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory "test-artifacts\V003-C013.1"
$logPath = Join-Path $artifactDirectory "validation.log"
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

$checks = @(
    @{ Name = "c0131-strict-allocation"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0131-tests.mjs")) },
    @{ Name = "m2-allocation"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-m2-tests.mjs")) },
    @{ Name = "m4-combined-backup"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-m4-tests.mjs")) },
    @{ Name = "c0123-quality-constraint"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0123-tests.mjs")) },
    @{ Name = "c0125c3a-pool-allocation"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3a-tests.mjs")) },
    @{ Name = "c0125c3b1-combined-pools"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b1-tests.mjs")) },
    @{ Name = "c0125c3b2-standalone"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b2-tests.mjs")) },
    @{ Name = "static-single-file"; File = "powershell.exe"; Arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot "validate-baseline.ps1")) }
)

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("V003-C013.1 targeted repair validation")
$lines.Add("FULL_RELEASE_REGRESSION=NOT_RUN_BY_SCOPE")
foreach ($check in $checks) {
    $output = & $check.File @($check.Arguments) 2>&1
    $exitCode = $LASTEXITCODE
    $result = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
    $lines.Add("$($check.Name)=$result")
    foreach ($line in @($output | Select-Object -Last 20)) { $lines.Add([string]$line) }
    if ($exitCode -ne 0) {
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $($check.Name) exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $($check.Name)"
}

$savedExpectedHead = $env:SPG_EXPECTED_HEAD
$savedAllowAppDiff = $env:SPG_ALLOW_APP_DIFF
$savedArtifactDirectory = $env:SPG_ARTIFACT_DIRECTORY
$savedStandaloneOutput = $env:SPG_STANDALONE_OUTPUT
$savedCycleId = $env:SPG_CYCLE_ID
try {
    $env:SPG_EXPECTED_HEAD = (git -C $projectDirectory rev-parse HEAD).Trim()
    $env:SPG_ALLOW_APP_DIFF = "1"
    $env:SPG_ARTIFACT_DIRECTORY = Join-Path $artifactDirectory "integrated-fr86"
    $env:SPG_STANDALONE_OUTPUT = Join-Path $artifactDirectory "standalone\sPg Crafting List - FR-86 targeted.html"
    $env:SPG_CYCLE_ID = "V003-C013.1"
    $d1Output = & node (Join-Path $PSScriptRoot "run-v003-c0125d1-tests.mjs") 2>&1
    $d1ExitCode = $LASTEXITCODE
} finally {
    $env:SPG_EXPECTED_HEAD = $savedExpectedHead
    $env:SPG_ALLOW_APP_DIFF = $savedAllowAppDiff
    $env:SPG_ARTIFACT_DIRECTORY = $savedArtifactDirectory
    $env:SPG_STANDALONE_OUTPUT = $savedStandaloneOutput
    $env:SPG_CYCLE_ID = $savedCycleId
}
$d1Result = if ($d1ExitCode -eq 0) { "PASS" } else { "FAIL" }
$lines.Add("integrated-fr86=$d1Result")
foreach ($line in @($d1Output | Select-Object -Last 20)) { $lines.Add([string]$line) }
if ($d1ExitCode -ne 0) {
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "FAIL integrated-fr86 exit=$d1ExitCode log=$logPath"
    exit $d1ExitCode
}
Write-Output "PASS integrated-fr86"

$v001Commit = (git -C $projectDirectory rev-parse "V001^{}").Trim()
$v002Commit = (git -C $projectDirectory rev-parse "V002^{}").Trim()
$v002Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectDirectory "releases\V002\sPg Crafting List.html")).Hash.ToLowerInvariant()
if ($v001Commit -ne "b22dbc3c2ef0765e30aa3806537854298c873dff" -or
    $v002Commit -ne "b326aaff5838aafd5b1f13b16982c29a0e150e35" -or
    $v002Hash -ne "de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357") {
    throw "V001/V002 integrity failed."
}
$v003Tags = @(git -C $projectDirectory tag --list "V003*")
if ($v003Tags.Count -gt 0 -or (Test-Path -LiteralPath (Join-Path $projectDirectory "releases\V003"))) {
    throw "Unexpected V003 tag or release directory."
}
$freshCandidatePath = Join-Path $projectDirectory "test-artifacts\V003-C013\fresh-release-candidate\sPg Crafting List V003 RC.html"
$freshCandidateHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $freshCandidatePath).Hash.ToLowerInvariant()
if ($freshCandidateHash -ne "d4ce0fb9caea5e2f77597ce76ae05321d8d8a5c3721dfb91ebf431a7ebeef182") {
    throw "The blocked V003-C013 candidate changed."
}
$lines.Add("V001_V002_INTEGRITY=PASS")
$lines.Add("BLOCKED_C013_CANDIDATE_UNCHANGED=PASS")
$lines.Add("V003_TAG_RELEASE=NONE")
[System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "V003_C0131_TARGETED_VALIDATION_PASS log=$logPath"
