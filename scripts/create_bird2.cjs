const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

const b1 = decodePNG(fs.readFileSync('./public/celestial/bird_frame1.png'));
const w = b1.width;
const h = b1.height;
const b2Raw = Buffer.from(b1.raw);

// The wings are to the left and right of the body (x < 240 and x > 400, y < 140)
// To flap wings down, displace the upper wing pixels down by ~12-18 pixels
for (let y = h - 1; y >= 0; y--) {
  for (let x = 0; x < w; x++) {
    // Left wing
    if (x < 230 && y < 150) {
      const srcY = Math.max(0, y - 14);
      const src = (srcY * w + x) * 4;
      const dst = (y * w + x) * 4;
      b2Raw[dst] = b1.raw[src];
      b2Raw[dst+1] = b1.raw[src+1];
      b2Raw[dst+2] = b1.raw[src+2];
      b2Raw[dst+3] = b1.raw[src+3];
    }
    // Right wing
    if (x > 380 && y < 150) {
      const srcY = Math.max(0, y - 12);
      const src = (srcY * w + x) * 4;
      const dst = (y * w + x) * 4;
      b2Raw[dst] = b1.raw[src];
      b2Raw[dst+1] = b1.raw[src+1];
      b2Raw[dst+2] = b1.raw[src+2];
      b2Raw[dst+3] = b1.raw[src+3];
    }
  }
}

fs.writeFileSync('./public/celestial/bird_frame2.png', encodePNG(w, h, b2Raw));
console.log('Saved bird_frame2.png');
