export function formatPrice(value?: number | string | null) {
  const numericValue =
    typeof value === "string"
      ? Number(value.replace(/[^\d.]/g, ""))
      : value;

  if (!numericValue || Number.isNaN(numericValue)) return null;
  if (numericValue >= 10000000) return `Rs ${(numericValue / 10000000).toFixed(1)} Cr`;
  if (numericValue >= 100000) return `Rs ${(numericValue / 100000).toFixed(0)} L`;
  return `Rs ${Math.round(numericValue).toLocaleString("en-IN")}`;
}

function formatPriceRange(min?: number | null, max?: number | null) {
  const minLabel = formatPrice(min);
  const maxLabel = formatPrice(max);

  if (minLabel && maxLabel && min !== max) return `${minLabel} - ${maxLabel}`;
  return minLabel || maxLabel;
}

function label(value?: string | null) {
  return value?.replace?.(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getPropertyTitle(property: any) {
  if (property.title) return property.title;

  const bhk = property.bhk || property.bedrooms;
  const propertyType =
    label(property.propertyType) ||
    label(property.propertySubType) ||
    "Property";

  return [bhk ? `${bhk} BHK` : null, propertyType]
    .filter(Boolean)
    .join(" ");
}

export function getPropertyLocation(property: any) {
  return [property.locality, property.city]
    .filter(Boolean)
    .join(", ");
}

function getArea(property: any) {
  if (property.builtUpArea) return `${property.builtUpArea} sq ft`;
  if (property.carpetArea) return `${property.carpetArea} sq ft`;
  if (property.plotArea) return `${property.plotArea} ${property.plotAreaUnit || "sqft"}`;
  if (property.totalArea?.value) return `${property.totalArea.value} ${property.totalArea.unit || ""}`.trim();
  if (property.projectArea) return `${property.projectArea} acres`;
  if (Array.isArray(property.projectSummary)) {
    const unit = property.projectSummary
      .flatMap((summary: any) => summary.units || [])
      .find((item: any) => item.minSqft || item.maxSqft);

    if (unit?.minSqft && unit?.maxSqft) return `${unit.minSqft} - ${unit.maxSqft} sq ft`;
    if (unit?.minSqft) return `${unit.minSqft} sq ft`;
  }
  return undefined;
}

function getCategory(property: any) {
  if (property.categoryType) return `${label(property.categoryType)} Project`;
  if (property.bhk || property.bedrooms) return "Residential";
  if (property.plotArea || property.readyToConstruct !== undefined) return "Land";
  if (property.cabins || property.seats || property.pantry) return "Commercial";
  if (property.totalArea || property.soilType || property.irrigationType) return "Agricultural";
  return "Property";
}

export function toPropertyCard(property: any) {
  const projectBhks = Array.isArray(property.projectSummary)
    ? property.projectSummary
        .map((summary: any) => summary.bhk)
        .filter((value: any) => Number(value) > 0)
    : [];

  return {
    id: String(property._id || property.id || property.slug || ""),
    title: getPropertyTitle(property),
    price: formatPrice(property.price) || formatPriceRange(property.priceFrom, property.priceTo),
    location: getPropertyLocation(property),
    bhk: property.bhk || property.bedrooms || projectBhks[0],
    area: getArea(property),
    category: getCategory(property),
    propertyType: label(property.propertyType || property.propertySubType),
    listingType: label(property.listingType),
    constructionStatus: label(property.constructionStatus),
    slug: property.slug,
  };
}
