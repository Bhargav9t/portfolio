const fs = require('fs');
const { decodePNG } = require('./pngUtils.cjs');

const dc = decodePNG(fs.readFileSync('./public/celestial/ref_day_clouds.png'));
console.log('Day clouds:', dc.width, 'x', dc.height);

const nc = decodePNG(fs.readFileSync('./public/celestial/ref_night_clouds.png'));
console.log('Night clouds:', nc.width, 'x', nc.height);
