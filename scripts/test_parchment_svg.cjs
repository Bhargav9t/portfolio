const fs = require('fs');

function generateParchmentPath(w, h, seed = 0, p = 6) {
  let s = (seed * 10007 + 1) % 233280;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const nx = Math.max(8, Math.floor(w / p));
  const ny = Math.max(8, Math.floor(h / p));
  
  const topY = new Int8Array(nx);
  const botY = new Int8Array(nx);
  const leftX = new Int8Array(ny);
  const rightX = new Int8Array(ny);

  // Baseline is 1 unit from edge
  for (let x = 0; x < nx; x++) { topY[x] = 1; botY[x] = 1; }
  for (let y = 0; y < ny; y++) { leftX[y] = 1; rightX[y] = 1; }

  // Torn corners (step inward)
  topY[0] = 3; topY[1] = 2; topY[2] = 2;
  topY[nx-1] = 3; topY[nx-2] = 2; topY[nx-3] = 2;

  botY[0] = 3; botY[1] = 2; botY[2] = 2;
  botY[nx-1] = 3; botY[nx-2] = 2; botY[nx-3] = 2;

  leftX[0] = 3; leftX[1] = 2; leftX[2] = 2;
  leftX[ny-1] = 3; leftX[ny-2] = 2; leftX[ny-3] = 2;

  rightX[0] = 3; rightX[1] = 2; rightX[2] = 2;
  rightX[ny-1] = 3; rightX[ny-2] = 2; rightX[ny-3] = 2;

  // Add ragged notches every few blocks
  const addNotches = (arr, len) => {
    let i = 3;
    while (i < len - 4) {
      const span = Math.floor(rnd() * 2) + 1; // 1 to 2 blocks wide
      const type = rnd() > 0.45 ? 0 : 2; // 0 = protrusion, 2 = notch
      for (let k = 0; k < span && (i + k) < len - 4; k++) {
        arr[i + k] = type;
      }
      i += span + Math.floor(rnd() * 4) + 2;
    }
  };

  addNotches(topY, nx);
  addNotches(botY, nx);
  addNotches(leftX, ny);
  addNotches(rightX, ny);

  // Generate crisp rectilinear SVG path
  const pts = [];
  
  // Top edge from left to right
  for (let x = 0; x < nx; x++) {
    const yVal = topY[x] * p;
    pts.push([x * p, yVal]);
    pts.push([(x + 1) * p, yVal]);
  }

  // Right edge from top to bottom
  for (let y = 0; y < ny; y++) {
    const xVal = w - rightX[y] * p;
    pts.push([xVal, y * p]);
    pts.push([xVal, (y + 1) * p]);
  }

  // Bottom edge from right to left
  for (let x = nx - 1; x >= 0; x--) {
    const yVal = h - botY[x] * p;
    pts.push([(x + 1) * p, yVal]);
    pts.push([x * p, yVal]);
  }

  // Left edge from bottom to top
  for (let y = ny - 1; y >= 0; y--) {
    const xVal = leftX[y] * p;
    pts.push([xVal, (y + 1) * p]);
    pts.push([xVal, y * p]);
  }

  // Turn pts into rectilinear SVG path
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0]} ${pts[i][1]}`;
  }
  d += ' Z';

  // Also generate internal decorative flecks near the edges
  const flecks = [];
  for (let x = 3; x < nx - 3; x++) {
    if (rnd() < 0.08) {
      const fy = (topY[x] + Math.floor(rnd() * 2) + 2) * p;
      flecks.push({ x: x * p, y: fy, w: p, h: p });
    }
    if (rnd() < 0.08) {
      const fy = h - (botY[x] + Math.floor(rnd() * 2) + 2) * p;
      flecks.push({ x: x * p, y: fy, w: p, h: p });
    }
  }
  for (let y = 3; y < ny - 3; y++) {
    if (rnd() < 0.08) {
      const fx = (leftX[y] + Math.floor(rnd() * 2) + 2) * p;
      flecks.push({ x: fx, y: y * p, w: p, h: p });
    }
    if (rnd() < 0.08) {
      const fx = w - (rightX[y] + Math.floor(rnd() * 2) + 2) * p;
      flecks.push({ x: fx, y: y * p, w: p, h: p });
    }
  }

  return { d, flecks };
}

const w = 480;
const h = 240;
const { d, flecks } = generateParchmentPath(w, h, 12, 6);

const flecksSvg = flecks.map(f => `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="#9c8e76" opacity="0.6"/>`).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <filter id="parchment-texture">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
      <feColorMatrix type="matrix" values="
        0 0 0 0 0.85
        0 0 0 0 0.76
        0 0 0 0 0.60
        0 0 0 0.18 0.82" result="coloredNoise" />
      <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
    </filter>
  </defs>
  <!-- Background drop shadow -->
  <path d="${d}" fill="none" stroke="#000000" stroke-width="4" stroke-opacity="0.3" transform="translate(0, 3)" />
  <!-- Main parchment body -->
  <path d="${d}" fill="#d8c299" stroke="#685640" stroke-width="2.5" stroke-linejoin="miter" stroke-linecap="square" />
  <!-- Internal decorative flecks -->
  ${flecksSvg}
</svg>`;

fs.writeFileSync('./scripts/test_preview.svg', svg);
console.log('SVG written to ./scripts/test_preview.svg, size:', svg.length);
