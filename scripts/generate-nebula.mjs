// Genera assets/nebula.png: nebulosa pre-renderizada (react-native-svg no soporta feTurbulence).
// Uso: node scripts/generate-nebula.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 780;
const H = 1688;

function makeNoise(seed) {
  const size = 256;
  const table = new Float32Array(size * size);
  let s = seed >>> 0;
  for (let i = 0; i < table.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    table[i] = s / 4294967296;
  }
  const at = (x, y) => table[((y & 255) << 8) | (x & 255)];
  const fade = (t) => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = fade(x - xi);
    const v = fade(y - yi);
    const top = at(xi, yi) * (1 - u) + at(xi + 1, yi) * u;
    const bottom = at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u;
    return top * (1 - v) + bottom * v;
  };
  return (x, y, octaves = 5) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += value(x, y) * amp;
      norm += amp;
      x = x * 2 + 17.3;
      y = y * 2 + 9.1;
      amp *= 0.5;
    }
    return sum / norm;
  };
}

const violet = makeNoise(3);
const pink = makeNoise(17);
const warp = makeNoise(41);
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const raw = Buffer.alloc((W * 3 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0;
  for (let x = 0; x < W; x++) {
    const wx = x * 0.0028 + warp(x * 0.002, y * 0.002, 3) * 1.6;
    const wy = y * 0.0028 + warp(x * 0.002 + 5, y * 0.002 + 5, 3) * 1.6;
    const a = smooth(0.42, 0.78, violet(wx, wy));
    const b = smooth(0.5, 0.82, pink(wx * 1.2 + 3, wy * 1.2 + 7));
    // Fondo #07061A + violeta + rosa; dither suave para evitar bandas.
    const d = ((x * 7 + y * 13) % 5) - 2;
    raw[o++] = Math.min(255, 7 + a * 92 + b * 150 + d);
    raw[o++] = Math.min(255, 6 + a * 62 + b * 46 + d);
    raw[o++] = Math.min(255, 26 + a * 190 + b * 110 + d);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;

writeFileSync(
  new URL('../assets/nebula.png', import.meta.url),
  Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
