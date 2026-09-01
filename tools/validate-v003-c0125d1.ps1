param()

$ErrorActionPreference = "Stop"
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory "test-artifacts\V003-C012.5D1"
$evidencePath = Join-Path $artifactDirectory "integration-evidence.json"
$logPath = Join-Path $artifactDirectory "validation.log"
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

$baseline = (git -C $projectDirectory rev-parse HEAD).Trim()
if ($baseline -ne "42f94e9ecc40076174ac1c732e70d26402ea291f") {
    throw "Unexpected baseline: $baseline"
}
git -C $projectDirectory diff --quiet -- "sPg Crafting List.html"
if ($LASTEXITCODE -ne 0) { throw "Application code changed before D1 gate." }

$checks = @(
    @{ Name = "c0125d1-integrated"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125d1-tests.mjs")) },
    @{ Name = "c0125a-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125a-tests.mjs")) },
    @{ Name = "c0125b-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125b-tests.mjs")) },
    @{ Name = "c0125c1-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c1-tests.mjs")) },
    @{ Name = "c0125c2-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c2-tests.mjs")) },
    @{ Name = "c0125c3a-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3a-tests.mjs")) },
    @{ Name = "c0125c3b1-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b1-tests.mjs")) },
    @{ Name = "c0125c3b2-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0125c3b2-tests.mjs")) },
    @{ Name = "c0123-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0123-tests.mjs")) },
    @{ Name = "c0124-numeric-direct"; File = "node"; Arguments = @((Join-Path $PSScriptRoot "run-v003-c0124-tests.mjs")) },
    @{ Name = "m4-backup-restore"; File = "powershell.exe"; Arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot "validate-m4.ps1")) },
    @{ Name = "m6-standalone"; File = "powershell.exe"; Arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot "validate-m6.ps1")) },
    @{ Name = "static-single-file"; File = "powershell.exe"; Arguments = @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot "validate-baseline.ps1")) }
)

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("V003-C012.5D1 integrated automated gate")
$lines.Add("BASELINE=$baseline")
foreach ($check in $checks) {
    $output = & $check.File @($check.Arguments) 2>&1
    $exitCode = $LASTEXITCODE
    $lines.Add("$($check.Name)=$([string]::Join('', @($(if ($exitCode -eq 0) { 'PASS' } else { 'FAIL' }))))")
    if ($exitCode -ne 0) {
        foreach ($line in @($output | Select-Object -Last 30)) { $lines.Add([string]$line) }
        [System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Write-Output "FAIL $($check.Name) exit=$exitCode log=$logPath"
        exit $exitCode
    }
    Write-Output "PASS $($check.Name)"
}

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
git -C $projectDirectory diff --quiet -- "sPg Crafting List.html"
if ($LASTEXITCODE -ne 0) { throw "Application code changed during D1 gate." }

$evidence = Get-Content -LiteralPath $evidencePath -Raw -Encoding UTF8 | ConvertFrom-Json
$evidence.status = "PASS"
$evidence.gateChain = [ordered]@{
    C0125A = "PASS"
    C0125B = "PASS"
    C0125C1 = "PASS"
    C0125C2 = "PASS"
    C0125C3A = "PASS"
    C0125C3B1 = "PASS"
    C0125C3B2 = "PASS"
    C0123 = "PASS"
    C0124Numeric = "PASS"
    M4BackupRestore = "PASS"
    M6Standalone = "PASS"
    StaticSingleFile = "PASS"
}
$evidence.v001V002Integrity = [ordered]@{
    status = "PASS"
    v001Commit = $v001Commit
    v002Commit = $v002Commit
    v002ArtifactSha256 = $v002Hash
}
[System.IO.File]::WriteAllText($evidencePath, (($evidence | ConvertTo-Json -Depth 12) + [Environment]::NewLine), [System.Text.UTF8Encoding]::new($false))
$lines.Add("V001_V002_INTEGRITY=PASS")
$lines.Add("APPLICATION_CODE_CHANGED=NO")
$lines.Add("V003_TAG_RELEASE=NONE")
[System.IO.File]::WriteAllLines($logPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Output "V003_C0125D1_VALIDATION_PASS evidence=$evidencePath log=$logPath"
