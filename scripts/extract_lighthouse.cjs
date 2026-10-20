const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

const lh = decodePNG(fs.readFileSync('./public/celestial/ref_lighthouse.png'));

// Crop around the lighthouse and rock base
const minX = 350, maxX = 674;
const minY = 265, maxY = 745;
const w = maxX - minX + 1;
const h = maxY - minY + 1;

const cropped = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const src = ((minY + y) * lh.width + (minX + x)) * 4;
    const dst = (y * w + x) * 4;
    cropped[dst] = lh.raw[src];
    cropped[dst+1] = lh.raw[src+1];
    cropped[dst+2] = lh.raw[src+2];
    cropped[dst+3] = 255;
  }
}

// Flood fill sky from top corners
// The sky colors have r > 140 && g > 140 && b > 140 and max diff between channels is small (grayish overcast)
function isSky(r, g, b, y) {
  // Near the rock base at bottom, water line is at y > h - 30
  if (y > h - 25) return false;
  // Overcast sky test: muted gray/lavender
  const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return r > 130 && g > 130 && b > 130 && diff < 30;
}

const visited = new Uint8Array(w * h);
const qX = new Int32Array(w * h);
const qY = new Int32Array(w * h);
let head = 0, tail = 0;

function push(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = y * w + x;
  if (visited[idx]) return;
  const p = idx * 4;
  if (isSky(cropped[p], cropped[p+1], cropped[p+2], y)) {
    visited[idx] = 1;
    qX[tail] = x;
    qY[tail] = y;
    tail++;
  }
}

// Push top edge and top half sides
for (let x = 0; x < w; x++) { push(x, 0); }
for (let y = 0; y < h - 40; y++) { push(0, y); push(w - 1, y); }

while (head < tail) {
  const x = qX[head], y = qY[head];
  head++;
  push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
}

for (let i = 0; i < w * h; i++) {
  if (visited[i]) {
    cropped[i * 4 + 3] = 0; // Transparent sky!
  }
}

fs.writeFileSync('./public/celestial/lighthouse.png', encodePNG(w, h, cropped));
console.log('Saved lighthouse.png:', w, 'x', h);
