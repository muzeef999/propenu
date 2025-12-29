export type CountableFilterValue =
  | string
  | string[]
  | boolean
  | number
  | undefined
  | null;

/**
 * Generic helper for Residential / Commercial / Land / Agricultural
 */
export function getSelectedMoreFiltersCount<
  T extends object
>(
  filters: T,
  keyMapping: Record<string, keyof T>
): number {
  let count = 0;

  Object.values(keyMapping).forEach((key) => {
    const value = filters[key] as CountableFilterValue;

    if (Array.isArray(value)) {
      count += value.length;
    } else if (typeof value === "boolean") {
      if (value) count += 1;
    } else if (value !== undefined && value !== null && value !== "") {
      count += 1;
    }
  });

  return count;
}
