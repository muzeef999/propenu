import AWS from "aws-sdk";

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_SECRET_KEY!,
});

export async function uploadPdfToS3(
  buffer: Buffer,
  key: string
): Promise<string> {
  const result = await s3
    .upload({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    })
    .promise();

  return result.Location; // ✅ public URL
}
