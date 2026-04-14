import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function createWatermarkedBuffer(imageBuffer: Buffer) {
  const watermarkPath = path.resolve(__dirname, "../../assets/watermark.png");
  
  if (!fs.existsSync(watermarkPath)) {
    throw new Error("❌ Watermark not found at: " + watermarkPath);
  }

  // 1. Get main image size and calculate the final output size explicitly.
  const originalMeta = await sharp(imageBuffer).metadata();

  if (!originalMeta.width || !originalMeta.height) {
    throw new Error("Invalid image dimensions");
  }

  const scale = Math.min(
    1600 / originalMeta.width,
    1200 / originalMeta.height,
    1,
  );
  const finalWidth = Math.max(1, Math.round(originalMeta.width * scale));
  const finalHeight = Math.max(1, Math.round(originalMeta.height * scale));

  // 2. Resize watermark relative to image and preserve transparency
  const resizedWatermark = await sharp(watermarkPath)
    .resize({
      width: Math.min(
        finalWidth,
        Math.max(140, Math.round(finalWidth * 0.22)),
      ),
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const watermarkMeta = await sharp(resizedWatermark).metadata();

  if (!watermarkMeta.width || !watermarkMeta.height) {
    throw new Error("Invalid watermark dimensions");
  }

  const margin = Math.max(16, Math.round(finalWidth * 0.02));
  const left = Math.max(0, finalWidth - watermarkMeta.width - margin);
  const top = Math.max(0, finalHeight - watermarkMeta.height - margin);
  const watermarkOverlay = Buffer.from(
    `
      <svg width="${watermarkMeta.width}" height="${watermarkMeta.height}">
        <image
          href="data:image/png;base64,${resizedWatermark.toString("base64")}"
          width="${watermarkMeta.width}"
          height="${watermarkMeta.height}"
          opacity="0.72"
        />
      </svg>
    `,
  );

  // 3. Apply watermark safely
  const outputBuffer = await sharp(imageBuffer)
    .resize(1600, 1200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .composite([
      {
        input: watermarkOverlay,
        left,
        top,
        blend: "over",
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return outputBuffer;
}
