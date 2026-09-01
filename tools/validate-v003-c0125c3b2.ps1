param()

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory "test-artifacts\V003-C012.5C3B2"
$logPath = Join-Path $artifactDirectory "validation.log"
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

$checks = @(
    @{ Name = "static-gate"; File = "powershell.exe"; Arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot "validate-baseline.ps1")) },
    @{ Name = "c0125c3b2-target"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b2-tests.mjs")) },
    @{ Name = "c0125c3b1-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b1-tests.mjs")) },
    @{ Name = "c0125c3a-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3a-tests.mjs")) },
    @{ Name = "c0125c2-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c2-tests.mjs")) },
    @{ Name = "c0125c1-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c1-tests.mjs")) },
    @{ Name = "c0125b-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125b-tests.mjs")) },
    @{ Name = "c0125a-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125a-tests.mjs")) }
)

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("V003-C012.5C3B2 targeted validation")
foreach ($check in $checks) {
    $output = & $check.File @($check.Arguments) 2>&1
    $exitCode = $LASTEXITCODE
    $lines.Add("")
    $lines.Add("--- $($check.Name) exit=$exitCode ---")
    foreach ($line in @($output | Select-Object -Last 60)) { $lines.Add([string]$line) }
    if ($exitCode -ne 0) {
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $($check.Name) exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $($check.Name) exit=0"
}

$v001Commit = (git -C $projectDirectory rev-parse "V001^{}").Trim()
$v002Commit = (git -C $projectDirectory rev-parse "V002^{}").Trim()
$v002Hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $projectDirectory "releases\V002\sPg Crafting List.html")).Hash.ToLowerInvariant()
if ($v001Commit -ne "b22dbc3c2ef0765e30aa3806537854298c873dff" -or
    $v002Commit -ne "b326aaff5838aafd5b1f13b16982c29a0e150e35" -or
    $v002Hash -ne "de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357") {
    $lines.Add("V001_V002_INTEGRITY=FAIL")
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "FAIL v001-v002-integrity exit=1 log=$logPath"
    exit 1
}
$lines.Add("V001_V002_INTEGRITY=PASS")
$v003Tags = @(git -C $projectDirectory tag --list "V003*")
if ($v003Tags.Count -gt 0 -or (Test-Path -LiteralPath (Join-Path $projectDirectory "releases\V003"))) {
    $lines.Add("V003_TAG_RELEASE=FAIL")
    [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
    Write-Output "FAIL v003-tag-release exit=1 log=$logPath"
    exit 1
}
$lines.Add("V003_TAG_RELEASE=NONE")
[System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "PASS v001-v002-integrity exit=0"
Write-Output "V003_C0125C3B2_VALIDATION_PASS exit=0 log=$logPath"
