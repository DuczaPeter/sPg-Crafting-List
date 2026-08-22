const base = "https://api.star-citizen.wiki/api";
const version = process.argv[2] || "4.9.0-LIVE.12232306";

async function get(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${base}${path}${separator}version=${encodeURIComponent(version)}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function miningFilterValues(payload) {
  return Object.fromEntries(Object.entries(payload.filters || {}).map(([key, values]) => [
    key,
    (Array.isArray(values) ? values : []).filter(value => JSON.stringify(value).toLowerCase().includes("mining")).slice(0, 30)
  ]).filter(([, values]) => values.length));
}

function visitPorts(ports, path = "ports", results = []) {
  (Array.isArray(ports) ? ports : []).forEach((port, index) => {
    const currentPath = `${path}.${index}`;
    const item = port?.equipped_item;
    if (item?.classification === "Ship.Mining.Gun" || item?.type === "WeaponMining") {
      results.push({ path: currentPath, port: port.name, uuid: item.uuid, name: item.name, classification: item.classification });
    }
    visitPorts(port?.ports, `${currentPath}.ports`, results);
  });
  return results;
}

const [commodityFilters, itemFilters, vehicleFilters, agriciumPayload, revenantPayload, mineableIndex, harvestableIndex] = await Promise.all([
  get("/commodities/filters"),
  get("/items/filters"),
  get("/vehicles/filters"),
  get("/commodities/agricium-ore"),
  get("/commodities/revenant-pod"),
  get("/commodities?filter%5Bkind%5D=mineable&page%5Bsize%5D=200"),
  get("/commodities?filter%5Bkind%5D=harvestable&page%5Bsize%5D=200")
]);

const query = parameters => Object.entries(parameters).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
const headIndex = await get(`/items?${query({ "filter[classification]": "Ship.Mining.Gun", "page[size]": 20 })}`);
const moduleIndex = await get(`/items?${query({ "filter[classification]": "Mining.Module", "page[size]": 50 })}`);
const gadgetIndex = await get(`/items?${query({ "filter[classification]": "Mining.Gadget", "page[size]": 20 })}`);
const miningRoles = (vehicleFilters.filters?.role || []).filter(entry => /mining/i.test(entry.value || ""));
const vehiclePages = await Promise.all(miningRoles.map(role => get(`/vehicles?${query({ "filter[role]": role.value, "page[size]": 200 })}`)));
const vehicleMap = new Map();
vehiclePages.flatMap(page => page.data || []).forEach(vehicle => vehicleMap.set(vehicle.uuid, vehicle));
const vehicles = Array.from(vehicleMap.values());
const targetVehicles = vehicles.filter(vehicle => /mole|prospector|golem|roc/i.test(vehicle.name));
const vehicleDetails = await Promise.all(targetVehicles.map(vehicle => get(`/vehicles/${vehicle.uuid}?include=ports,components`).then(payload => payload.data)));
const headDetails = await Promise.all((headIndex.data || []).map(item => get(`/items/${item.uuid}`).then(payload => payload.data)));

const agricium = agriciumPayload.data;
const revenant = revenantPayload.data;
const firstLocation = agricium.locations?.[0] || null;
const allCommodities = [...(mineableIndex.data || []), ...(harvestableIndex.data || [])];
const categorySamples = {
  ship: allCommodities.find(item => item.has_ship_mineables),
  vehicle: allCommodities.find(item => item.has_ground_vehicle_mineables),
  fps: allCommodities.find(item => item.has_fps_mineables),
  harvestable: allCommodities.find(item => item.has_harvestables)
};

console.log(JSON.stringify({
  version,
  commodityFilterKeys: Object.keys(commodityFilters.filters || {}),
  itemFilterKeys: Object.keys(itemFilters.filters || {}),
  itemMiningFilters: miningFilterValues(itemFilters),
  vehicleFilterKeys: Object.keys(vehicleFilters.filters || {}),
  vehicleMiningFilters: miningFilterValues(vehicleFilters),
  agricium: {
    keys: Object.keys(agricium),
    name: agricium.name,
    kind: agricium.kind,
    signature: agricium.signature,
    methods: agricium.methods,
    methodFlags: {
      ship: agricium.has_ship_mineables,
      vehicle: agricium.has_ground_vehicle_mineables,
      fps: agricium.has_fps_mineables,
      harvestable: agricium.has_harvestables
    },
    systems: agricium.systems,
    locationKeys: agricium.locations && Object.keys(agricium.locations),
    firstLocation: firstLocation && {
      keys: Object.keys(firstLocation),
      name: firstLocation.name,
      system: firstLocation.system,
      group_probability_percent: firstLocation.group_probability_percent,
      relative_probability_percent: firstLocation.relative_probability_percent,
      quality_min: firstLocation.quality_min,
      quality_max: firstLocation.quality_max,
      resources: firstLocation.resources?.length
    }
  },
  revenant: {
    keys: Object.keys(revenant),
    name: revenant.name,
    kind: revenant.kind,
    signature: revenant.signature,
    methods: revenant.methods,
    methodFlags: {
      ship: revenant.has_ship_mineables,
      vehicle: revenant.has_ground_vehicle_mineables,
      fps: revenant.has_fps_mineables,
      harvestable: revenant.has_harvestables
    },
    systems: revenant.systems,
    locationCount: revenant.locations?.length
  },
  equipment: {
    heads: headIndex.data?.map(item => ({ uuid: item.uuid, name: item.name, type: item.type, classification: item.classification, classification_label: item.classification_label })),
    modules: moduleIndex.data?.slice(0, 5).map(item => ({ uuid: item.uuid, name: item.name, type: item.type, classification: item.classification })),
    gadgets: gadgetIndex.data?.map(item => ({ uuid: item.uuid, name: item.name, type: item.type, classification: item.classification })),
    headModuleSlots: headDetails.map(item => ({ uuid: item.uuid, name: item.name, size: item.size, module_slots: item.mining_laser?.module_slots ?? null }))
  },
  vehicles: {
    roles: miningRoles,
    count: vehicles.length,
    index: vehicles.map(vehicle => ({ uuid: vehicle.uuid, name: vehicle.name, role: vehicle.role, career: vehicle.career, class_name: vehicle.class_name })),
    targetDetails: vehicleDetails.map(vehicle => ({ uuid: vehicle.uuid, name: vehicle.name, role: vehicle.role, career: vehicle.career, miningHeadPorts: visitPorts(vehicle.ports) }))
  },
  categorySamples: Object.fromEntries(Object.entries(categorySamples).map(([key, item]) => [key, item && {
    uuid: item.uuid,
    name: item.name,
    methods: item.methods,
    signature: item.signature,
    flags: {
      ship: item.has_ship_mineables,
      vehicle: item.has_ground_vehicle_mineables,
      fps: item.has_fps_mineables,
      harvestable: item.has_harvestables
    }
  }]))
}, null, 2));
