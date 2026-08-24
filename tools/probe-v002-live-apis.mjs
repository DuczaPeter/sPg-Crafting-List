import assert from "node:assert/strict";

const scVersion = "4.9.0-LIVE.12232306";
const wikiEndpoint = `https://api.star-citizen.wiki/api/blueprints/js-300?version=${encodeURIComponent(scVersion)}`;
const uexEndpoint = "https://api.uexcorp.uk/2.0/refineries_yields";

const [wikiResponse, uexResponse] = await Promise.all([
  fetch(wikiEndpoint, { headers: { Accept: "application/json" }, cache: "no-store" }),
  fetch(uexEndpoint, { headers: { Accept: "application/json" }, cache: "no-store", credentials: "omit" })
]);

assert.equal(wikiResponse.ok, true, `Wiki API HTTP ${wikiResponse.status}`);
assert.equal(uexResponse.ok, true, `UEX API HTTP ${uexResponse.status}`);

const [wikiPayload, uexPayload] = await Promise.all([wikiResponse.json(), uexResponse.json()]);
assert.ok(wikiPayload?.data?.uuid, "A Wiki JS-300 valaszbol hianyzik a data.uuid.");
assert.ok(Array.isArray(wikiPayload.data.ingredients), "A Wiki JS-300 valaszbol hianyzik az ingredients[].");
assert.equal(wikiPayload.data.ingredients.length, 3, "A Wiki JS-300 ingredient/recipe slotok szama nem 3.");

assert.ok(Array.isArray(uexPayload?.data), "A UEX valaszbol hianyzik a data[].");
assert.ok(uexPayload.data.length > 0, "A UEX valasz ures.");
for (const field of ["id_commodity", "id_star_system", "id_terminal", "commodity_name", "value_month"]) {
  assert.ok(Object.hasOwn(uexPayload.data[0], field), `A UEX rekordbol hianyzik: ${field}`);
}

console.log("V002_LIVE_APIS_PASS");
console.log(JSON.stringify({
  wiki: {
    endpoint: wikiEndpoint,
    status: wikiResponse.status,
    blueprint: wikiPayload.data.output_name,
    uuid: wikiPayload.data.uuid,
    recipeSlots: wikiPayload.data.ingredients.length,
    scVersion
  },
  uex: {
    endpoint: uexEndpoint,
    status: uexResponse.status,
    authorizationHeaderSent: false,
    records: uexPayload.data.length
  }
}, null, 2));
