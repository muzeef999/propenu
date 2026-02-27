// src/utils/s3Helpers.ts

import s3 from "../config/s3";

export const deleteS3ObjectIfExists = async (key?: string) => {
  if (!key) return;

  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_BUCKET missing in .env");
  }

  try {
    await s3
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();

    console.log("✅ Deleted from S3:", key);

  } catch (err: any) {
    console.error("❌ S3 delete failed:", err.message);
    // optional: don't crash API
  }
};