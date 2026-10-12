import zlib from "node:zlib";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();
const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const t = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([length, t, data, crc]);
};
const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export const decodeRgbaPng = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8 || !buffer.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error("Invalid PNG signature");
  }
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  let interlace;
  const idat = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset); offset += 4;
    const type = buffer.subarray(offset, offset + 4).toString("ascii"); offset += 4;
    const data = buffer.subarray(offset, offset + length); offset += length;
    offset += 4; // CRC is preserved by source images; decoding does not mutate evidence.
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
  }
  if (!width || !height || bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error("Native visual-review PNG codec supports non-interlaced 8-bit RGBA PNG only");
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * bpp);
  let cursor = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[cursor++];
    for (let x = 0; x < stride; x += 1) {
      const value = raw[cursor++];
      const index = y * stride + x;
      const left = x >= bpp ? out[index - bpp] : 0;
      const up = y > 0 ? out[index - stride] : 0;
      const upLeft = y > 0 && x >= bpp ? out[index - stride - bpp] : 0;
      if (filter === 0) out[index] = value;
      else if (filter === 1) out[index] = (value + left) & 255;
      else if (filter === 2) out[index] = (value + up) & 255;
      else if (filter === 3) out[index] = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) out[index] = (value + paeth(left, up, upLeft)) & 255;
      else throw new Error(`Unsupported PNG filter ${filter}`);
    }
  }
  return { width, height, data: out };
};

export const encodeRgbaPng = ({ width, height, data }) => {
  if (!Number.isInteger(width) || !Number.isInteger(height) || !Buffer.isBuffer(data) || data.length !== width * height * 4) {
    throw new Error("Invalid RGBA image");
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const base = y * (stride + 1);
    raw[base] = 0;
    data.copy(raw, base + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};

export const cropRgba = (source, sx, sy, width, height) => {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = ((sy + y) * source.width + (sx + x)) * 4;
      const targetIndex = (y * width + x) * 4;
      source.data.copy(data, targetIndex, sourceIndex, sourceIndex + 4);
    }
  }
  return { width, height, data };
};
