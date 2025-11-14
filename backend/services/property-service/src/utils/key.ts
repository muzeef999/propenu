import crypto from "crypto";
export function buildS3Key(params: {
  type: "images" | "videos";
  propertyId?: string;
  ext: string; // ".png", ".mp4" etc.
}) {
  const id = crypto.randomUUID();
  const prefix = params.propertyId ? `${params.propertyId}/` : "";
  return `${params.type}/${prefix}${id}${params.ext}`;
}
