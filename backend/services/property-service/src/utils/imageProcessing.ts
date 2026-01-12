import sharp from "sharp";
import path from "path";

export async function createWatermarkedBuffer(buffer: Buffer) {
  const watermarkPath = path.join(process.cwd(), "assets", "watermark.png");

  const watermark = await sharp(watermarkPath)
    .modulate({ saturation: 0.5 })
    .toBuffer();

  const outputBuffer = await sharp(buffer)
    .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
    .composite([
      {
        input: watermark,
        gravity: "southeast",
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return outputBuffer;
}
