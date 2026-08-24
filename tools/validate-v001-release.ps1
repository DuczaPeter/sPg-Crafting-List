$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseRoot = Join-Path $projectRoot 'releases\V001'
$sourceHtmlPath = Join-Path $projectRoot 'sPg Crafting List.html'
$sourceCssPath = Join-Path $projectRoot 'Info\style.css'
$releaseHtmlPath = Join-Path $releaseRoot 'sPg Crafting List.html'
$releaseCssPath = Join-Path $releaseRoot 'Info\style.css'

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'tools\validate-c04.ps1')
if ($LASTEXITCODE -ne 0) { throw 'A teljes M1-M6.1 + C04 regresszio sikertelen.' }

foreach ($path in @($releaseHtmlPath, $releaseCssPath, (Join-Path $releaseRoot 'SHA256SUMS.txt'), (Join-Path $releaseRoot 'RELEASE.md'))) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Hianyzo release-fajl: $path" }
}

$sourceHtml = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceHtmlPath
$releaseHtml = Get-Content -Raw -Encoding UTF8 -LiteralPath $releaseHtmlPath
$expectedReleaseHtml = $sourceHtml.Replace('V001-dev', 'V001')
if ($expectedReleaseHtml -cne $releaseHtml) { throw 'A stabil HTML nem a kanonikus forras kizarolag verziofeliratban modositott masolata.' }
if ($releaseHtml -match 'V001-dev') { throw 'A stabil HTML dev verziojelolest tartalmaz.' }
if (([regex]::Matches($sourceHtml, 'V001-dev')).Count -ne 3) { throw 'A forras verziojeloloinek szama megvaltozott.' }

$sourceCss = Get-Content -Raw -Encoding UTF8 -LiteralPath $sourceCssPath
$releaseCss = Get-Content -Raw -Encoding UTF8 -LiteralPath $releaseCssPath
if ($sourceCss -cne $releaseCss) { throw 'A stabil CSS nem byte-azonos a kiadott kozponti CSS-sel.' }

& node (Join-Path $projectRoot 'tools\sync-export-css-snapshot.mjs') --check
if ($LASTEXITCODE -ne 0) { throw 'Az export CSS snapshot drift-ellenorzese sikertelen.' }

$expectedHashes = @{
    'sPg Crafting List.html' = 'c422c4dabb3f60378de4a28c441ee8a79c9e180b8bf5853d46ab02a64a6ec259'
    'Info\style.css' = '463be3931f20cfa00649f8499dcdf4f8f6bd4e4195d5ac24bec0d0e4298e24bb'
}
foreach ($relativePath in $expectedHashes.Keys) {
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $releaseRoot $relativePath)).Hash.ToLowerInvariant()
    if ($actual -ne $expectedHashes[$relativePath]) { throw "Release SHA-256 elteres: $relativePath" }
}

Write-Output 'V001_RELEASE_VALIDATION_PASS'
Write-Output 'Automated regression: PASS'
Write-Output 'Stable HTML transform: PASS'
Write-Output 'Stable CSS exact copy: PASS'
Write-Output 'Release SHA-256: PASS'
