const fs = require('fs');
const { encodePNG } = require('./pngUtils.cjs');

// Generator for natural 9-slice parchment tiles
function createParchment9Slice({
  unitSize = 6,
  cornerUnits = 6,
  repeatUnitsX = 16,
  repeatUnitsY = 16,
  notchesX = [
    { start: 7, len: 2, type: 0 }, // outward tooth
    { start: 12, len: 1, type: 2 }  // inward notch
  ],
  notchesY = [
    { start: 6, len: 2, type: 2 },
    { start: 11, len: 1, type: 0 }
  ],
  flecks = [],
  outPrefix = 'parchment_card'
}) {
  const nx = cornerUnits * 2 + repeatUnitsX;
  const ny = cornerUnits * 2 + repeatUnitsY;
  const w = nx * unitSize;
  const h = ny * unitSize;

  const grid = Array.from({ length: ny }, () => new Uint8Array(nx));

  // Base fill: 3 (parchment)
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      grid[y][x] = 3;
    }
  }

  // Subtle linen/paper grain pattern
  const pat = [
    [4, 3, 5, 3, 3, 4],
    [3, 5, 3, 4, 3, 3],
    [3, 3, 4, 3, 5, 3],
    [5, 3, 3, 3, 3, 4],
    [3, 4, 3, 5, 3, 3],
    [3, 3, 5, 3, 4, 3]
  ];
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      grid[y][x] = pat[y % 6][x % 6];
    }
  }

  // Top/Bottom edge baseline Y offsets
  const topY = new Int8Array(nx);
  const botY = new Int8Array(nx);
  for (let x = 0; x < nx; x++) {
    topY[x] = 1;
    botY[x] = 1;
  }

  // Left/Right edge baseline X offsets
  const leftX = new Int8Array(ny);
  const rightX = new Int8Array(ny);
  for (let y = 0; y < ny; y++) {
    leftX[y] = 1;
    rightX[y] = 1;
  }

  // Corner torn nibbles (first 4 units and last 4 units)
  const cornerTorn = [4, 2, 2, 1, 1, 1];
  for (let i = 0; i < cornerUnits; i++) {
    topY[i] = cornerTorn[i];
    topY[nx - 1 - i] = cornerTorn[i];
    botY[i] = cornerTorn[i];
    botY[nx - 1 - i] = cornerTorn[i];

    leftX[i] = cornerTorn[i];
    leftX[ny - 1 - i] = cornerTorn[i];
    rightX[i] = cornerTorn[i];
    rightX[ny - 1 - i] = cornerTorn[i];
  }

  // Apply middle repeatable notches
  // For top edge
  notchesX.forEach(n => {
    for (let k = 0; k < n.len; k++) {
      const col = cornerUnits + n.start + k;
      if (col < nx - cornerUnits) {
        topY[col] = n.type;
      }
    }
  });

  // For bottom edge (offset slightly for variety)
  notchesX.forEach(n => {
    for (let k = 0; k < n.len; k++) {
      const col = cornerUnits + ((n.start + 8) % repeatUnitsX) + k;
      if (col < nx - cornerUnits) {
        botY[col] = n.type === 0 ? 2 : 0;
      }
    }
  });

  // For left edge
  notchesY.forEach(n => {
    for (let k = 0; k < n.len; k++) {
      const row = cornerUnits + n.start + k;
      if (row < ny - cornerUnits) {
        leftX[row] = n.type;
      }
    }
  });

  // For right edge
  notchesY.forEach(n => {
    for (let k = 0; k < n.len; k++) {
      const row = cornerUnits + ((n.start + 7) % repeatUnitsY) + k;
      if (row < ny - cornerUnits) {
        rightX[row] = n.type === 0 ? 2 : 0;
      }
    }
  });

  // Zero-out outside transparent pixels
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (y < topY[x] || y >= ny - botY[x] || x < leftX[y] || x >= nx - rightX[y]) {
        grid[y][x] = 0;
      }
    }
  }

  // Trace outer dark border: 1
  const isOuter = (x, y) => x < 0 || x >= nx || y < 0 || y >= ny || grid[y][x] === 0;

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (grid[y][x] > 0) {
        if (isOuter(x+1, y) || isOuter(x-1, y) || isOuter(x, y+1) || isOuter(x, y-1)) {
          grid[y][x] = 1;
        }
      }
    }
  }

  // Inner warm shadow: 2
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      if (grid[y][x] >= 3) {
        if (grid[y+1][x] === 1 || grid[y][x+1] === 1) {
          grid[y][x] = 2;
        }
      }
    }
  }

  // Flecks
  flecks.forEach(f => {
    if (f.x < nx && f.y < ny && grid[f.y][f.x] >= 3) {
      grid[f.y][f.x] = 6;
    }
  });

  const colorHex = {
    0: null,
    1: '#544534',
    2: '#a49376',
    3: '#d7c198',
    4: '#decaa3',
    5: '#cfb88d',
    6: '#9e8d72'
  };

  const colorMap = {
    0: [0, 0, 0, 0],
    1: [0x54, 0x45, 0x34, 255],
    2: [0xa4, 0x93, 0x76, 255],
    3: [0xd7, 0xc1, 0x98, 255],
    4: [0xde, 0xca, 0xa3, 255],
    5: [0xcf, 0xb8, 0x8d, 255],
    6: [0x9e, 0x8d, 0x72, 255]
  };

  // Build PNG buffer
  const raw = Buffer.alloc(w * h * 4);
  for (let gy = 0; gy < ny; gy++) {
    for (let gx = 0; gx < nx; gx++) {
      const col = colorMap[grid[gy][gx]];
      for (let py = 0; py < unitSize; py++) {
        for (let px = 0; px < unitSize; px++) {
          const x = gx * unitSize + px;
          const y = gy * unitSize + py;
          const idx = (y * w + x) * 4;
          raw[idx] = col[0];
          raw[idx+1] = col[1];
          raw[idx+2] = col[2];
          raw[idx+3] = col[3];
        }
      }
    }
  }

  // Build SVG rects
  let rects = [];
  for (let gy = 0; gy < ny; gy++) {
    for (let gx = 0; gx < nx; gx++) {
      const hex = colorHex[grid[gy][gx]];
      if (hex) {
        rects.push(`<rect x="${gx * unitSize}" y="${gy * unitSize}" width="${unitSize}" height="${unitSize}" fill="${hex}"/>`);
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">
  ${rects.join('\n  ')}
</svg>`;

  fs.writeFileSync(`./public/parchment/${outPrefix}.png`, encodePNG(w, h, raw));
  fs.writeFileSync(`./public/parchment/${outPrefix}.svg`, svg);

  // 2x PNG for retina
  const w2 = w * 2, h2 = h * 2;
  const raw2 = Buffer.alloc(w2 * h2 * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sIdx = (y * w + x) * 4;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const dIdx = (((y * 2 + dy) * w2) + (x * 2 + dx)) * 4;
          raw2[dIdx] = raw[sIdx];
          raw2[dIdx+1] = raw[sIdx+1];
          raw2[dIdx+2] = raw[sIdx+2];
          raw2[dIdx+3] = raw[sIdx+3];
        }
      }
    }
  }
  fs.writeFileSync(`./public/parchment/${outPrefix}_2x.png`, encodePNG(w2, h2, raw2));

  console.log(`Saved ${outPrefix} (size: ${w}x${h}, slice: ${cornerUnits * unitSize})`);
}

// 1. Large Card / Banner: unit = 5px, corner = 30px (6 units), repeat = 80px (16 units), total = 140x140
createParchment9Slice({
  unitSize: 5,
  cornerUnits: 6,
  repeatUnitsX: 16,
  repeatUnitsY: 16,
  notchesX: [
    { start: 6, len: 2, type: 0 }, // subtle 2-unit tooth
    { start: 12, len: 1, type: 2 }  // subtle 1-unit indent
  ],
  notchesY: [
    { start: 5, len: 2, type: 2 },
    { start: 11, len: 1, type: 0 }
  ],
  flecks: [
    { x: 4, y: 4 }, { x: 23, y: 4 }, { x: 4, y: 23 }, { x: 23, y: 23 },
    { x: 12, y: 3 }, { x: 15, y: 24 }, { x: 3, y: 14 }
  ],
  outPrefix: 'parchment_card'
});

// 2. Small Chip / Button / Input: unit = 3px, corner = 15px (5 units), repeat = 36px (12 units), total = 66x66
createParchment9Slice({
  unitSize: 3,
  cornerUnits: 5,
  repeatUnitsX: 12,
  repeatUnitsY: 12,
  notchesX: [
    { start: 4, len: 2, type: 0 },
    { start: 9, len: 1, type: 2 }
  ],
  notchesY: [
    { start: 4, len: 1, type: 2 },
    { start: 8, len: 2, type: 0 }
  ],
  flecks: [
    { x: 3, y: 3 }, { x: 18, y: 3 }, { x: 3, y: 18 }, { x: 18, y: 18 }
  ],
  outPrefix: 'parchment_chip'
});
