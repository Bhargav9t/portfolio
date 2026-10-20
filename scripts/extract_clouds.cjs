const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

// Day Clouds
const dc = decodePNG(fs.readFileSync('./public/celestial/ref_day_clouds.png'));
const dcRaw = Buffer.alloc(dc.width * dc.height * 4);
for (let y = 0; y < dc.height; y++) {
  for (let x = 0; x < dc.width; x++) {
    const idx = (y * dc.width + x) * 4;
    const r = dc.raw[idx], g = dc.raw[idx+1], b = dc.raw[idx+2];
    dcRaw[idx] = r;
    dcRaw[idx+1] = g;
    dcRaw[idx+2] = b;

    // Check if blue background sky
    // Sky has r < 50 && b > 140
    if (r < 50 && b > 140) {
      dcRaw[idx+3] = 0; // Transparent!
    } else {
      dcRaw[idx+3] = 255;
    }
  }
}
fs.writeFileSync('./public/celestial/clouds_day.png', encodePNG(dc.width, dc.height, dcRaw));
console.log('Saved clouds_day.png:', dc.width, 'x', dc.height);

// Night Clouds
const nc = decodePNG(fs.readFileSync('./public/celestial/ref_night_clouds.png'));
const ncRaw = Buffer.alloc(nc.width * nc.height * 4);
for (let y = 0; y < nc.height; y++) {
  for (let x = 0; x < nc.width; x++) {
    const idx = (y * nc.width + x) * 4;
    const r = nc.raw[idx], g = nc.raw[idx+1], b = nc.raw[idx+2];
    ncRaw[idx] = r;
    ncRaw[idx+1] = g;
    ncRaw[idx+2] = b;

    // Flat night sky background is dark indigo: r < 56 && g < 56 && b < 125
    // Note: star sparkles in the sky have bright white (r > 150), keep them or allow 3D stars
    if (y < 235 && r < 60 && g < 60 && b < 128) {
      ncRaw[idx+3] = 0; // Transparent sky
    } else {
      ncRaw[idx+3] = 255;
    }
  }
}
fs.writeFileSync('./public/celestial/clouds_night.png', encodePNG(nc.width, nc.height, ncRaw));
console.log('Saved clouds_night.png:', nc.width, 'x', nc.height);
