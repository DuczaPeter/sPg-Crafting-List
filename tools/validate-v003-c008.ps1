#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C008'

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) {
        throw "A V003-C008 kapu csak a develop/V003 agon futhat. Aktualis: $branch"
    }

    New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

    & node '.\tools\audit-v003-c008-wiki-links.mjs' '--output=test-artifacts/V003-C008/wiki-deep-link-audit.json'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\run-v003-c008-tests.mjs' '--artifact=test-artifacts/V003-C008/standalone-js-300-detail-view.html'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-v003-c007.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\run-m6-tests.mjs' '--artifact=test-artifacts/V003-C008/standalone-js-300-m6-regression.html'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $standaloneArtifact = Join-Path $artifactDirectory 'standalone-js-300-detail-view.html'
    if (-not (Test-Path -LiteralPath $standaloneArtifact)) { throw 'A C008 standalone detail export artifact hianyzik.' }
    $standalone = Get-Content -Raw -LiteralPath $standaloneArtifact
    foreach ($marker in @('id="spg-standalone-detail"', 'id="spg-standalone-detail-back"', 'data-spg-detail-panel="true"', 'history.pushState', 'target="_blank" rel="noopener noreferrer"')) {
        if (-not $standalone.Contains($marker)) { throw "A C008 standalone exportbol hianyzik: $marker" }
    }
    if ($standalone -match '<(?:link|script|img|source)[^>]+(?:href|src)=["''][ ]*https?:') {
        throw 'A C008 standalone export kulso runtime eroforrast tartalmaz.'
    }
    if ($standalone -match 'fetch\s*\(') {
        throw 'A C008 standalone detail controller runtime API fetch-et tartalmaz.'
    }

    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) { throw "A V002 tag dereferalt commitja elter: $v002Commit" }
    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) { throw "A stabil V002 HTML SHA-256 erteke elter: $v002Sha256" }
    $v003Tags = @(& git tag --list 'V003*')
    if ($v003Tags.Count -gt 0) { throw "A fejlesztesi ciklus alatt V003 tag jelent meg: $($v003Tags -join ', ')" }

    Write-Output 'V003_C008_VALIDATION_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output 'DETAIL_CONTROLLER=c008DetailController'
    Write-Output 'DETAIL_TYPES=blueprint,material,radar,mining,refinery'
    Write-Output 'WIKI_RESOLVER=resolveWikiDeepLink'
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
