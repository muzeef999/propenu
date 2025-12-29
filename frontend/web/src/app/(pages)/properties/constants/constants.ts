// constants/budget.ts
export const BUDGET_MIN = 5; // 5 Lac
export const BUDGET_MAX = 5000; // 50 Cr (in Lac)
export const BUDGET_STEP = 5;

export const budgetOptions = [
  5, 10, 20, 30, 50, 75,
  100, 150, 200, 300, 400,
  500, 750, 1000, 2000, 3000, 4000, 5000,
];

export const formatBudget = (value: number) => {
  if (value >= 100)
    return `₹${value / 100}${value === 5000 ? "+" : ""} Cr`;
  return `₹${value} Lac`;
};




export const CARPET_MIN = 300;
export const CARPET_MAX = 10000;

export const carpetOptions = [
  300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000,
];