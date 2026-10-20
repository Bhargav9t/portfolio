const fs = require('fs');
const { decodePNG } = require('./pngUtils.cjs');
const basePath = 'C:/Users/Bhargav/.gemini/antigravity-ide/brain/a94a3523-765e-42ce-96e5-45c4902e68fb/.user_uploaded/';

function sampleColors(filename, name) {
  const img = decodePNG(fs.readFileSync(basePath + filename));
  const colors = new Map();
  for (let i = 0; i < img.raw.length; i += 4) {
    const r = img.raw[i];
    const g = img.raw[i+1];
    const b = img.raw[i+2];
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    colors.set(hex, (colors.get(hex) || 0) + 1);
  }
  const sorted = Array.from(colors.entries()).sort((a, b) => b[1] - a[1]);
  console.log('=== ' + name + ' top colors (' + colors.size + ' unique) ===');
  console.log(sorted.slice(0, 10));

  // Check left vs right column matching (seamless wrapping)
  let diff = 0;
  for (let y = 0; y < img.height; y++) {
    const leftIdx = (y * img.width + 0) * 4;
    const rightIdx = (y * img.width + (img.width - 1)) * 4;
    diff += Math.abs(img.raw[leftIdx] - img.raw[rightIdx]);
    diff += Math.abs(img.raw[leftIdx+1] - img.raw[rightIdx+1]);
    diff += Math.abs(img.raw[leftIdx+2] - img.raw[rightIdx+2]);
  }
  console.log('Wrap seam diff per line:', (diff / img.height).toFixed(2));
}

sampleColors('media_1792232377410.png', 'Image 1 (Day Sky)');
sampleColors('media_1792232389311.png', 'Image 2 (Dawn/Dusk Sky)');
sampleColors('media_1792232405691.png', 'Image 3 (Dawn Water)');
sampleColors('media_1792232471145.png', 'Image 4 (Night Space)');
