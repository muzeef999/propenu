import { redirect } from "next/navigation";

const CATEGORY_MAP: Record<string, string> = {
  agricultural: "agricultural",
  agriculture: "agricultural",
  commercial: "commercial",
  land: "land",
  plot: "land",
  plots: "land",
  residential: "residential",
};

type PropertiesCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function PropertiesCategoryPage({
  params,
}: PropertiesCategoryPageProps) {
  const { category } = await params;
  const normalizedCategory = category.trim().toLowerCase();
  const propertyType = CATEGORY_MAP[normalizedCategory] ?? normalizedCategory;

  redirect(`/properties?type=${encodeURIComponent(propertyType)}`);
}
