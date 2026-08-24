import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const toolsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(toolsDirectory);
const htmlPath = path.join(projectDirectory, "sPg Crafting List.html");
const imagePath = path.join(projectDirectory, "Info", "Radar Signature.png");
const artifactPath = path.join(projectDirectory, "test-artifacts", "V003-C007", "material-color-audit.json");

const html = fs.readFileSync(htmlPath, "utf8");
const image = fs.readFileSync(imagePath);
const modelMatch = html.match(/\/\* MATERIAL_COLOR_MODEL_START \*\/([\s\S]*?)\/\* MATERIAL_COLOR_MODEL_END \*\//);
assert.ok(modelMatch, "A MATERIAL_COLOR_MODEL blokk hiányzik.");
const context = vm.createContext({ console });
vm.runInContext(`${modelMatch[1]}
globalThis.__COLOR__ = {
  registryVersion: MATERIAL_COLOR_REGISTRY_VERSION,
  sourceVersion: MATERIAL_COLOR_SOURCE_VERSION,
  sourceImage: MATERIAL_COLOR_SOURCE_IMAGE,
  sourceSha256: MATERIAL_COLOR_SOURCE_SHA256,
  registry: MATERIAL_COLOR_REGISTRY,
  resolve: resolveMaterialColor
};`, context, { filename: "spg-v003-c007-color-model.js" });
const colorModel = context.__COLOR__;

function decodeRgbaPng(buffer) {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "Érvénytelen PNG signature.");
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
  }
  assert.equal(bitDepth, 8, "Az audit csak 8 bites canonical PNG-t támogat.");
  assert.equal(colorType, 6, "Az audit csak RGBA canonical PNG-t támogat.");
  assert.equal(interlace, 0, "Az audit csak nem interlaced canonical PNG-t támogat.");
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const filtered = zlib.inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(width * height * bytesPerPixel);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[inputOffset];
    inputOffset += 1;
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[inputOffset + x];
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[rowOffset - stride + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? pixels[rowOffset - stride + x - bytesPerPixel] : 0;
      let reconstructed;
      if (filter === 0) reconstructed = raw;
      else if (filter === 1) reconstructed = (raw + left) & 255;
      else if (filter === 2) reconstructed = (raw + up) & 255;
      else if (filter === 3) reconstructed = (raw + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const predictor = left + up - upLeft;
        const leftDistance = Math.abs(predictor - left);
        const upDistance = Math.abs(predictor - up);
        const upLeftDistance = Math.abs(predictor - upLeft);
        const paeth = leftDistance <= upDistance && leftDistance <= upLeftDistance ? left : (upDistance <= upLeftDistance ? up : upLeft);
        reconstructed = (raw + paeth) & 255;
      } else {
        assert.fail(`Ismeretlen PNG filter: ${filter}`);
      }
      pixels[rowOffset + x] = reconstructed;
    }
    inputOffset += stride;
  }
  return { width, height, pixels, bytesPerPixel };
}

const decoded = decodeRgbaPng(image);
const actualSha256 = crypto.createHash("sha256").update(image).digest("hex");
assert.equal(actualSha256, colorModel.sourceSha256, "A canonical Radar Signature kép SHA-256 értéke eltér.");
assert.deepEqual([decoded.width, decoded.height], [1182, 879], "A canonical kép mérete eltér.");
assert.equal(colorModel.registry.length, 33, "A VERIFIED_COLOR registry rekordszáma eltér.");
assert.equal(new Set(colorModel.registry.map((record) => record.uuid)).size, colorModel.registry.length, "Duplikált Wiki UUID a color registryben.");

const sampledRecords = colorModel.registry.map((record) => {
  const { sampleX, sampleY } = record.sourceCoordinates;
  const offset = (sampleY * decoded.width + sampleX) * decoded.bytesPerPixel;
  const sampled = `#${decoded.pixels.subarray(offset, offset + 3).toString("hex")}`;
  assert.equal(sampled, record.foreground, `${record.canonicalName} mintapixelének színe eltér.`);
  assert.equal(record.border, record.foreground, `${record.canonicalName} border/accent eltér a bizonyított source hue-tól.`);
  assert.equal(record.status, "VERIFIED_COLOR");
  return {
    canonicalName: record.canonicalName,
    wikiUuid: record.uuid,
    foreground: record.foreground,
    background: record.background,
    border: record.border,
    sourceRow: record.sourceRow,
    sourceCoordinates: record.sourceCoordinates,
    evidence: record.evidence,
    status: record.status
  };
});

const report = {
  cycle: "V003-C007",
  registryVersion: colorModel.registryVersion,
  sourceVersion: colorModel.sourceVersion,
  sourceImage: colorModel.sourceImage,
  sourceImageSha256: actualSha256,
  sourceImageDimensions: { width: decoded.width, height: decoded.height },
  verifiedColorRecords: sampledRecords.length,
  sourcePixelChecksPassed: sampledRecords.length,
  backgroundRule: "UI_TINT_FROM_VERIFIED_ACCENT_16_PERCENT",
  records: sampledRecords
};
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, `${JSON.stringify(report, null, 2)}\n`);
console.log("V003_C007_COLOR_IMAGE_AUDIT_PASS");
console.log(JSON.stringify({
  registryVersion: report.registryVersion,
  verifiedColorRecords: report.verifiedColorRecords,
  sourcePixelChecksPassed: report.sourcePixelChecksPassed,
  sourceImageSha256: report.sourceImageSha256,
  artifact: path.relative(projectDirectory, artifactPath).replaceAll("\\", "/")
}, null, 2));
