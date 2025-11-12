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
  if (typeof values.price !== "undefined")
    fd.append("price", String(values.price));
  if (typeof values.area !== "undefined")
    fd.append("area", String(values.area));
  if (values.facing) fd.append("facing", values.facing);

  // address: either append individually or send as JSON
  if (values.address) {
    if (values.address.addressLine)
      fd.append("address.addressLine", values.address.addressLine);
    if (values.address.city) fd.append("address.city", values.address.city);
    if (values.address.pincode)
      fd.append("address.pincode", values.address.pincode);
    if (Array.isArray(values.address.nearbyLandmarks)) {
      // Option A: append as separate fields:
      values.address.nearbyLandmarks.forEach((lm: string, i: number) =>
        fd.append(`address.nearbyLandmarks[${i}]`, lm)
      );
      // Option B: or append JSON (server must JSON.parse)
      // fd.append("address.nearbyLandmarks", JSON.stringify(values.address.nearbyLandmarks));
    }
  }

  // details and amenities as JSON strings
  if (values.details) fd.append("details", JSON.stringify(values.details));
  if (values.amenities)
    fd.append("amenities", JSON.stringify(values.amenities));

  // owner / refs
  if (values.createdBy) fd.append("createdBy", values.createdBy);
  if (values.createdByRole) fd.append("createdByRole", values.createdByRole);
  if (values.builder) fd.append("builder", values.builder);
  if (values.agent) fd.append("agent", values.agent);
  if (values.seller) fd.append("seller", values.seller);

  // files: imagesFiles and videosFiles (append each file with same key)
  if (files?.images) {
    files.images.forEach((f) => fd.append("imagesFiles", f, f.name));
  }
  if (files?.videos) {
    files.videos.forEach((f) => fd.append("videosFiles", f, f.name));
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
