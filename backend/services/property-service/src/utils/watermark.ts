import sharp from "sharp";
import path from "path";
import fs from "fs";

export async function saveWatermarkedImage(buffer: Buffer, fileName: string) {
  const outputPath = path.join(process.cwd(), "uploads/watermarked", fileName);
  const watermarkPath = path.join(process.cwd(), "assets", "watermark.png");

  const watermark = await sharp(watermarkPath)
    .modulate({ saturation: 0.5 })
    .toBuffer();

  await sharp(buffer)
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .composite([
      {
        input: watermark,
        gravity: "southeast",
      },
    ])
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  return `/uploads/watermarked/${fileName}`;
}
