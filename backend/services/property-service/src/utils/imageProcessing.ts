import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function createWatermarkedBuffer(imageBuffer: Buffer) {
  const watermarkPath = path.resolve(__dirname, "../assets/watermark.png");

  if (!fs.existsSync(watermarkPath)) {
    throw new Error("❌ Watermark not found at: " + watermarkPath);
  }

  // 1. Get main image size
  const image = sharp(imageBuffer);
  const imageMeta = await image.metadata();

  if (!imageMeta.width || !imageMeta.height) {
    throw new Error("Invalid image dimensions");
  }

  // 2. Resize watermark relative to image (25% width)
  const watermark = await sharp(watermarkPath)
    .resize({
      width: Math.round(imageMeta.width * 0.25), // 25% of image width
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  // Apply opacity to watermark
  const watermarkWithOpacity = await sharp(watermark)
    .composite([{ input: Buffer.from('<svg><rect width="100%" height="100%" fill="black" opacity="0.5"/></svg>'), blend: 'multiply' }])
    .png()
    .toBuffer();

  // 3. Apply watermark safely
  const outputBuffer = await image
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .composite([
      {
        input: watermark,
        gravity: "southeast",
        blend: "multiply",
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return outputBuffer;
}
