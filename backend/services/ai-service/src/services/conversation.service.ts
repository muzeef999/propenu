export function getNextStep(
  memory: any
) {

  if (!memory.intent) {

    return {
      question:
        "What are you looking for?",

      options: [
        "Buy Property",
        "Rent Property",
        "Buy Commercial",
        "Lease Commercial",
        "Buy Plot",
      ],
    };
  }

  if (!memory.propertyType) {

    return {
      question:
        "Which property type do you prefer?",

      options: [
        "Apartment",
        "Villa",
        "Independent House",
        "Plot",
        "New Launch",
      ],
    };
  }

  if (!memory.budget) {

    return {
      question:
        "What is your budget range?",

      options: [
        "Under 50L",
        "50L - 1Cr",
        "1Cr - 2Cr",
        "2Cr+",
      ],
    };
  }

  if (!memory.city) {

    return {
      question:
        "Which city are you searching in?",
    };
  }

  return null;
}