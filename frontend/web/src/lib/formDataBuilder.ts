// lib/formDataBuilder.ts
export function buildPropertyFormData(
  values: any,
  files?: { images?: File[]; videos?: File[] }
) {
  const fd = new FormData();

  // simple scalar fields
  if (values.title) fd.append("title", values.title);
  if (values.description) fd.append("description", values.description);
  if (values.listingType) fd.append("listingType", values.listingType);
  if (values.category) fd.append("category", values.category);
  if (values.status) fd.append("status", values.status);
   if (values.status) fd.append("userId", values.userId);
  if (typeof values.price !== "undefined")
    fd.append("price", String(values.price));
  if (typeof values.area !== "undefined")
    fd.append("area", String(values.area));
  if (values.facing) fd.append("facing", values.facing);

  // === IMPORTANT: append address as a single JSON field ===
  if (values.address) {
    // Ensure nearbyLandmarks is an array (safety)
    const addr = { ...values.address };
    if (addr.nearbyLandmarks && !Array.isArray(addr.nearbyLandmarks)) {
      // if it's a comma-separated string, convert it
      if (typeof addr.nearbyLandmarks === "string") {
        addr.nearbyLandmarks = addr.nearbyLandmarks
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else {
        addr.nearbyLandmarks = [addr.nearbyLandmarks];
      }
    }
    fd.append("address", JSON.stringify(addr));
  }

  // details and amenities as JSON strings
  if (values.details) fd.append("details", JSON.stringify(values.details));
  if (values.amenities)
    fd.append("amenities", JSON.stringify(values.amenities));

  // owner / refs
  if (values.createdBy) fd.append("createdBy", values.createdBy);
  if (values.createdByRole) fd.append("createdByRole", values.createdByRole);
 

  // files: imagesFiles and videosFiles (append each file with same key)
  if (files?.images) {
    files.images.forEach((f) => fd.append("images", f, f.name));
  }
  if (files?.videos) {
    files.videos.forEach((f) => fd.append("videos", f, f.name));
  }

  // if you already have uploaded image metadata (S3 url/key) include as JSON:
  if (Array.isArray(values.images) && values.images.length > 0) {
    fd.append("imagesMeta", JSON.stringify(values.images));
  }
  if (Array.isArray(values.videos) && values.videos.length > 0) {
    fd.append("videosMeta", JSON.stringify(values.videos));
  }

  return fd;
}
