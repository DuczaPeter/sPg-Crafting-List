#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C012.5A'
$logPath = Join-Path $artifactDirectory 'validation.log'
$expectedBranch = 'develop/V003'
$baselineCommit = '1e7e407304f2a08ed427786e8ecee4ec84a0f777'
$expectedV001Commit = 'b22dbc3c2ef0765e30aa3806537854298c873dff'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Set-Content -LiteralPath $logPath -Value "V003-C012.5A targeted validation`r`n" -Encoding UTF8

function Invoke-BoundedCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments)
    $output = & $Executable @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    Add-Content -LiteralPath $logPath -Value ("--- {0} exit={1} ---" -f $Name, $exitCode) -Encoding UTF8
    $output | Add-Content -LiteralPath $logPath -Encoding UTF8
    if ($exitCode -ne 0) {
        Write-Output ("FAIL {0} exit={1} log={2}" -f $Name, $exitCode, $logPath)
        $output | Select-Object -Last 40
        exit $exitCode
    }
    Write-Output ("PASS {0} exit=0" -f $Name)
}

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($branch -ne $expectedBranch) { throw "Hibas branch: $branch" }
    & git merge-base --is-ancestor $baselineCommit HEAD
    if ($LASTEXITCODE -ne 0) { throw 'A lezart C013 abort baseline nem ose az aktualis HEAD-nek.' }

    Invoke-BoundedCheck 'static-gate' 'powershell.exe' @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '.\tools\validate-baseline.ps1')
    Invoke-BoundedCheck 'c0125a-target' 'node' @('.\tools\run-v003-c0125a-tests.mjs')
    Invoke-BoundedCheck 'c0123-quality-target' 'node' @('.\tools\run-v003-c0123-tests.mjs')
    Invoke-BoundedCheck 'c0124-numeric-target' 'node' @('.\tools\run-v003-c0124-tests.mjs')

    $v001Commit = (& git rev-parse 'V001^{commit}').Trim()
    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    $v002Sha = (Get-FileHash -Algorithm SHA256 -LiteralPath '.\releases\V002\sPg Crafting List.html').Hash.ToLowerInvariant()
    if ($v001Commit -ne $expectedV001Commit) { throw "V001 tag elteres: $v001Commit" }
    if ($v002Commit -ne $expectedV002Commit -or $v002Sha -ne $expectedV002Sha) { throw "V002 integritas elteres: $v002Commit / $v002Sha" }
    if (@(& git tag --list 'V003*').Count -gt 0) { throw 'V003 tag jelent meg.' }
    if (Test-Path -LiteralPath '.\releases\V003') { throw 'releases/V003 mappa jelent meg.' }

    Add-Content -LiteralPath $logPath -Value "V001_V002_INTEGRITY=PASS`r`nV003_TAG_RELEASE=NONE" -Encoding UTF8
    Write-Output "PASS v001-v002-integrity exit=0"
    Write-Output "V003_C0125A_VALIDATION_PASS exit=0 log=$logPath"
} finally {
    Pop-Location
}
