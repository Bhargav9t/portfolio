const fs = require('fs');
const { decodePNG } = require('./pngUtils.cjs');
const files = [
  'media_1792232377410.png',
  'media_1792232389311.png',
  'media_1792232405691.png',
  'media_1792232471145.png'
];
const basePath = 'C:/Users/Bhargav/.gemini/antigravity-ide/brain/a94a3523-765e-42ce-96e5-45c4902e68fb/.user_uploaded/';
files.forEach((f, idx) => {
  const data = fs.readFileSync(basePath + f);
  const img = decodePNG(data);
  console.log('Image ' + (idx + 1) + ' (' + f + '): ' + img.width + 'x' + img.height);
});
