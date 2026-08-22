[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $projectRoot 'sPg Crafting List.html'
$cssPath = Join-Path $projectRoot 'Info\style.css'
$specPath = Join-Path $projectRoot 'docs\PROJECT_SPECIFICATION.md'
$decisionsPath = Join-Path $projectRoot 'docs\IMPLEMENTATION_DECISIONS.md'

$requiredPaths = @(
    $htmlPath,
    $cssPath,
    $specPath,
    $decisionsPath
)

$missingPaths = @($requiredPaths | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missingPaths.Count -gt 0) {
    throw "Hianyzo baseline fajlok: $($missingPaths -join ', ')"
}

$html = Get-Content -LiteralPath $htmlPath -Raw
$scriptStart = $html.IndexOf('<script>')
$scriptEnd = $html.LastIndexOf('</script>')

if ($scriptStart -lt 0 -or $scriptEnd -le $scriptStart) {
    throw 'A fo HTML inline JavaScript blokkja nem talalhato.'
}

$documentMarkup = $html.Substring(0, $scriptStart)
if ($documentMarkup -notmatch '<link rel="stylesheet" href="Info/style\.css"') {
    throw 'A fo HTML nem az Info/style.css kozponti stilusfajlt hasznalja.'
}

if ($documentMarkup -match '<style(?:\s|>)') {
    throw 'A fo HTML dokumentumreszeben inline CSS talalhato.'
}

$requiredSymbols = @(
    'class SCWikiAdapter',
    'class AppDatabase',
    'class DiagnosticLogger',
    'function normalizeBlueprint',
    'function buildStandaloneExport',
    'function runTechnicalProbe',
    'window.onerror',
    'unhandledrejection'
)

foreach ($symbol in $requiredSymbols) {
    if ($html -notmatch [regex]::Escape($symbol)) {
        throw "Hianyzo baseline kodjel: $symbol"
    }
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw 'A fejlesztesi JavaScript-szintaxisellenorzeshez Node.js szukseges.'
}

$tempJsPath = Join-Path ([System.IO.Path]::GetTempPath()) ("spg-crafting-list-{0}.js" -f ([guid]::NewGuid().ToString('N')))
try {
    $inlineScript = $html.Substring($scriptStart + '<script>'.Length, $scriptEnd - ($scriptStart + '<script>'.Length))
    [System.IO.File]::WriteAllText($tempJsPath, $inlineScript, (New-Object System.Text.UTF8Encoding($false)))
    $nodeOutput = & $node.Source --check $tempJsPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "JavaScript szintaktikai hiba: $($nodeOutput -join [Environment]::NewLine)"
    }
} finally {
    if (Test-Path -LiteralPath $tempJsPath) {
        Remove-Item -LiteralPath $tempJsPath -Force
    }
}

$css = Get-Content -LiteralPath $cssPath -Raw
foreach ($cssSelector in @('.spg-app-shell', '.spg-badge-dynamic', '.spg-export-page')) {
    if ($css -notmatch [regex]::Escape($cssSelector)) {
        throw "Hianyzo CSS baseline selector: $cssSelector"
    }
}

Write-Output 'Baseline file structure OK'
Write-Output 'JavaScript syntax OK'
Write-Output 'Central CSS markers OK'
Write-Output 'BASELINE_STATIC_PASS'
