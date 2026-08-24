[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$htmlPath = Join-Path $projectRoot 'sPg Crafting List.html'
$specPath = Join-Path $projectRoot 'docs\PROJECT_SPECIFICATION.md'
$decisionsPath = Join-Path $projectRoot 'docs\IMPLEMENTATION_DECISIONS.md'
$embeddedCssVerifier = Join-Path $PSScriptRoot 'verify-embedded-application-css.mjs'

$requiredPaths = @(
    $htmlPath,
    $specPath,
    $decisionsPath,
    $embeddedCssVerifier
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
if ($documentMarkup -match '<link[^>]+rel=["'']stylesheet["'']') {
    throw 'A V002 fo HTML kulso vagy helyi stylesheet linket tartalmaz.'
}

$cssMatch = [regex]::Match($documentMarkup, '(?s)<style\s+id="spgApplicationStyles"\s+data-source="embedded">(.*?)</style>')
if (-not $cssMatch.Success -or [string]::IsNullOrWhiteSpace($cssMatch.Groups[1].Value)) {
    throw 'A V002 fo HTML beagyazott alkalmazas-CSS blokkja hianyzik vagy ures.'
}
if ($documentMarkup -match '<script[^>]+src=' -or $documentMarkup -match '<(?:img|source)[^>]+src=["''](?!data:)') {
    throw 'A V002 fo HTML helyi vagy kulso runtime mellekfajl-fuggest tartalmaz.'
}

$requiredSymbols = @(
    'class SCWikiAdapter',
    'class AppDatabase',
    'class DiagnosticLogger',
    'function normalizeBlueprint',
    'function buildStandaloneExport',
    'function readEmbeddedApplicationCss',
    'function runTechnicalProbe',
    'id="spgApplicationStyles"',
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

$embeddedCssOutput = & $node.Source $embeddedCssVerifier 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "A beagyazott alkalmazas-CSS ellenorzese sikertelen: $($embeddedCssOutput -join [Environment]::NewLine)"
}
$embeddedCssOutput | Write-Output

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

$css = $cssMatch.Groups[1].Value
foreach ($cssSelector in @('.spg-app-shell', '.spg-badge-dynamic', '.spg-export-page')) {
    if ($css -notmatch [regex]::Escape($cssSelector)) {
        throw "Hianyzo CSS baseline selector: $cssSelector"
    }
}

Write-Output 'Single-file baseline structure OK'
Write-Output 'JavaScript syntax OK'
Write-Output 'Embedded CSS markers OK'
Write-Output 'BASELINE_STATIC_PASS'
