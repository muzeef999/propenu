// src/services/s3Service.ts
import s3 from "../config/s3";
import { Types } from "mongoose";
import { v4 as uuid } from "uuid";

const { S3_BUCKET, CDN_URL, AWS_REGION } = process.env;
if (!S3_BUCKET) throw new Error("Missing S3_BUCKET env");

function sanitizeFilename(name: string) {
  return (name || "file").toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-");
}

function guessExt(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
  };
  return map[mime] || "";
}

function buildPublicUrl(key: string) {
  if (CDN_URL) return `${CDN_URL}/${key}`;
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadBufferToS3({
  buffer,
  originalname,
  mimetype,
  propertyId,
}: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  propertyId: string;
}) {
  if (!Types.ObjectId.isValid(propertyId)) throw new Error("Invalid propertyId");
  const original = sanitizeFilename(originalname);
  const ext = original.includes(".") ? "" : guessExt(mimetype);
  const key = `properties/${propertyId}/${uuid()}-${original}${ext}`;

  await s3
    .putObject({
      Bucket: S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // ACL: 'public-read' // optional, prefer CloudFront/CDN instead
    })
    .promise();

  const url = buildPublicUrl(key);
  return { key, url };
}
