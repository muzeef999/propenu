import { z } from "zod";

export const basicDetailsSchema = z.object({
  listingType: z.enum(["sell", "rent", "buy"], {
    message: "Listing type is required",
  }),

  propertyType: z.enum(["residential", "commercial", "land", "agricultural"], {
    message: "Listing type is required",
  }),

  title: z
    .string()
    .trim()
    .min(10, "Property title must be at least 10 characters"),

  totalPrice: z.coerce.number().positive("Total price must be greater than 0"),

  areaSqft: z.coerce.number().positive("Area must be greater than 0"),

  description: z
    .string()
    .trim()
    .min(50, "Description must be at least 50 characters")
    .max(500, "Description cannot exceed 500 characters"),

  images: z.array(z.instanceof(File)).min(5, "Upload at least 5 images"),
});


export type BasicDetailsForm = z.infer<typeof basicDetailsSchema>;


export const validateBasicDetails = (
  base: any,
  propertyType: string,
  files: { file: File }[]
) => {
  return basicDetailsSchema.safeParse({
    listingType: base.listingType,
    propertyType,
    title: base.title,
    totalPrice: base.totalPrice,
    areaSqft: base.area,
    description: base.description,
    images: files.map((f) => f.file),
  });
};