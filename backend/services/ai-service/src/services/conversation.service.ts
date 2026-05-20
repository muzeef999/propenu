import express from "express";

const app = express();

app.use(express.json());


// ==============================
// MEMORY
// ==============================

let memory: any = {};


// ==============================
// EXTRACT FILTERS
// ==============================

function extractFilters(message: string) {

  const lower = message.toLowerCase();

  let intent = null;
  let propertyType = null;
  let budget = null;
  let city = null;
  let location = null;

  // -------------------
  // INTENT
  // -------------------

  if (
    lower.includes("buy") &&
    lower.includes("plot")
  ) {
    intent = "Buy Plot";
  }

  else if (lower.includes("buy")) {
    intent = "Buy Property";
  }

  else if (lower.includes("rent")) {
    intent = "Rent Property";
  }

  // -------------------
  // PROPERTY TYPE
  // -------------------

  if (lower.includes("plot")) {
    propertyType = "Plot";
  }

  else if (
    lower.includes("2bhk") ||
    lower.includes("3bhk") ||
    lower.includes("flat")
  ) {
    propertyType = "Apartment";
  }

  else if (lower.includes("villa")) {
    propertyType = "Villa";
  }

  // -------------------
  // BUDGET
  // -------------------

  if (
    lower.includes("under 50l") ||
    lower.includes("below 50l")
  ) {
    budget = "Under 50L";
  }

  else if (
    lower.includes("50l") &&
    lower.includes("1cr")
  ) {
    budget = "50L - 1Cr";
  }

  else if (
    lower.includes("1cr") &&
    lower.includes("2cr")
  ) {
    budget = "1Cr - 2Cr";
  }

  else if (
    lower.includes("2cr+") ||
    lower.includes("above 2cr")
  ) {
    budget = "2Cr+";
  }

  // -------------------
  // CITY
  // -------------------

  if (lower.includes("hyderabad")) {
    city = "Hyderabad";
  }

  // -------------------
  // LOCATION
  // -------------------

  if (lower.includes("orr")) {
    location = "ORR";
  }

  return {
    intent,
    propertyType,
    budget,
    city,
    location,
  };
}


// ==============================
// NEXT STEP
// ==============================

export function getNextStep(memory: any) {

  if (!memory.intent) {

    return {
      type: "question",

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
      type: "question",

      question:
        "Which property type do you prefer?",

      options: [
        "Apartment",
        "Villa",
        "Independent House",
        "Plot",
      ],
    };
  }

  if (!memory.budget) {

    return {
      type: "question",

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
      type: "question",

      question:
        "Which city are you searching in?",
    };
  }

  return null;
}


// ==============================
// CHAT API
// ==============================

app.post("/api/chat", (req, res) => {

  const { message } = req.body;

  // -----------------------------
  // EXTRACT USER DATA
  // -----------------------------

  const extracted = extractFilters(message);

  // -----------------------------
  // UPDATE MEMORY
  // -----------------------------

  memory = {
    ...memory,
    ...extracted,
  };

  console.log("MEMORY => ", memory);

  // -----------------------------
  // NEXT QUESTION
  // -----------------------------

  const nextStep = getNextStep(memory);

  if (nextStep) {
    return res.json(nextStep);
  }

  // -----------------------------
  // FINAL SEARCH
  // -----------------------------

  return res.json({
    type: "search",
    filters: memory,
  });
});


// ==============================
// START SERVER
// ==============================

app.listen(4006, () => {
  console.log("Server running on 4006");
});