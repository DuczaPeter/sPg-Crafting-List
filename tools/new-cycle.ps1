#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^V\d+$')]
    [string]$TargetVersion,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Purpose,

    [ValidateSet('targeted', 'related-regression', 'full-regression', 'manual')]
    [string]$TestLevel = 'targeted',

    [string]$TestId = '',
    [string]$TestExecutable = '',
    [string[]]$TestArguments = @(),

    [switch]$Checkpoint,
    [switch]$RequireAppLog,
    [switch]$RequireBrowserConsole
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$versionPath = Join-Path $projectRoot 'VERSION.json'
$statusPath = Join-Path $projectRoot 'STATUS.md'
$worklogPath = Join-Path $projectRoot 'WORKLOG.md'
$artifactRoot = Join-Path $projectRoot 'test-artifacts'
$testPlanPath = Join-Path $projectRoot 'tests\test-plan.json'

function Write-Utf8NoBom {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][string]$Content)
    $dir = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Get-JsonPropertyValue {
    param($Object, [string]$Name, $Default = $null)
    if ($null -ne $Object -and $Object.PSObject.Properties.Name -contains $Name) { return $Object.$Name }
    return $Default
}

function Set-JsonProperty {
    param([Parameter(Mandatory = $true)]$Object, [Parameter(Mandatory = $true)][string]$Name, $Value)
    if ($Object.PSObject.Properties.Name -contains $Name) {
        $Object.$Name = $Value
    } else {
        $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value
    }
}

function Get-MarkdownFieldValue {
    param([string]$Path, [string]$Prefix)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    foreach ($line in Get-Content -Encoding UTF8 -LiteralPath $Path) {
        if ($line.StartsWith($Prefix)) {
            $match = [regex]::Match($line, '`([^`]*)`')
            if ($match.Success) { return $match.Groups[1].Value }
            return $line.Substring($Prefix.Length).Trim()
        }
    }
    return $null
}

function Set-MarkdownField {
    param([Parameter(Mandatory = $true)][string]$Path, [Parameter(Mandatory = $true)][string]$Prefix, [Parameter(Mandatory = $true)][string]$Value)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return }
    $lines = @(Get-Content -Encoding UTF8 -LiteralPath $Path)
    $updated = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i].StartsWith($Prefix)) {
            $lines[$i] = ('{0} `{1}`' -f $Prefix, $Value)
            $updated = $true
            break
        }
    }
    if ($updated) {
        $encoding = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllLines($Path, $lines, $encoding)
    }
}

function Get-ShortHead {
    param([string]$WorkingDirectory)
    $head = (& git -C $WorkingDirectory rev-parse --short HEAD 2>$null) -join ''
    if ($LASTEXITCODE -ne 0) { return $null }
    return $head.Trim()
}

function Get-GitStatusLines {
    param([string]$WorkingDirectory)
    $lines = @(& git -C $WorkingDirectory status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) { throw 'git status failed.' }
    return @($lines)
}

function Assert-CleanGitWorktreeForCheckpoint {
    param([string]$WorkingDirectory)
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is not available; cannot create checkpoint.' }
    & git -C $WorkingDirectory rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Project is not a Git worktree; cannot create checkpoint.' }
    $dirty = @(Get-GitStatusLines -WorkingDirectory $WorkingDirectory)
    if ($dirty.Count -gt 0) {
        Write-Host 'Checkpoint refused: Git working tree is not clean at cycle start.'
        Write-Host 'Existing changes:'
        $dirty | ForEach-Object { Write-Host "  $_" }
        throw 'Checkpoint requires a clean Git working tree at cycle start. No files were staged, committed, deleted, reset, or stashed.'
    }
}

function Get-StatusPathFromLine {
    param([string]$Line)
    if ($Line.Length -lt 4) { return '' }
    $path = $Line.Substring(3).Trim()
    if ($path -match ' -> ') { $path = ($path -split ' -> ')[-1].Trim() }
    return $path.Trim('"') -replace '\\','/'
}

function Assert-OnlyCheckpointPathsChanged {
    param([string]$WorkingDirectory, [string]$CycleId)
    $allowedExact = @('VERSION.json', 'STATUS.md', 'WORKLOG.md')
    $allowedPrefix = "test-artifacts/$CycleId/"
    $unexpected = @()
    foreach ($line in @(Get-GitStatusLines -WorkingDirectory $WorkingDirectory)) {
        $path = Get-StatusPathFromLine -Line $line
        $isAllowed = ($allowedExact -contains $path) -or $path.StartsWith($allowedPrefix, [StringComparison]::OrdinalIgnoreCase)
        if (-not $isAllowed) { $unexpected += $line }
    }
    if ($unexpected.Count -gt 0) {
        Write-Host 'Checkpoint refused: unexpected files changed after cycle metadata creation.'
        $unexpected | ForEach-Object { Write-Host "  $_" }
        throw 'Checkpoint staging is limited to VERSION.json, STATUS.md, WORKLOG.md, and this cycle artifact directory.'
    }
}

function New-GitCheckpoint {
    param([string]$WorkingDirectory, [string]$CycleId)
    Assert-OnlyCheckpointPathsChanged -WorkingDirectory $WorkingDirectory -CycleId $CycleId
    $pathspecs = @('VERSION.json', 'STATUS.md', 'WORKLOG.md', "test-artifacts/$CycleId")
    $statusBefore = @(& git -C $WorkingDirectory status --short -- @pathspecs)
    Write-Host 'Checkpoint candidate files:'
    if ($statusBefore.Count -eq 0) { Write-Host '  none' } else { $statusBefore | ForEach-Object { Write-Host "  $_" } }
    & git -C $WorkingDirectory add -- @pathspecs
    if ($LASTEXITCODE -ne 0) { throw 'Git staging failed for documented checkpoint pathspecs.' }
    $staged = @(& git -C $WorkingDirectory diff --cached --name-status)
    Write-Host 'Checkpoint staged files:'
    if ($staged.Count -eq 0) { Write-Host '  none' } else { $staged | ForEach-Object { Write-Host "  $_" } }
    & git -C $WorkingDirectory diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        return [pscustomobject]@{ Status = 'no-changes-current-head'; Commit = (Get-ShortHead -WorkingDirectory $WorkingDirectory); StagedFiles = @() }
    }
    & git -C $WorkingDirectory commit -m "checkpoint: $CycleId pre-test" *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Git checkpoint commit failed.' }
    return [pscustomobject]@{ Status = 'created'; Commit = (Get-ShortHead -WorkingDirectory $WorkingDirectory); StagedFiles = @($staged) }
}

function Get-TestPlan {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return Get-Content -Raw -Encoding UTF8 -LiteralPath $Path | ConvertFrom-Json
}

function Convert-ToStringArray {
    param($Value)
    if ($null -eq $Value) { return @() }
    if ($Value -is [System.Array]) { return @($Value | ForEach-Object { [string]$_ }) }
    return @([string]$Value)
}

function Resolve-TestSpec {
    param($Plan, [string]$TestId, [string]$TestExecutable, [string[]]$TestArguments, [string]$DefaultLevel)
    $spec = [ordered]@{
        id = $null
        executable = $null
        arguments = @()
        level = $DefaultLevel
        appLogRequired = $false
        browserConsoleRequired = $false
        browserDiagnosticsEnabled = $false
        browserDiagnosticsTestId = $null
        browserDiagnosticsConfigPath = $null
        source = 'none'
    }
    if (-not [string]::IsNullOrWhiteSpace($TestId)) {
        if ($null -eq $Plan -or -not ($Plan.PSObject.Properties.Name -contains 'tests')) { throw "TestId '$TestId' was requested, but tests/test-plan.json has no tests list." }
        $matches = @($Plan.tests | Where-Object { $_.id -eq $TestId })
        if ($matches.Count -ne 1) { throw "TestId '$TestId' not found exactly once in tests/test-plan.json." }
        $test = $matches[0]
        $spec.id = $test.id
        $spec.executable = [string](Get-JsonPropertyValue -Object $test -Name 'executable' -Default '')
        $spec.arguments = Convert-ToStringArray (Get-JsonPropertyValue -Object $test -Name 'arguments' -Default @())
        $spec.level = [string](Get-JsonPropertyValue -Object $test -Name 'level' -Default $DefaultLevel)
        $captureRequired = Get-JsonPropertyValue -Object $test -Name 'captureRequired' -Default $null
        $spec.appLogRequired = [bool](Get-JsonPropertyValue -Object $captureRequired -Name 'appLog' -Default $false)
        $spec.browserConsoleRequired = [bool](Get-JsonPropertyValue -Object $captureRequired -Name 'browserConsole' -Default $false)
        $browserDiagnostics = Get-JsonPropertyValue -Object $test -Name 'browserDiagnostics' -Default $null
        if ($null -ne $browserDiagnostics) {
            $enabledValue = Get-JsonPropertyValue -Object $browserDiagnostics -Name 'enabled' -Default $true
            $spec.browserDiagnosticsEnabled = [bool]$enabledValue
            $spec.browserDiagnosticsTestId = [string](Get-JsonPropertyValue -Object $browserDiagnostics -Name 'testId' -Default $test.id)
            $spec.browserDiagnosticsConfigPath = [string](Get-JsonPropertyValue -Object $browserDiagnostics -Name 'configPath' -Default 'tests/test-plan.json')
        }
        $spec.source = 'test-plan'
        return [pscustomobject]$spec
    }
    if (-not [string]::IsNullOrWhiteSpace($TestExecutable)) {
        $allowed = @()
        if ($null -ne $Plan -and $Plan.PSObject.Properties.Name -contains 'allowedExecutables') {
            $allowed = Convert-ToStringArray $Plan.allowedExecutables
        }
        if ($allowed.Count -gt 0 -and -not ($allowed -contains $TestExecutable)) {
            throw "Ad-hoc executable '$TestExecutable' is not listed in tests/test-plan.json allowedExecutables. Use -TestId or add it explicitly."
        }
        $spec.executable = $TestExecutable
        $spec.arguments = @($TestArguments)
        $spec.source = 'ad-hoc-executable'
    }
    return [pscustomobject]$spec
}

function Invoke-CycleTest {
    param([Parameter(Mandatory = $true)][string]$Executable, [string[]]$Arguments = @(), [Parameter(Mandatory = $true)][string]$WorkingDirectory, [Parameter(Mandatory = $true)][string]$OutputPath)
    Push-Location $WorkingDirectory
    try {
        $global:LASTEXITCODE = 0
        & $Executable @Arguments *> $OutputPath
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
        return [int]$exitCode
    } catch {
        $_ | Out-String | Set-Content -Encoding UTF8 -LiteralPath $OutputPath
        return 1
    } finally {
        Pop-Location
    }
}

function New-BlockedDiagnosticSummary {
    param([string]$Code, [string]$Message, [string]$ArtifactDir)
    return [pscustomobject]@{
        status = 'BLOCKED'
        errorCode = $Code
        primaryError = $Message
        failedStep = $null
        browser = $null
        browserName = $null
        browserChannel = $null
        durationMs = 0
        consoleErrorCount = 0
        consoleWarningCount = 0
        pageErrorCount = 0
        networkErrorCount = 0
        appErrorCount = 0
        appLogCaptured = $false
        browserConsoleCaptured = $false
        screenshotPath = $null
        artifactDir = $ArtifactDir
    }
}

function Invoke-BrowserDiagnostics {
    param(
        [Parameter(Mandatory = $true)][string]$ProjectRoot,
        [Parameter(Mandatory = $true)][string]$BrowserTestId,
        [Parameter(Mandatory = $true)][string]$ConfigPath,
        [Parameter(Mandatory = $true)][string]$ArtifactDir,
        [Parameter(Mandatory = $true)][string]$OutputPath
    )
    $runner = Join-Path $ProjectRoot 'tools\run-browser-diagnostics.ps1'
    $summaryPath = Join-Path $ArtifactDir 'browser-diagnostics-summary.json'
    if (-not (Test-Path -LiteralPath $runner -PathType Leaf)) {
        $blocked = New-BlockedDiagnosticSummary -Code 'BROWSER_DIAGNOSTICS_MODULE_MISSING' -Message 'Test requires browser-diagnostics, but tools/run-browser-diagnostics.ps1 is not present in this project.' -ArtifactDir $ArtifactDir
        $blocked | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 -LiteralPath $summaryPath
        Write-Utf8NoBom -Path $OutputPath -Content $blocked.primaryError
        return $blocked
    }

    if (-not [IO.Path]::IsPathRooted($ConfigPath)) {
        $ConfigPath = Join-Path $ProjectRoot $ConfigPath
    }
    $ConfigPath = [IO.Path]::GetFullPath($ConfigPath)

    $global:LASTEXITCODE = 0
    try {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner -ProjectRoot $ProjectRoot -ConfigPath $ConfigPath -TestId $BrowserTestId -ArtifactDir $ArtifactDir *> $OutputPath
        $runnerExit = $LASTEXITCODE
        if ($null -eq $runnerExit) { $runnerExit = 0 }
    } catch {
        $_ | Out-String | Set-Content -Encoding UTF8 -LiteralPath $OutputPath
        $runnerExit = 2
    }

    if (-not (Test-Path -LiteralPath $summaryPath -PathType Leaf)) {
        $blocked = New-BlockedDiagnosticSummary -Code 'BROWSER_DIAGNOSTICS_NO_SUMMARY' -Message 'Browser diagnostics did not write browser-diagnostics-summary.json.' -ArtifactDir $ArtifactDir
        $blocked | Add-Member -NotePropertyName launcherExitCode -NotePropertyValue $runnerExit
        $blocked | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 -LiteralPath $summaryPath
        return $blocked
    }
    $summary = Get-Content -Raw -Encoding UTF8 -LiteralPath $summaryPath | ConvertFrom-Json
    if ($summary.PSObject.Properties.Name -notcontains 'launcherExitCode') {
        $summary | Add-Member -NotePropertyName launcherExitCode -NotePropertyValue $runnerExit
    }
    return $summary
}

if ($Checkpoint) {
    Assert-CleanGitWorktreeForCheckpoint -WorkingDirectory $projectRoot
}

if (-not (Test-Path -LiteralPath $versionPath -PathType Leaf)) {
    $initial = [ordered]@{
        stableRelease = $null
        stableFile = $null
        developmentTarget = "$TargetVersion-dev"
        currentCycle = 'C000'
        currentCycleId = $null
        lastSuccessfulCycle = $null
        branch = $null
        releaseGate = 'not-started'
        lastUpdated = $null
    }
    $initial | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath $versionPath
}
$versionState = Get-Content -Raw -Encoding UTF8 -LiteralPath $versionPath | ConvertFrom-Json
$previousSuccessfulCycle = Get-JsonPropertyValue -Object $versionState -Name 'lastSuccessfulCycle' -Default $null
if ([string]::IsNullOrWhiteSpace([string]$previousSuccessfulCycle)) {
    $previousSuccessfulCycle = Get-MarkdownFieldValue -Path $statusPath -Prefix '- Utolso sikeres ciklus:'
    if ($previousSuccessfulCycle -eq 'nincs meg') { $previousSuccessfulCycle = $null }
}

$currentCycle = 'C000'
if ($versionState.PSObject.Properties.Name -contains 'currentCycle' -and $versionState.currentCycle -match '^C(\d+)$') {
    $currentCycle = $versionState.currentCycle
}
$cycleNumber = [int]($currentCycle -replace '^C', '') + 1
$cycle = 'C{0:D3}' -f $cycleNumber
$cycleId = "$TargetVersion-$cycle"
$startedAt = (Get-Date).ToString('s')
$artifactDir = Join-Path $artifactRoot $cycleId
New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null

$testPlan = Get-TestPlan -Path $testPlanPath
$testSpec = Resolve-TestSpec -Plan $testPlan -TestId $TestId -TestExecutable $TestExecutable -TestArguments $TestArguments -DefaultLevel $TestLevel
if ($testSpec.level) { $TestLevel = $testSpec.level }
$appLogRequired = [bool]$RequireAppLog -or [bool]$testSpec.appLogRequired
$browserConsoleRequired = [bool]$RequireBrowserConsole -or [bool]$testSpec.browserConsoleRequired
$captureRequired = $appLogRequired -or $browserConsoleRequired
$appLogCaptured = $false
$browserConsoleCaptured = $false

Set-JsonProperty -Object $versionState -Name 'developmentTarget' -Value "$TargetVersion-dev"
Set-JsonProperty -Object $versionState -Name 'currentCycle' -Value $cycle
Set-JsonProperty -Object $versionState -Name 'currentCycleId' -Value $cycleId
Set-JsonProperty -Object $versionState -Name 'currentCyclePurpose' -Value $Purpose
Set-JsonProperty -Object $versionState -Name 'currentCycleStartedAt' -Value $startedAt
Set-JsonProperty -Object $versionState -Name 'currentTestLevel' -Value $TestLevel
Set-JsonProperty -Object $versionState -Name 'releaseGate' -Value 'dev-cycle'
Set-JsonProperty -Object $versionState -Name 'lastUpdated' -Value $startedAt

$branch = $null
$gitMetadataPath = Join-Path $projectRoot '.git'
if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath $gitMetadataPath)) {
    try {
        $branchProbe = (& git -C $projectRoot branch --show-current 2>$null) -join ''
        if ($LASTEXITCODE -eq 0) { $branch = $branchProbe.Trim() }
    } catch { $branch = $null }
}
Set-JsonProperty -Object $versionState -Name 'branch' -Value $branch
$versionState | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $versionPath

$summaryPath = Join-Path $artifactDir 'test-summary.json'
$testOutputPath = Join-Path $artifactDir 'test-output.log'
$appLogPath = Join-Path $artifactDir 'app-log.json'
$consolePath = Join-Path $artifactDir 'browser-console.log'

$appLogPlaceholder = [ordered]@{
    status = 'NOT_CAPTURED'
    captured = $false
    reason = 'Base repair-cycle does not capture application logs. Enable the optional browser-diagnostics module for real capture.'
}
$appLogPlaceholder | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 -LiteralPath $appLogPath
Write-Utf8NoBom -Path $consolePath -Content 'NOT_CAPTURED: Base repair-cycle does not capture browser console output. Enable the optional browser-diagnostics module for real capture.'
Write-Utf8NoBom -Path $testOutputPath -Content 'No test executable selected yet.'

Set-MarkdownField -Path $statusPath -Prefix '- Aktualis fejlesztesi celverzio:' -Value "$TargetVersion-dev"
Set-MarkdownField -Path $statusPath -Prefix '- Aktualis javitasi ciklus:' -Value $cycleId
Set-MarkdownField -Path $statusPath -Prefix '- Kovetkezo kotelezo teszt:' -Value $TestLevel
Set-MarkdownField -Path $statusPath -Prefix '- Utolso ellenorzesi szint:' -Value 'PENDING'
Set-MarkdownField -Path $statusPath -Prefix '- Utolso frissites:' -Value $startedAt

$checkpointStatus = 'not-requested'
$checkpointCommit = $null
$checkpointStagedFiles = @()
if ($Checkpoint) {
    $checkpointResult = New-GitCheckpoint -WorkingDirectory $projectRoot -CycleId $cycleId
    $checkpointStatus = $checkpointResult.Status
    $checkpointCommit = $checkpointResult.Commit
    $checkpointStagedFiles = @($checkpointResult.StagedFiles)
}

$testStatus = 'PENDING'
$statusReason = 'No test executable selected. Manual evidence is required before treating this cycle as verified.'
$exitCode = $null
$browserDiagnosticsSummary = $null

if ($testSpec.browserDiagnosticsEnabled) {
    $browserDiagnosticsSummary = Invoke-BrowserDiagnostics -ProjectRoot $projectRoot -BrowserTestId $testSpec.browserDiagnosticsTestId -ConfigPath $testSpec.browserDiagnosticsConfigPath -ArtifactDir $artifactDir -OutputPath $testOutputPath
    $testStatus = [string](Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'status' -Default 'BLOCKED')
    if (@('PASS', 'FAIL', 'BLOCKED') -notcontains $testStatus) { $testStatus = 'BLOCKED' }
    $primaryError = [string](Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'primaryError' -Default '')
    $errorCode = [string](Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'errorCode' -Default '')
    if ($testStatus -eq 'PASS') {
        $statusReason = 'Browser diagnostics completed successfully.'
    } elseif (-not [string]::IsNullOrWhiteSpace($primaryError)) {
        $statusReason = "Browser diagnostics ${testStatus}: $primaryError"
    } elseif (-not [string]::IsNullOrWhiteSpace($errorCode)) {
        $statusReason = "Browser diagnostics ${testStatus}: $errorCode"
    } else {
        $statusReason = "Browser diagnostics completed with status $testStatus."
    }
    $exitCode = Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'launcherExitCode' -Default $null
    $appLogCaptured = [bool](Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'appLogCaptured' -Default $false)
    $browserConsoleCaptured = [bool](Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'browserConsoleCaptured' -Default $false)
} elseif (-not [string]::IsNullOrWhiteSpace($testSpec.executable)) {
    $exitCode = Invoke-CycleTest -Executable $testSpec.executable -Arguments $testSpec.arguments -WorkingDirectory $projectRoot -OutputPath $testOutputPath
    if ($exitCode -eq 0) {
        $testStatus = 'PASS'
        $statusReason = 'Selected test command exited with code 0.'
    } else {
        $testStatus = 'FAIL'
        $statusReason = "Selected test command exited with code $exitCode."
    }
}

$missingCaptures = @()
if ($appLogRequired -and -not $appLogCaptured) { $missingCaptures += 'appLog' }
if ($browserConsoleRequired -and -not $browserConsoleCaptured) { $missingCaptures += 'browserConsole' }
if ($missingCaptures.Count -gt 0 -and $testStatus -eq 'PASS') {
    $testStatus = 'BLOCKED'
    $statusReason = 'Required diagnostics were not captured: ' + ($missingCaptures -join ', ')
} elseif ($missingCaptures.Count -gt 0 -and $testStatus -eq 'PENDING') {
    $testStatus = 'BLOCKED'
    $statusReason = 'Required diagnostics were requested but no capture implementation was run: ' + ($missingCaptures -join ', ')
} elseif ($missingCaptures.Count -gt 0 -and $testStatus -eq 'FAIL') {
    $statusReason = $statusReason + ' Required diagnostics were also not captured: ' + ($missingCaptures -join ', ')
}

if ($testStatus -eq 'PASS') {
    Set-JsonProperty -Object $versionState -Name 'lastSuccessfulCycle' -Value $cycleId
} else {
    Set-JsonProperty -Object $versionState -Name 'lastSuccessfulCycle' -Value $previousSuccessfulCycle
}
Set-JsonProperty -Object $versionState -Name 'currentCycleStatus' -Value $testStatus
Set-JsonProperty -Object $versionState -Name 'currentCycleStatusReason' -Value $statusReason
Set-JsonProperty -Object $versionState -Name 'lastUpdated' -Value (Get-Date).ToString('s')
$versionState | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $versionPath

$summary = [ordered]@{
    projectVersion = "$TargetVersion-dev"
    cycle = $cycle
    cycleId = $cycleId
    status = $testStatus
    statusReason = $statusReason
    purpose = $Purpose
    testLevel = $TestLevel
    testId = $testSpec.id
    testSource = $testSpec.source
    testExecutable = $testSpec.executable
    testArguments = $testSpec.arguments
    testExitCode = $exitCode
    checkpoint = $checkpointStatus
    checkpointCommit = $checkpointCommit
    checkpointStagedFiles = $checkpointStagedFiles
    branch = $branch
    startedAt = $startedAt
    artifactDir = $artifactDir
    appLog = 'app-log.json'
    appLogCaptured = $appLogCaptured
    browserConsole = 'browser-console.log'
    browserConsoleCaptured = $browserConsoleCaptured
    captureRequired = $captureRequired
    appLogRequired = $appLogRequired
    browserConsoleRequired = $browserConsoleRequired
    missingCaptures = $missingCaptures
    testOutput = 'test-output.log'
    browserDiagnostics = [ordered]@{
        enabled = [bool]$testSpec.browserDiagnosticsEnabled
        testId = $testSpec.browserDiagnosticsTestId
        configPath = $testSpec.browserDiagnosticsConfigPath
        status = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'status' -Default $null } else { $null }
        browser = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'browser' -Default $null } else { $null }
        durationMs = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'durationMs' -Default $null } else { $null }
        consoleErrorCount = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'consoleErrorCount' -Default $null } else { $null }
        pageErrorCount = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'pageErrorCount' -Default $null } else { $null }
        networkErrorCount = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'networkErrorCount' -Default $null } else { $null }
        appErrorCount = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'appErrorCount' -Default $null } else { $null }
        screenshotPath = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'screenshotPath' -Default $null } else { $null }
        diagnosticExcerpt = if ($null -ne $browserDiagnosticsSummary -and $browserDiagnosticsSummary.PSObject.Properties.Name -contains 'artifacts') { Get-JsonPropertyValue -Object $browserDiagnosticsSummary.artifacts -Name 'diagnosticExcerpt' -Default $null } else { $null }
        primaryError = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'primaryError' -Default $null } else { $null }
        errorCode = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'errorCode' -Default $null } else { $null }
        failedStep = if ($null -ne $browserDiagnosticsSummary) { Get-JsonPropertyValue -Object $browserDiagnosticsSummary -Name 'failedStep' -Default $null } else { $null }
        summary = if ($null -ne $browserDiagnosticsSummary) { 'browser-diagnostics-summary.json' } else { $null }
    }
}
$summary | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -LiteralPath $summaryPath

Set-MarkdownField -Path $statusPath -Prefix '- Utolso ellenorzesi szint:' -Value $testStatus
Set-MarkdownField -Path $statusPath -Prefix '- Utolso frissites:' -Value (Get-Date).ToString('s')
if ($testStatus -eq 'PASS') {
    Set-MarkdownField -Path $statusPath -Prefix '- Utolso sikeres ciklus:' -Value $cycleId
} elseif (-not [string]::IsNullOrWhiteSpace([string]$previousSuccessfulCycle)) {
    Set-MarkdownField -Path $statusPath -Prefix '- Utolso sikeres ciklus:' -Value ([string]$previousSuccessfulCycle)
}

if (Test-Path -LiteralPath $worklogPath -PathType Leaf) {
    $entryLines = @(
        '',
        "### $(Get-Date -Format s) - $cycleId",
        '',
        "- Cel: $Purpose",
        "- Tesztszint: $TestLevel",
        "- Eredmeny: $testStatus",
        "- Indok: $statusReason",
        "- Checkpoint: $checkpointStatus $checkpointCommit",
        ('- Artifact: `test-artifacts/{0}/test-summary.json`' -f $cycleId)
    )
    if ($null -ne $browserDiagnosticsSummary) {
        $entryLines += ('- Browser diagnostics: `test-artifacts/{0}/browser-diagnostics-summary.json`' -f $cycleId)
    }
    $entry = $entryLines -join [Environment]::NewLine
    Add-Content -Encoding UTF8 -LiteralPath $worklogPath -Value $entry
}

Write-Host "Cycle created: $cycleId"
Write-Host "Status: $testStatus"
Write-Host "Reason: $statusReason"
Write-Host "Artifacts: $artifactDir"
Write-Host "Summary: $summaryPath"
if ($Checkpoint) { Write-Host "Checkpoint: $checkpointStatus $checkpointCommit" }