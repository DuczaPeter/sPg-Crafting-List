#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$expectedBranch = 'develop/V003'
$expectedV002Commit = 'b326aaff5838aafd5b1f13b16982c29a0e150e35'
$expectedV002Sha256 = 'de2d59b4203862167d90f8aa598ec6b043ea0556ead1afe7e067f69d659f2357'
$v002Artifact = Join-Path $projectRoot 'releases\V002\sPg Crafting List.html'
$artifactDirectory = Join-Path $projectRoot 'test-artifacts\V003-C008.1'
$standaloneRelativePath = 'test-artifacts/V003-C008.1/standalone-js-300-detail-view.html'

Push-Location $projectRoot
try {
    $branch = (& git branch --show-current).Trim()
    if ($LASTEXITCODE -ne 0 -or $branch -ne $expectedBranch) {
        throw "A V003-C008.1 kapu csak a develop/V003 agon futhat. Aktualis: $branch"
    }

    New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null

    & node '.\tools\audit-v003-c0081-public-wiki.mjs' '--output=test-artifacts/V003-C008.1/public-wiki-audit.json'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\run-v003-c008-tests.mjs' "--artifact=$standaloneRelativePath"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & node '.\tools\run-v003-c0081-tests.mjs' "--standalone=$standaloneRelativePath"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '.\tools\validate-v003-c008.ps1'
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $standalonePath = Join-Path $projectRoot ($standaloneRelativePath -replace '/', '\')
    $standalone = Get-Content -Raw -LiteralPath $standalonePath
    if ($standalone -match 'href="https://api\.star-citizen\.wiki[^"]*"[^>]*>Megnyitas a Star Citizen Wiki-ben') {
        throw 'API host jelent meg public Wiki felirattal a standalone exportban.'
    }
    if ($standalone -match 'href="https://star-citizen\.wiki/(?:Stileron|Savrilium)') {
        throw 'Nem bizonyitott materialhoz public Wiki URL generalt a standalone export.'
    }
    if ($standalone -match 'fetch\s*\(') {
        throw 'A standalone export runtime fetch-et tartalmaz.'
    }

    $v002Commit = (& git rev-parse 'V002^{commit}').Trim()
    if ($LASTEXITCODE -ne 0 -or $v002Commit -ne $expectedV002Commit) { throw "A V002 tag dereferalt commitja elter: $v002Commit" }
    $v002Sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $v002Artifact).Hash.ToLowerInvariant()
    if ($v002Sha256 -ne $expectedV002Sha256) { throw "A stabil V002 HTML SHA-256 erteke elter: $v002Sha256" }
    $v003Tags = @(& git tag --list 'V003*')
    if ($v003Tags.Count -gt 0) { throw "A fejlesztesi ciklus alatt V003 tag jelent meg: $($v003Tags -join ', ')" }

    Write-Output 'V003_C0081_VALIDATION_PASS'
    Write-Output "BRANCH=$branch"
    Write-Output 'PUBLIC_WIKI_RESOLVER=resolvePublicWikiDeepLink'
    Write-Output 'API_WIKI_RESOLVER=resolveWikiApiDeepLink'
    Write-Output 'JS300_PUBLIC_WIKI=https://star-citizen.wiki/JS-300'
    Write-Output 'BERYL_PUBLIC_WIKI=https://star-citizen.wiki/Beryl'
    Write-Output 'STILERON_PUBLIC_WIKI=NO_PROVEN_PUBLIC_WIKI_URL'
    Write-Output 'SAVRILIUM_PUBLIC_WIKI=NO_PROVEN_PUBLIC_WIKI_URL'
    Write-Output "V002_TAG_COMMIT=$v002Commit"
    Write-Output "V002_HTML_SHA256=$v002Sha256"
} finally {
    Pop-Location
}
