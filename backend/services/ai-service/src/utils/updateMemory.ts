export function updateMemory(
  memory: any,
  message: string
) {

  const lower =
    message.toLowerCase();

  // =========================
  // INTENT
  // =========================

  if (
    lower.includes("buy")
  ) {

    memory.intent = "buy";
  }

  if (
    lower.includes("rent")
  ) {

    memory.intent = "rent";
  }

  if (
    lower.includes("lease")
  ) {

    memory.intent = "lease";
  }

  // =========================
  // PROPERTY TYPE
  // =========================

  if (
    lower.includes("villa") ||
    lower.includes("villas")
  ) {

    memory.propertyType =
      "villa";

    memory.propertyCategory =
      "residential";
  }

  if (
    lower.includes("apartment") ||
    lower.includes("apartments") ||
    lower.includes("flat") ||
    lower.includes("flats")
  ) {

    memory.propertyType =
      "apartment";

    memory.propertyCategory =
      "residential";
  }

  if (
    lower.includes("plot") ||
    lower.includes("plots")
  ) {

    memory.propertyType =
      "plot";

    memory.propertyCategory =
      "land";
  }

  if (
    lower.includes("commercial")
  ) {

    memory.propertyCategory =
      "commercial";
  }

  if (
    lower.includes("office")
  ) {

    memory.propertyType =
      "office";

    memory.propertyCategory =
      "commercial";
  }

  if (
    lower.includes("shop")
  ) {

    memory.propertyType =
      "shop";

    memory.propertyCategory =
      "commercial";
  }

  // =========================
  // CITY
  // =========================

  if (
    lower.includes("hyderabad")
  ) {

    memory.city =
      "Hyderabad";
  }

  if (
    lower.includes("bangalore")
  ) {

    memory.city =
      "Bangalore";
  }

  if (
    lower.includes("mumbai")
  ) {

    memory.city =
      "Mumbai";
  }

  if (
    lower.includes("pune")
  ) {

    memory.city =
      "Pune";
  }

  // =========================
  // LOCALITY
  // =========================

  if (
    lower.includes("orr")
  ) {

    memory.locality =
      "ORR";
  }

  if (
    lower.includes("kokapet")
  ) {

    memory.locality =
      "Kokapet";
  }

  if (
    lower.includes("tellapur")
  ) {

    memory.locality =
      "Tellapur";
  }

  if (
    lower.includes("whitefield")
  ) {

    memory.locality =
      "Whitefield";
  }

  // =========================
  // BHK
  // =========================

  if (
    lower.includes("1bhk")
  ) {

    memory.bhk = 1;
  }

  if (
    lower.includes("2bhk")
  ) {

    memory.bhk = 2;
  }

  if (
    lower.includes("3bhk")
  ) {

    memory.bhk = 3;
  }

  if (
    lower.includes("4bhk")
  ) {

    memory.bhk = 4;
  }

  // =========================
  // BUDGET
  // =========================

  if (
    lower.includes("under 50l") ||
    lower.includes("under 50 l") ||
    lower.includes("50l") ||
    lower.includes("50 l")
  ) {

    memory.budget =
      "Under 50L";

    memory.maxPrice =
      5000000;
  }

  else if (
    lower.includes("1cr") ||
    lower.includes("1 cr")
  ) {

    memory.budget =
      "50L - 1Cr";

    memory.maxPrice =
      10000000;
  }

  else if (
    lower.includes("2cr") ||
    lower.includes("2 cr")
  ) {

    memory.budget =
      "1Cr - 2Cr";

    memory.maxPrice =
      20000000;
  }

  else if (
    lower.includes("3cr") ||
    lower.includes("3 cr")
  ) {

    memory.budget =
      "2Cr - 3Cr";

    memory.maxPrice =
      30000000;
  }

  // =========================
  // PROPERTY STATUS
  // =========================

  if (
    lower.includes("new launch")
  ) {

    memory.status =
      "new_launch";
  }

  if (
    lower.includes("ready to move")
  ) {

    memory.status =
      "ready_to_move";
  }

  // =========================
  // RETURN MEMORY
  // =========================

  return memory;
}