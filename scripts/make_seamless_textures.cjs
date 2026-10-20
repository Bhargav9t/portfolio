const fs = require('fs');
const { decodePNG, encodePNG } = require('./pngUtils.cjs');

function makeSeamless(inPath, outPath) {
  const img = decodePNG(fs.readFileSync(inPath));
  const w = img.width;
  const h = img.height;
  const outRaw = Buffer.from(img.raw);

  const blendWidth = Math.min(32, Math.floor(w * 0.05));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < blendWidth; x++) {
      const leftIdx = (y * w + x) * 4;
      const rightX = w - 1 - (blendWidth - 1 - x);
      const rightIdx = (y * w + rightX) * 4;

      const factor = x / blendWidth; // 0 to 1
      for (let c = 0; c < 3; c++) {
        const leftVal = img.raw[leftIdx + c];
        const rightVal = img.raw[rightIdx + c];
        const blended = Math.round(leftVal * factor + rightVal * (1 - factor));
        outRaw[leftIdx + c] = blended;
      }
      outRaw[leftIdx + 3] = 255;
    }
  }

  fs.writeFileSync(outPath, encodePNG(w, h, outRaw));
  console.log('Saved seamless:', outPath);
}

makeSeamless('./public/celestial/sky_day_ref.png', './public/celestial/sky_day.png');
makeSeamless('./public/celestial/sky_dawn_ref.png', './public/celestial/sky_dawn.png');
makeSeamless('./public/celestial/space_night_ref.png', './public/celestial/space_night.png');
makeSeamless('./public/celestial/water_dawn_ref.png', './public/celestial/water_dawn.png');
