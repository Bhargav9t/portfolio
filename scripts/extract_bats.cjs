const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

// Extract Bat 1 (Wings Up)
const b1 = decodePNG(fs.readFileSync('./public/celestial/raw_bat1.png'));
// Bat 1 is in box: x: 200..780, y: 280..560
const b1W = 780 - 200;
const b1H = 560 - 280;
const b1Crop = Buffer.alloc(b1W * b1H * 4);
for (let y = 0; y < b1H; y++) {
  for (let x = 0; x < b1W; x++) {
    const srcIdx = ((280 + y) * b1.width + (200 + x)) * 4;
    const dstIdx = (y * b1W + x) * 4;
    b1Crop[dstIdx] = b1.raw[srcIdx];
    b1Crop[dstIdx+1] = b1.raw[srcIdx+1];
    b1Crop[dstIdx+2] = b1.raw[srcIdx+2];
    b1Crop[dstIdx+3] = 255;
  }
}

// Flood fill background from corners of cropped box
const visited1 = new Uint8Array(b1W * b1H);
const qX1 = new Int32Array(b1W * b1H);
const qY1 = new Int32Array(b1W * b1H);
let h1 = 0, t1 = 0;

function push1(x, y) {
  if (x < 0 || x >= b1W || y < 0 || y >= b1H) return;
  const idx = y * b1W + x;
  if (visited1[idx]) return;
  const p = idx * 4;
  // Background in this crop is light (r > 200 && g > 200 && b > 200)
  if (b1Crop[p] > 200 && b1Crop[p+1] > 200 && b1Crop[p+2] > 200) {
    visited1[idx] = 1;
    qX1[t1] = x;
    qY1[t1] = y;
    t1++;
  }
}

for (let x = 0; x < b1W; x++) { push1(x, 0); push1(x, b1H - 1); }
for (let y = 0; y < b1H; y++) { push1(0, y); push1(b1W - 1, y); }

while (h1 < t1) {
  const x = qX1[h1], y = qY1[h1];
  h1++;
  push1(x + 1, y); push1(x - 1, y); push1(x, y + 1); push1(x, y - 1);
}

let minX1 = b1W, minY1 = b1H, maxX1 = 0, maxY1 = 0;
for (let i = 0; i < b1W * b1H; i++) {
  if (visited1[i]) {
    b1Crop[i * 4 + 3] = 0;
  } else {
    const x = i % b1W;
    const y = Math.floor(i / b1W);
    if (x < minX1) minX1 = x;
    if (x > maxX1) maxX1 = x;
    if (y < minY1) minY1 = y;
    if (y > maxY1) maxY1 = y;
  }
}

const finalW1 = maxX1 - minX1 + 1;
const finalH1 = maxY1 - minY1 + 1;
const finalBat1 = Buffer.alloc(finalW1 * finalH1 * 4);
for (let y = 0; y < finalH1; y++) {
  for (let x = 0; x < finalW1; x++) {
    const src = ((minY1 + y) * b1W + (minX1 + x)) * 4;
    const dst = (y * finalW1 + x) * 4;
    finalBat1[dst] = b1Crop[src];
    finalBat1[dst+1] = b1Crop[src+1];
    finalBat1[dst+2] = b1Crop[src+2];
    finalBat1[dst+3] = b1Crop[src+3];
  }
}

fs.writeFileSync('./public/celestial/bat_wings_up.png', encodePNG(finalW1, finalH1, finalBat1));
console.log('Final bat_wings_up.png:', finalW1, 'x', finalH1);

// Extract Bat 2 (Wings Down)
const b2 = decodePNG(fs.readFileSync('./public/celestial/raw_bat2.png'));
// Bat 2 is in box: x: 100..580, y: 100..420
const b2W = 580 - 100;
const b2H = 420 - 100;
const b2Crop = Buffer.alloc(b2W * b2H * 4);
for (let y = 0; y < b2H; y++) {
  for (let x = 0; x < b2W; x++) {
    const srcIdx = ((100 + y) * b2.width + (100 + x)) * 4;
    const dstIdx = (y * b2W + x) * 4;
    b2Crop[dstIdx] = b2.raw[srcIdx];
    b2Crop[dstIdx+1] = b2.raw[srcIdx+1];
    b2Crop[dstIdx+2] = b2.raw[srcIdx+2];
    b2Crop[dstIdx+3] = 255;
  }
}

const visited2 = new Uint8Array(b2W * b2H);
const qX2 = new Int32Array(b2W * b2H);
const qY2 = new Int32Array(b2W * b2H);
let h2 = 0, t2 = 0;

function push2(x, y) {
  if (x < 0 || x >= b2W || y < 0 || y >= b2H) return;
  const idx = y * b2W + x;
  if (visited2[idx]) return;
  const p = idx * 4;
  if (b2Crop[p] > 200 && b2Crop[p+1] > 200 && b2Crop[p+2] > 200) {
    visited2[idx] = 1;
    qX2[t2] = x;
    qY2[t2] = y;
    t2++;
  }
}

for (let x = 0; x < b2W; x++) { push2(x, 0); push2(x, b2H - 1); }
for (let y = 0; y < b2H; y++) { push2(0, y); push2(b2W - 1, y); }

while (h2 < t2) {
  const x = qX2[h2], y = qY2[h2];
  h2++;
  push2(x + 1, y); push2(x - 1, y); push2(x, y + 1); push2(x, y - 1);
}

let minX2 = b2W, minY2 = b2H, maxX2 = 0, maxY2 = 0;
for (let i = 0; i < b2W * b2H; i++) {
  if (visited2[i]) {
    b2Crop[i * 4 + 3] = 0;
  } else {
    const x = i % b2W;
    const y = Math.floor(i / b2W);
    if (x < minX2) minX2 = x;
    if (x > maxX2) maxX2 = x;
    if (y < minY2) minY2 = y;
    if (y > maxY2) maxY2 = y;
  }
}

const finalW2 = maxX2 - minX2 + 1;
const finalH2 = maxY2 - minY2 + 1;
const finalBat2 = Buffer.alloc(finalW2 * finalH2 * 4);
for (let y = 0; y < finalH2; y++) {
  for (let x = 0; x < finalW2; x++) {
    const src = ((minY2 + y) * b2W + (minX2 + x)) * 4;
    const dst = (y * finalW2 + x) * 4;
    finalBat2[dst] = b2Crop[src];
    finalBat2[dst+1] = b2Crop[src+1];
    finalBat2[dst+2] = b2Crop[src+2];
    finalBat2[dst+3] = b2Crop[src+3];
  }
}

fs.writeFileSync('./public/celestial/bat_wings_down.png', encodePNG(finalW2, finalH2, finalBat2));
console.log('Final bat_wings_down.png:', finalW2, 'x', finalH2);
