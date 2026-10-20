const fs = require('fs');
const { decodePNG } = require('./pngUtils.cjs');

const lh = decodePNG(fs.readFileSync('./public/celestial/ref_lighthouse.png'));
console.log('Lighthouse dimensions:', lh.width, 'x', lh.height);

// Sample vertical slice through center x = 512
for (let y = 0; y < lh.height; y += 40) {
  const idx = (y * lh.width + 512) * 4;
  const r = lh.raw[idx], g = lh.raw[idx+1], b = lh.raw[idx+2];
  console.log(`y=${y}: rgb(${r},${g},${b})`);
}

// Sample horizontal slice at y = 500 (lighthouse body)
for (let x = 0; x < lh.width; x += 40) {
  const idx = (500 * lh.width + x) * 4;
  const r = lh.raw[idx], g = lh.raw[idx+1], b = lh.raw[idx+2];
  console.log(`x=${x}: rgb(${r},${g},${b})`);
}
