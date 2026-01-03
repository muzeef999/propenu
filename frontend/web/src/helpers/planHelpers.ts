export type UserType = "buyer" | "builder" | "agent" | "owner";
export type Category = "rent" | "sell" | "both";

/**
 * Decide if FREE plan should be shown
 */
export function shouldShowFreePlan(
  userType: UserType,
  category: Category
): boolean {
  // Buyers get free plans
  if (userType === "buyer") return true;

  // Builders never get free plans
  if (userType === "builder") return false;

  // Agents – no free
  if (userType === "agent") return false;

  // Owners – no free (for now)
  if (userType === "owner") return false;

  return false;
}
