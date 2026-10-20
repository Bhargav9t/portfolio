const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

// Flood fill helper to set alpha=0 for background pixels
function floodFillAlpha(width, height, raw, isBg) {
  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  function push(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const pIdx = idx * 4;
    if (isBg(raw[pIdx], raw[pIdx+1], raw[pIdx+2], raw[pIdx+3], x, y)) {
      visited[idx] = 1;
      queueX[tail] = x;
      queueY[tail] = y;
      tail++;
    }
  }

  // Push all border pixels
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  // BFS
  while (head < tail) {
    const x = queueX[head];
    const y = queueY[head];
    head++;

    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Apply transparency to visited pixels
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      raw[i * 4 + 3] = 0; // alpha = 0
    }
  }

  return visited;
}

// Bounding box of non-transparent pixels
function getBounds(width, height, raw) {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = raw[(y * width + x) * 4 + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

// Crop sub-image
function crop(width, height, raw, bounds, pad = 2) {
  const minX = Math.max(0, bounds.minX - pad);
  const minY = Math.max(0, bounds.minY - pad);
  const maxX = Math.min(width - 1, bounds.maxX + pad);
  const maxY = Math.min(height - 1, bounds.maxY + pad);
  const newW = maxX - minX + 1;
  const newH = maxY - minY + 1;
  const out = Buffer.alloc(newW * newH * 4);

  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcIdx = ((minY + y) * width + (minX + x)) * 4;
      const dstIdx = (y * newW + x) * 4;
      out[dstIdx] = raw[srcIdx];
      out[dstIdx+1] = raw[srcIdx+1];
      out[dstIdx+2] = raw[srcIdx+2];
      out[dstIdx+3] = raw[srcIdx+3];
    }
  }
  return { width: newW, height: newH, raw: out };
}

console.log('--- Processing Bat 1 (Wings Up) ---');
const bat1 = decodePNG(fs.readFileSync('./public/celestial/raw_bat1.png'));
floodFillAlpha(bat1.width, bat1.height, bat1.raw, (r, g, b) => r > 220 && g > 220 && b > 220);
const b1Bounds = getBounds(bat1.width, bat1.height, bat1.raw);
console.log('Bat 1 bounds:', b1Bounds);
const bat1Cropped = crop(bat1.width, bat1.height, bat1.raw, b1Bounds, 4);
fs.writeFileSync('./public/celestial/bat_wings_up.png', encodePNG(bat1Cropped.width, bat1Cropped.height, bat1Cropped.raw));
console.log('Saved bat_wings_up.png:', bat1Cropped.width, 'x', bat1Cropped.height);

console.log('--- Processing Bat 2 (Wings Down) ---');
const bat2 = decodePNG(fs.readFileSync('./public/celestial/raw_bat2.png'));
floodFillAlpha(bat2.width, bat2.height, bat2.raw, (r, g, b) => r > 210 && g > 210 && b > 210);
const b2Bounds = getBounds(bat2.width, bat2.height, bat2.raw);
console.log('Bat 2 bounds:', b2Bounds);
const bat2Cropped = crop(bat2.width, bat2.height, bat2.raw, b2Bounds, 4);
fs.writeFileSync('./public/celestial/bat_wings_down.png', encodePNG(bat2Cropped.width, bat2Cropped.height, bat2Cropped.raw));
console.log('Saved bat_wings_down.png:', bat2Cropped.width, 'x', bat2Cropped.height);

console.log('--- Processing Bird ---');
const bird = decodePNG(fs.readFileSync('./public/celestial/ref_bird.png'));
floodFillAlpha(bird.width, bird.height, bird.raw, (r, g, b) => r > 240 && g > 240 && b > 240);
const birdBounds = getBounds(bird.width, bird.height, bird.raw);
console.log('Bird bounds:', birdBounds);
const birdCropped = crop(bird.width, bird.height, bird.raw, birdBounds, 4);
fs.writeFileSync('./public/celestial/bird_frame1.png', encodePNG(birdCropped.width, birdCropped.height, birdCropped.raw));
console.log('Saved bird_frame1.png:', birdCropped.width, 'x', birdCropped.height);

console.log('--- Processing Astronaut ---');
const astro = decodePNG(fs.readFileSync('./public/celestial/ref_astronaut.png'));
floodFillAlpha(astro.width, astro.height, astro.raw, (r, g, b) => r < 30 && g < 30 && b < 30);
// Filter out stray tiny dust stars
const astroBounds = getBounds(astro.width, astro.height, astro.raw);
console.log('Astro bounds:', astroBounds);
const astroCropped = crop(astro.width, astro.height, astro.raw, astroBounds, 4);
fs.writeFileSync('./public/celestial/astronaut.png', encodePNG(astroCropped.width, astroCropped.height, astroCropped.raw));
console.log('Saved astronaut.png:', astroCropped.width, 'x', astroCropped.height);
