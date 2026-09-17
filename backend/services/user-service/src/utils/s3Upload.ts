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

  if (!bucket) {
    throw new Error("❌ AWS_S3_BUCKET is missing in .env");
  }

  if (!region) {
    throw new Error("❌ AWS_REGION is missing in .env");
  }

  const params: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
    ACL?: string;
  } = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  };

  // Optional ACL — many buckets use policy instead of object ACL
  if (
    ["1", "true", "yes"].includes(
      String(process.env.AWS_S3_PUBLIC_READ || "")
        .toLowerCase()
        .trim(),
    )
  ) {
    params.ACL = "public-read";
  }

  await s3.upload(params).promise();

  const safePath = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return {
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${safePath}`,
  };
};
