const sharp = require('sharp');
const logo = 'public/images/logo.png';

async function generate(size, logoWidth) {
  const resized = await sharp(logo)
    .resize(logoWidth, null, { fit: 'inside' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite([{ input: resized, gravity: 'center' }])
    .toFile(`public/images/icon-${size}.png`);

  console.log(`wrote icon-${size}.png`);
}

(async () => {
  await generate(192, 144);
  await generate(512, 384);
})();
