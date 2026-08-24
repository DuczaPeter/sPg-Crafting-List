import assert from "node:assert/strict";

export function extractEmbeddedApplicationCss(html) {
  const matches = Array.from(String(html).matchAll(/<style\s+id="spgApplicationStyles"\s+data-source="embedded">([\s\S]*?)<\/style>/gi));
  assert.equal(matches.length, 1, "Pontosan egy beágyazott alkalmazás-CSS blokk szükséges.");
  const css = matches[0][1];
  assert.ok(css.trim(), "A beágyazott alkalmazás-CSS üres.");
  return css;
}

export function assertSingleFileRuntimeMarkup(html) {
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i, "Külső vagy helyi stylesheet link maradt a HTML-ben.");
  assert.doesNotMatch(html, /<script[^>]+src=/i, "Külső vagy helyi script src maradt a HTML-ben.");
  assert.doesNotMatch(html, /<(?:img|source)[^>]+src=["'](?!data:)/i, "Külső vagy helyi médiafájl-függés maradt a HTML-ben.");
  assert.doesNotMatch(html, /spgApplicationCssSnapshot|SPG_APPLICATION_CSS_SNAPSHOT/i, "A régi duplikált CSS snapshot maradt a HTML-ben.");
}
