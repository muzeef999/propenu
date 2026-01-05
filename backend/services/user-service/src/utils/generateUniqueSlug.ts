import mongoose from "mongoose";


export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}



export async function generateUniqueSlug(
  model: mongoose.Model<any>,
  baseSlug: string,
  currentId?: any
) {
  let slug = baseSlug;
  let counter = 1;

  while (
    await model.exists({
      slug,
      ...(currentId ? { _id: { $ne: currentId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}
