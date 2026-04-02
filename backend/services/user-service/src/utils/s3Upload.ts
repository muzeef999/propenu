import s3 from "../config/s3";

export const uploadToS3 = async ({
  buffer,
  key,
  mimetype,
}: {
  buffer: Buffer;
  key: string;
  mimetype: string;
}) => {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;

  // ✅ HARD FAIL (so you know immediately)
  if (!bucket) {
    throw new Error("❌ AWS_S3_BUCKET is missing in .env");
  }

  if (!region) {
    throw new Error("❌ AWS_REGION is missing in .env");
  }

  console.log("✅ Bucket:", bucket); // debug
  console.log("✅ Region:", region); // debug

  await s3
    .upload({
      Bucket: bucket, // 🔥 THIS WAS UNDEFINED BEFORE
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
    .promise();

  return {
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
      key
    )}`,
  };
};