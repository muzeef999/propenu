import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET!;
const s3 = new S3Client({ region: REGION });

export type UploadFileOptions = {
  buffer: Buffer;
  originalName: string;       
  mimetype?: string;          
  folder?: string;            
  entityId?: string; 
  propertyId?: string,         
};

export type UploadResult = {
  key: string;
  url: string;
  filename: string;
  mimetype?: string;
  size: number;
};

function buildKey({ folder = "uploads", entityId, originalName }: UploadFileOptions) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const safeId = entityId ? `/${entityId}` : "";
  const unique = `${base}-${randomUUID()}${ext}`;
  return `${safeFolder}${safeId}/${unique}`.replace(/\/+/g, "/");
}

/** Upload file buffer to S3 (simple PUT) */
export async function uploadFile(opts: UploadFileOptions): Promise<UploadResult> {
  const { buffer, originalName, mimetype = "application/octet-stream" } = opts;

  const key = buildKey(opts);
  const filename = path.basename(key);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`;

  return {
    key,
    url,
    filename,
    mimetype,
    size: buffer.length,
  };
}
