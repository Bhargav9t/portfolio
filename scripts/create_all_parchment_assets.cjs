const fs = require('fs');
const { encodePNG } = require('./pngUtils.cjs');

function generateTiles() {
  const dir = './public/parchment';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const colorPalettes = {
    card: {
      0: null,
      1: '#544534', // dark ink border
      2: '#a49376', // inner shading
      3: '#d7c198', // base parchment
      4: '#decaa3', // light fiber
      5: '#cfb88d', // warm fiber
      6: '#9e8d72'  // aged fleck
    },
    inset: {
      0: null,
      1: '#5c4b37',
      2: '#9a886b',
      3: '#cdb68a', // slightly darker/aged for nested callouts
      4: '#d6c095',
      5: '#c2a979',
      6: '#8a775b'
    },
    chip: {
      0: null,
      1: '#544534',
      2: '#a49376',
      3: '#d7c198',
      4: '#decaa3',
      5: '#cfb88d',
      6: '#9e8d72'
    },
    chipActive: {
      0: null,
      1: '#3d2c18',
      2: '#8b7352',
      3: '#c8ad78', // active/selected chip: deeper golden parchment
      4: '#d4bb87',
      5: '#bc9e65',
      6: '#7a6240'
    }
  };

  function buildTile({
    unitSize,
    cornerUnits,
    repeatUnitsX,
    repeatUnitsY,
    paletteKey,
    notchesX,
    notchesY,
    cornerTorn,
    flecks,
    fileName
  }) {
    const palette = colorPalettes[paletteKey];
    const nx = cornerUnits * 2 + repeatUnitsX;
    const ny = cornerUnits * 2 + repeatUnitsY;
    const w = nx * unitSize;
    const h = ny * unitSize;

    const grid = Array.from({ length: ny }, () => new Uint8Array(nx));

    // Fill with base
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        grid[y][x] = 3;
      }
    }

    // Linen weave
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

    const topY = new Int8Array(nx).fill(1);
    const botY = new Int8Array(nx).fill(1);
    const leftX = new Int8Array(ny).fill(1);
    const rightX = new Int8Array(ny).fill(1);

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

    notchesX.forEach(n => {
      for (let k = 0; k < n.len; k++) {
        const col = cornerUnits + n.start + k;
        if (col < nx - cornerUnits) topY[col] = n.type;
      }
    });

    notchesX.forEach(n => {
      for (let k = 0; k < n.len; k++) {
        const col = cornerUnits + ((n.start + Math.floor(repeatUnitsX / 2)) % repeatUnitsX) + k;
        if (col < nx - cornerUnits) botY[col] = n.type === 0 ? 2 : 0;
      }
    });

    notchesY.forEach(n => {
      for (let k = 0; k < n.len; k++) {
        const row = cornerUnits + n.start + k;
        if (row < ny - cornerUnits) leftX[row] = n.type;
      }
    });

    notchesY.forEach(n => {
      for (let k = 0; k < n.len; k++) {
        const row = cornerUnits + ((n.start + Math.floor(repeatUnitsY / 2)) % repeatUnitsY) + k;
        if (row < ny - cornerUnits) rightX[row] = n.type === 0 ? 2 : 0;
      }
    });

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (y < topY[x] || y >= ny - botY[x] || x < leftX[y] || x >= nx - rightX[y]) {
          grid[y][x] = 0;
        }
      }
    }

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

    for (let y = 1; y < ny - 1; y++) {
      for (let x = 1; x < nx - 1; x++) {
        if (grid[y][x] >= 3) {
          if (grid[y+1][x] === 1 || grid[y][x+1] === 1) {
            grid[y][x] = 2;
          }
        }
      }
    }

    flecks.forEach(f => {
      if (f.x < nx && f.y < ny && grid[f.y][f.x] >= 3) {
        grid[f.y][f.x] = 6;
      }
    });

    // RGBA map
    const colorMap = {
      0: [0, 0, 0, 0],
      1: hexToRgb(palette[1]),
      2: hexToRgb(palette[2]),
      3: hexToRgb(palette[3]),
      4: hexToRgb(palette[4]),
      5: hexToRgb(palette[5]),
      6: hexToRgb(palette[6])
    };

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

    let rects = [];
    for (let gy = 0; gy < ny; gy++) {
      for (let gx = 0; gx < nx; gx++) {
        const hex = palette[grid[gy][gx]];
        if (hex) {
          rects.push(`<rect x="${gx * unitSize}" y="${gy * unitSize}" width="${unitSize}" height="${unitSize}" fill="${hex}"/>`);
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">
  ${rects.join('\n  ')}
</svg>`;

    fs.writeFileSync(`${dir}/${fileName}.svg`, svg);
    fs.writeFileSync(`${dir}/${fileName}.png`, encodePNG(w, h, raw));

    // 2x Retina PNG
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
    fs.writeFileSync(`${dir}/${fileName}_2x.png`, encodePNG(w2, h2, raw2));
    console.log(`Generated ${fileName} (${w}x${h}, slice: ${cornerUnits * unitSize})`);
  }

  function hexToRgb(hex) {
    if (!hex) return [0, 0, 0, 0];
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }

  // 1. parchment_card (unit=5, corner=30, repeat=80 -> 140x140)
  buildTile({
    unitSize: 5,
    cornerUnits: 6,
    repeatUnitsX: 16,
    repeatUnitsY: 16,
    paletteKey: 'card',
    notchesX: [{ start: 6, len: 2, type: 0 }, { start: 12, len: 1, type: 2 }],
    notchesY: [{ start: 5, len: 2, type: 2 }, { start: 11, len: 1, type: 0 }],
    cornerTorn: [4, 2, 2, 1, 1, 1],
    flecks: [{ x: 4, y: 4 }, { x: 23, y: 4 }, { x: 4, y: 23 }, { x: 23, y: 23 }, { x: 12, y: 3 }, { x: 15, y: 24 }],
    fileName: 'parchment_card'
  });

  // 2. parchment_banner (unit=5, corner=35, repeat=90 -> 160x160)
  buildTile({
    unitSize: 5,
    cornerUnits: 7,
    repeatUnitsX: 18,
    repeatUnitsY: 18,
    paletteKey: 'card',
    notchesX: [{ start: 4, len: 2, type: 0 }, { start: 11, len: 2, type: 2 }, { start: 15, len: 1, type: 0 }],
    notchesY: [{ start: 5, len: 2, type: 2 }, { start: 12, len: 2, type: 0 }],
    cornerTorn: [5, 3, 2, 2, 1, 1, 1],
    flecks: [{ x: 5, y: 5 }, { x: 26, y: 5 }, { x: 5, y: 26 }, { x: 26, y: 26 }],
    fileName: 'parchment_banner'
  });

  // 3. parchment_inset (unit=4, corner=20, repeat=48 -> 88x88)
  buildTile({
    unitSize: 4,
    cornerUnits: 5,
    repeatUnitsX: 12,
    repeatUnitsY: 12,
    paletteKey: 'inset',
    notchesX: [{ start: 4, len: 1, type: 0 }, { start: 8, len: 1, type: 2 }],
    notchesY: [{ start: 3, len: 1, type: 2 }, { start: 7, len: 1, type: 0 }],
    cornerTorn: [3, 2, 1, 1, 1],
    flecks: [{ x: 3, y: 3 }, { x: 18, y: 18 }],
    fileName: 'parchment_inset'
  });

  // 4. parchment_chip (unit=3, corner=15, repeat=36 -> 66x66)
  buildTile({
    unitSize: 3,
    cornerUnits: 5,
    repeatUnitsX: 12,
    repeatUnitsY: 12,
    paletteKey: 'chip',
    notchesX: [{ start: 4, len: 2, type: 0 }, { start: 9, len: 1, type: 2 }],
    notchesY: [{ start: 4, len: 1, type: 2 }, { start: 8, len: 2, type: 0 }],
    cornerTorn: [3, 2, 1, 1, 1],
    flecks: [{ x: 3, y: 3 }, { x: 18, y: 3 }],
    fileName: 'parchment_chip'
  });

  // 5. parchment_chip_active (active / highlighted button or chip)
  buildTile({
    unitSize: 3,
    cornerUnits: 5,
    repeatUnitsX: 12,
    repeatUnitsY: 12,
    paletteKey: 'chipActive',
    notchesX: [{ start: 4, len: 2, type: 0 }, { start: 9, len: 1, type: 2 }],
    notchesY: [{ start: 4, len: 1, type: 2 }, { start: 8, len: 2, type: 0 }],
    cornerTorn: [3, 2, 1, 1, 1],
    flecks: [{ x: 3, y: 3 }, { x: 18, y: 3 }],
    fileName: 'parchment_chip_active'
  });
}

generateTiles();
