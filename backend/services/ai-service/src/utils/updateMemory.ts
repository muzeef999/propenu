export function updateMemory(
  memory: any,
  message: string
) {

  const lower =
    message.toLowerCase();

  // INTENT
  if (
    lower.includes("buy")
  ) {

    memory.intent =
      "buy";
  }

  if (
    lower.includes("rent")
  ) {

    memory.intent =
      "rent";
  }

  // PROPERTY TYPE
  if (
    lower.includes("villa")
  ) {

    memory.propertyType =
      "villa";
  }

  if (
    lower.includes("apartment")
  ) {

    memory.propertyType =
      "apartment";
  }

  if (
    lower.includes("plot")
  ) {

    memory.propertyType =
      "plot";
  }

  // CITY
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

  // BUDGET
  if (
    lower.includes("1cr")
  ) {

    memory.budget =
      "1Cr";
  }

  return memory;
}