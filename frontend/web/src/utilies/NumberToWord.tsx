// utils/numberToWords.ts

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(num: number) {
  if (num < 20) return ones[num];
  return `${tens[Math.floor(num / 10)]} ${ones[num % 10]}`.trim();
}

function threeDigits(num: number) {
  if (num < 100) return twoDigits(num);
  return `${ones[Math.floor(num / 100)]} Hundred ${
    num % 100 ? twoDigits(num % 100) : ""
  }`.trim();
}

export function numberToWords(num: number): string {
  if (!num) return "";

  let result = "";

  if (num >= 10000000) {
    result += `${threeDigits(Math.floor(num / 10000000))} Crore `;
    num %= 10000000;
  }

  if (num >= 100000) {
    result += `${threeDigits(Math.floor(num / 100000))} Lakh `;
    num %= 100000;
  }

  if (num >= 1000) {
    result += `${threeDigits(Math.floor(num / 1000))} Thousand `;
    num %= 1000;
  }

  if (num > 0) {
    result += threeDigits(num);
  }

  return result.trim() + " Rupees";
}
