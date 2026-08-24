#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$expectedRadarImageSha256 = 'f9c6e362a41bbbc28acbac984300d582a00bc4b79a7e9738f136e1da89cabdc6'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'
$radarImage = Join-Path $projectRoot 'Info\Radar Signature.png'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C007'

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) {
        throw "A V003-C007 kapu csak a develop/V003 agon futhat. Aktualis: $branch"
    }

    & node '.\tools\audit-v003-c007-colors.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\run-v003-c007-tests.mjs'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-v003-c006.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
    & node '.\tools\run-m6-tests.mjs' '--artifact=test-artifacts/V003-C007/standalone-js-300-material-colors.html'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $standaloneArtifact = Join-Path $artifactDirectory 'standalone-js-300-material-colors.html'
    if (-not (Test-Path -LiteralPath $standaloneArtifact)) { throw 'A C007 standalone export artifact hianyzik.' }
    $standalone = Get-Content -Raw -LiteralPath $standaloneArtifact
    foreach ($marker in @('data-material-color-status="VERIFIED_COLOR"', '--spg-material-foreground:#ffaa33', '--spg-material-foreground:#3399ff', 'spg-material-color-radar')) {
        if (-not $standalone.Contains($marker)) { throw "A C007 standalone exportbol hianyzik: $marker" }
    }
    if ($standalone -match '<(?:link|script|img|source)[^>]+(?:href|src)=["''][ ]*https?:') {
        throw 'A C007 standalone export kulso runtime eroforrast tartalmaz.'
    }

    $radarSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $radarImage).Hash.ToLowerInvariant()
    if ($radarSha256 -ne $expectedRadarImageSha256) { throw "A canonical Radar Signature kep SHA-256 erteke elter: $radarSha256" }
    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) { throw "A V002 tag dereferalt commitja elter: $v002Commit" }
    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) { throw "A stabil V002 HTML SHA-256 erteke elter: $v002Sha256" }
    $v003Tags = @(& git tag --list 'V003*')
    if ($v003Tags.Count -gt 0) { throw "A fejlesztesi ciklus alatt V003 tag jelent meg: $($v003Tags -join ', ')" }

    Write-Output 'V003_C007_VALIDATION_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output 'MATERIAL_COLOR_REGISTRY=V003-C007-1'
    Write-Output 'VERIFIED_COLOR_RECORDS=33'
    Write-Output "RADAR_IMAGE_SHA256=$radarSha256"
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
