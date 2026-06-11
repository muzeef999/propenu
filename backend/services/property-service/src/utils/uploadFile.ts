import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION!;
const BUCKET = process.env.AWS_S3_BUCKET!;

const s3 = new S3Client({
  region: REGION,
});

export type UploadFileOptions = {
  buffer?: Buffer;
  filePath?: string;
  originalName: string;
  mimetype?: string;
  folder?: string;
  entityId?: string;
  propertyId?: string;
};

export type UploadResult = {
  key: string;
  url: string;
  filename: string;
  mimetype?: string;
  size: number;
};

function buildKey({
  folder = "uploads",
  entityId,
  originalName,
}: UploadFileOptions) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);

  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const safeId = entityId ? `/${entityId}` : "";

  const unique = `${base}-${randomUUID()}${ext}`;

  return `${safeFolder}${safeId}/${unique}`.replace(/\/+/g, "/");
}

export async function uploadFile(
  opts: UploadFileOptions,
): Promise<UploadResult> {
  const {
    buffer,
    filePath,
    originalName,
    mimetype = "application/octet-stream",
  } = opts;

  if (!buffer && !filePath) {
    throw new Error("uploadFile requires either buffer or filePath");
  }

  const key = buildKey(opts);
  const filename = path.basename(key);

  const body = buffer ? buffer : fs.readFileSync(filePath!);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: mimetype,
    }),
  );

  let size = 0;

  if (buffer) {
    size = buffer.length;
  } else {
    const stats = fs.statSync(filePath!);
    size = stats.size;

    // delete local file after upload
    // try {
    //   console.log("DELETE START");
    //   console.log("Deleting:", filePath);
    //   console.trace("Delete Trace");

    //   fs.unlinkSync(filePath!);

    //   console.log("DELETE SUCCESS");
    // } catch (error) {
    //   console.error(error);
    // }
  }

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(
    key,
  )}`;

  return {
    key,
    url,
    filename,
    mimetype,
    size,
  };
}
