const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const outDir = path.join("D:", "propenu", "test-assets", "site-branding");
fs.mkdirSync(outDir, { recursive: true });

const banners = [
  { name: "banner-desktop-1920x600.webp", w: 1920, h: 600, rgb: "39,174,96" },
  { name: "banner-laptop-1440x500.webp", w: 1440, h: 500, rgb: "46,134,193" },
  { name: "banner-tablet-1536x768.webp", w: 1536, h: 768, rgb: "142,68,173" },
  { name: "banner-mobile-1080x900.webp", w: 1080, h: 900, rgb: "230,126,34" },
];

async function makeBanner({ name, w, h, rgb }) {
  const titleSize = Math.round(w / 18);
  const subSize = Math.round(w / 40);
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgb(${rgb})"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="46%" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="700">PROPENU TEST</text>
  <text x="50%" y="58%" text-anchor="middle" fill="#d1fae5" font-family="Arial,sans-serif" font-size="${subSize}">${w} x ${h}</text>
</svg>`);

  const file = path.join(outDir, name);
  await sharp(svg).webp({ quality: 82 }).toFile(file);
  const size = fs.statSync(file).size;
  console.log(`${name}  ${w}x${h}  ${(size / 1024).toFixed(1)} KB`);
}

async function makeLogo(name, w, h, bg, fg) {
  const fontSize = Math.round(h * 0.36);
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" rx="${Math.round(h / 6)}" fill="${bg}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${fg}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="700">PROPENU</text>
</svg>`);

  const file = path.join(outDir, name);
  await sharp(svg).gif().toFile(file);
  const size = fs.statSync(file).size;
  console.log(`${name}  ${w}x${h}  ${(size / 1024).toFixed(1)} KB`);
}

(async () => {
  for (const b of banners) {
    await makeBanner(b);
  }
  await makeLogo("logo-334x100.gif", 334, 100, "#27AE60", "#ffffff");
  await makeLogo("logo-167x50.gif", 167, 50, "#111827", "#27AE60");
  console.log("\nSaved to:", outDir);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
