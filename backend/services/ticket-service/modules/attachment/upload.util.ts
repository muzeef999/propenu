import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { randomUUID } from "crypto";

const buildKey = (originalName: string, folder = "ticket-attachments") => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, "-");
  return `${folder}/${base}-${randomUUID()}${ext}`.replace(/\/+/g, "/");
};

export const uploadAttachmentToS3 = async (file: Express.Multer.File) => {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!region) {
    throw new Error("AWS_REGION is missing for ticket attachment uploads");
  }

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is missing for ticket attachment uploads");
  }

  const s3 = new S3Client({ region });
  const key = buildKey(file.originalname);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    }),
  );

  return {
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`,
    name: file.originalname,
    mimeType: file.mimetype || "application/octet-stream",
    size: file.size,
  };
};
