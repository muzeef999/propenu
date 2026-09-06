const PROPERTY_TYPE_CATEGORY: Record<string, string> = {
  featuredprojects: "featured",
  residentials: "residential",
  commercials: "commercial",
  agriculturals: "agricultural",
  landplots: "land",
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

const pickNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const pickHeroImage = (property: any) =>
  pickString(
    property?.heroImage?.url,
    property?.heroImage,
    property?.gallery?.[0]?.url,
    property?.gallery?.[0],
  );

export const buildLeadPropertySnapshot = (
  property: any,
  propertyType?: string,
) => {
  if (!property) return undefined;

  return {
    title: pickString(property.title, property.projectName, property.buildingName),
    code: pickString(property.propertyCode),
    category: PROPERTY_TYPE_CATEGORY[String(propertyType || "").toLowerCase()] || "",
    state: pickString(property.state),
    city: pickString(property.city),
    locality: pickString(property.locality),
    slug: pickString(property.slug),
    heroImage: pickHeroImage(property),
    price: pickNumber(property.price),
    priceFrom: pickNumber(property.priceFrom),
    priceTo: pickNumber(property.priceTo),
    listingType: pickString(property.listingType),
    promotionType: pickString(property.promotion?.type),
    status: pickString(property.status),
  };
};
