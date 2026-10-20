const fs = require('fs');
const zlib = require('zlib');

// PNG Decoder
function decodePNG(buf) {
  let offset = 8;
  let width, height;
  let idatBuffers = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.slice(offset + 8, offset + 8 + len);
    offset += 12 + len;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatBuffers.push(data);
    }
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatBuffers));
  const raw = Buffer.alloc(width * height * 4);
  const rowBytes = width * 4;
  let inOffset = 0;
  let outOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[inOffset++];
    for (let x = 0; x < rowBytes; x++) {
      let b = inflated[inOffset++];
      let a = x >= 4 ? raw[outOffset - 4] : 0;
      let c = y > 0 ? raw[outOffset - rowBytes] : 0;
      let d = (y > 0 && x >= 4) ? raw[outOffset - rowBytes - 4] : 0;
      if (filter === 1) b = (b + a) & 0xff;
      else if (filter === 2) b = (b + c) & 0xff;
      else if (filter === 3) b = (b + Math.floor((a + c) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + c - d;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - c);
        const pc = Math.abs(p - d);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? c : d);
        b = (b + pr) & 0xff;
      }
      raw[outOffset++] = b;
    }
  }
  return { width, height, raw };
}

// CRC32 table for PNG writing
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.slice(4, 8 + len);
  buf.writeUInt32BE(crc32(typeAndData), 8 + len);
  return buf;
}

// PNG Encoder (RGBA 32-bit)
function encodePNG(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // colorType 6 = RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let inPos = 0;
  let outPos = 0;
  const rowLen = width * 4;
  for (let y = 0; y < height; y++) {
    scanlines[outPos++] = 0; // Filter: None
    rgbaBuffer.copy(scanlines, outPos, inPos, inPos + rowLen);
    outPos += rowLen;
    inPos += rowLen;
  }

  const deflated = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

module.exports = { decodePNG, encodePNG };
