import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const endpoint = "https://api.uexcorp.uk/2.0/refineries_yields";
const started = performance.now();
const response = await fetch(endpoint, {
  method: "GET",
  headers: { Accept: "application/json" },
  credentials: "omit",
  cache: "no-store"
});
const payload = await response.json();
const durationMs = performance.now() - started;
assert.equal(response.ok, true, `UEX HTTP ${response.status}`);
assert.ok(Array.isArray(payload.data), "A UEX data[] hiányzik.");
assert.ok(payload.data.length > 0, "A UEX válasz üres.");
for (const field of ["id_commodity", "id_star_system", "id_terminal", "commodity_name", "star_system_name", "terminal_name", "value", "value_week", "value_month", "date_modified"]) {
  assert.ok(Object.hasOwn(payload.data[0], field), `A valós UEX rekordból hiányzik: ${field}`);
}
const systems = new Set(payload.data.map((record) => record.star_system_name));
const commodities = new Set(payload.data.map((record) => String(record.id_commodity)));
const values = payload.data.map((record) => Number(record.value_month));
console.log("M5_UEX_LIVE_FETCH_PASS");
console.log(JSON.stringify({
  endpoint,
  authorizationHeaderSent: false,
  httpStatus: response.status,
  topLevelKeys: Object.keys(payload),
  recordCount: payload.data.length,
  commodityCount: commodities.size,
  systems: Array.from(systems).sort(),
  valueMonth: { minimum: Math.min(...values), maximum: Math.max(...values), zeroCount: values.filter((value) => value === 0).length, negativeCount: values.filter((value) => value < 0).length },
  cacheControl: response.headers.get("cache-control"),
  documentedLimitReached: payload.data.length === 500,
  durationMs: Number(durationMs.toFixed(2))
}, null, 2));
