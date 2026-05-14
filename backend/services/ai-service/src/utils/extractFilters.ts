export function extractFilters(
  message: string
) {

  const filters: any = {};

  // CITY
  const cityMatch =
    message.match(
      /in\s+([a-zA-Z\s]+)/i
    );

  if (cityMatch && cityMatch[1]) {
    filters.city =
      cityMatch[1].trim();
  }

  // BHK
  const bhkMatch =
    message.match(/(\d+)\s*bhk/i);

  if (bhkMatch) {
    filters.bhk =
      Number(bhkMatch[1]);
  }

  // PRICE
  const croreMatch =
    message.match(/(\d+)\s*crore/i);

  if (croreMatch) {
    filters.maxPrice =
      Number(croreMatch[1]) * 10000000;
  }

  // PROPERTY TYPES
  if (/villa/i.test(message)) {
    filters.propertyType = "villa";
  }

  if (/apartment|flat/i.test(message)) {
    filters.propertyType =
      "apartment";
  }

  if (/plot/i.test(message)) {
    filters.propertyCategory =
      "land";
  }

  return filters;
}