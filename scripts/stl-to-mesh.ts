/**
 * Converts an STL file into the compact `.pdm` mesh format used by the
 * product 3D viewer (see src/lib/mesh-viewer.ts).
 *
 * STL stores every triangle as three standalone vertices plus a normal, which
 * is ~50 bytes per triangle. We drop the normals (the shader derives flat ones
 * from screen-space derivatives), weld duplicate vertices and quantise the
 * positions to 16 bit over the bounding box. For a typical Padora part this
 * turns 250 KB into roughly 45 KB.
 *
 * Run with: pnpm build:mesh <input.stl> <output.pdm>
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/** Magic + layout version of the `.pdm` container. Bump on format changes. */
const MAGIC = 0x314d4450; // "PDM1" little-endian
const HEADER_BYTES = 40;
const QUANT_MAX = 65535;

type Mesh = { positions: Float32Array; indices: Uint32Array };

/** Binary STL: 80 byte header, uint32 triangle count, then 50 bytes each. */
function isBinaryStl(bytes: Uint8Array, view: DataView): boolean {
  if (bytes.length < 84) return false;
  return 84 + view.getUint32(80, true) * 50 === bytes.length;
}

function parseBinaryStl(view: DataView): Float32Array {
  const triangles = view.getUint32(80, true);
  const out = new Float32Array(triangles * 9);
  for (let t = 0; t < triangles; t++) {
    // Skip the 12 byte face normal, read the three vertices, skip 2 attribute bytes.
    const base = 84 + t * 50 + 12;
    for (let i = 0; i < 9; i++) out[t * 9 + i] = view.getFloat32(base + i * 4, true);
  }
  return out;
}

function parseAsciiStl(text: string): Float32Array {
  const coords: number[] = [];
  const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    coords.push(Number(m[1]), Number(m[2]), Number(m[3]));
  }
  if (coords.length === 0 || coords.length % 9 !== 0) {
    throw new Error(`ASCII STL has ${coords.length / 3} vertices, expected a multiple of 3`);
  }
  return new Float32Array(coords);
}

function readStl(bytes: Uint8Array): Float32Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return isBinaryStl(bytes, view) ? parseBinaryStl(view) : parseAsciiStl(new TextDecoder().decode(bytes));
}

/**
 * CAD exports are Z-up, WebGL is Y-up: (x, y, z) -> (x, z, -y).
 * Baked in here so the runtime never has to rotate anything.
 */
function toYUp(raw: Float32Array): Float32Array {
  const out = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) {
    out[i] = raw[i];
    out[i + 1] = raw[i + 2];
    out[i + 2] = -raw[i + 1];
  }
  return out;
}

function bounds(positions: Float32Array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = positions[i + a];
      if (v < min[a]) min[a] = v;
      if (v > max[a]) max[a] = v;
    }
  }
  return { min, max };
}

/**
 * Quantises first and welds on the quantised key, so two vertices that collapse
 * onto the same grid point become one and never leave a crack in the surface.
 */
function weld(positions: Float32Array): Mesh & { extent: number[]; min: number[] } {
  const { min, max } = bounds(positions);
  // A zero-width axis (flat part) would divide by zero; keep the scale at 1 there.
  const extent = [0, 1, 2].map((a) => Math.max(max[a] - min[a], 1e-6));

  const lookup = new Map<string, number>();
  const quantised: number[] = [];
  const indices = new Uint32Array(positions.length / 3);

  for (let i = 0; i < positions.length; i += 3) {
    const q = [0, 1, 2].map((a) => Math.round(((positions[i + a] - min[a]) / extent[a]) * QUANT_MAX));
    const key = `${q[0]},${q[1]},${q[2]}`;
    let index = lookup.get(key);
    if (index === undefined) {
      index = quantised.length / 3;
      lookup.set(key, index);
      quantised.push(q[0], q[1], q[2]);
    }
    indices[i / 3] = index;
  }

  return { positions: new Float32Array(quantised), indices, extent, min };
}

/** Drops triangles whose corners welded onto the same vertex (zero area). */
function dropDegenerate(indices: Uint32Array): Uint32Array {
  const kept: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i + 1], indices[i + 2]];
    if (a !== b && b !== c && a !== c) kept.push(a, b, c);
  }
  return new Uint32Array(kept);
}

function encode(mesh: ReturnType<typeof weld>, indices: Uint32Array): Uint8Array {
  const vertexCount = mesh.positions.length / 3;
  const indexBytes = vertexCount > 65536 ? 4 : 2;
  const positionBytes = vertexCount * 3 * 2;
  // Pad so the index array starts on a 4 byte boundary (typed array alignment).
  const padding = (4 - ((HEADER_BYTES + positionBytes) % 4)) % 4;
  const indexOffset = HEADER_BYTES + positionBytes + padding;
  const bytes = new Uint8Array(indexOffset + indices.length * indexBytes);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, MAGIC, true);
  view.setUint32(4, vertexCount, true);
  view.setUint32(8, indices.length, true);
  view.setUint8(12, indexBytes);
  for (let a = 0; a < 3; a++) {
    view.setFloat32(16 + a * 4, mesh.min[a], true);
    view.setFloat32(28 + a * 4, mesh.extent[a], true);
  }
  for (let i = 0; i < mesh.positions.length; i++) {
    view.setUint16(HEADER_BYTES + i * 2, mesh.positions[i], true);
  }
  for (let i = 0; i < indices.length; i++) {
    if (indexBytes === 2) view.setUint16(indexOffset + i * 2, indices[i], true);
    else view.setUint32(indexOffset + i * 4, indices[i], true);
  }
  return bytes;
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: pnpm build:mesh <input.stl> <output.pdm>");
  process.exit(1);
}

const source = new Uint8Array(readFileSync(input));
const raw = toYUp(readStl(source));
const welded = weld(raw);
const indices = dropDegenerate(welded.indices);
const encoded = encode(welded, indices);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, encoded);

const dropped = welded.indices.length / 3 - indices.length / 3;
console.log(
  [
    `✓ ${output}`,
    `  ${indices.length / 3} triangles, ${welded.positions.length / 3} vertices` +
      (dropped > 0 ? ` (${dropped} degenerate dropped)` : ""),
    `  size ${welded.extent.map((e) => e.toFixed(1)).join(" x ")} mm`,
    `  ${(source.length / 1024).toFixed(0)} KB STL -> ${(encoded.length / 1024).toFixed(0)} KB pdm`,
  ].join("\n"),
);
