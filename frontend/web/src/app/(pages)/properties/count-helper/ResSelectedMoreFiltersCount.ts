import { residentialKeyMapping } from "@/types/residential";
import { ResidentialFilters } from "@/types/sharedTypes";

export const getSelectedMoreFiltersCount = (
  residential: ResidentialFilters
) => {
  let count = 0;

  Object.values(residentialKeyMapping).forEach((key) => {
    const value = residential[key as keyof ResidentialFilters];

    if (Array.isArray(value)) {
      count += value.length;
    } else if (typeof value === "boolean") {
      if (value) count += 1;
    } else if (value !== undefined && value !== null && value !== "") {
      count += 1;
    }
  });

  return count;
};
