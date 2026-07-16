import { getLocalityOptions } from "./suggestion.service";

export async function getNextStep(memory: any) {
  if (memory.keyword) {
    return null;
  }

  if (!memory.intent) {
    const options = memory.bhk
      ? [
          `Buy ${memory.bhk} BHK`,
          `Rent ${memory.bhk} BHK`,
          "Show ready to move",
          "Near metro",
        ]
      : memory.propertyCategory === "land"
        ? ["Buy Plot", "Investment Plot", "Farm Land", "Near ORR"]
        : memory.propertyCategory === "commercial"
          ? ["Buy Commercial", "Lease Commercial", "Office Space", "Retail Shop"]
          : [
              "Buy Property",
              "Rent Property",
              "Buy Commercial",
              "Lease Commercial",
              "Buy Plot",
            ];

    return {
      type: "question",
      question: "What would you like to do?",
      options,
    };
  }

  if (!memory.quickSearch && !memory.propertyType && memory.propertyCategory !== "commercial") {
    const options = memory.bhk
      ? [`${memory.bhk} BHK Apartment`, `${memory.bhk} BHK Villa`, "Independent House", "Show all homes"]
      : memory.intent === "rent"
        ? ["Apartment", "Villa", "Independent House", "Gated Community"]
        : ["Apartment", "Villa", "Independent House", "Plot"];

    return {
      type: "question",
      question: "Which property type do you prefer?",
      options,
    };
  }

  if (!memory.quickSearch && !memory.budget) {
    const options =
      memory.intent === "rent"
        ? ["Under 25K", "25K - 50K", "50K - 1L", "1L+"]
        : memory.propertyCategory === "land"
          ? ["Under 50L", "50L - 1Cr", "1Cr - 2Cr", "2Cr+"]
          : ["Under 50L", "50L - 1Cr", "1Cr - 2Cr", "2Cr+"];

    return {
      type: "question",
      question: "What is your budget range?",
      options,
    };
  }

  if (!memory.city) {
    return {
      type: "question",
      question: "Which city are you searching in?",
      options: ["Hyderabad", "Bangalore", "Mumbai", "Pune"],
    };
  }

  if (!memory.locality) {
    const localityOptions = await getLocalityOptions(memory);

    if (localityOptions.length) {
      return {
        type: "question",
        question: "Which locality should I focus on?",
        options: localityOptions,
      };
    }
  }

  return null;
}
