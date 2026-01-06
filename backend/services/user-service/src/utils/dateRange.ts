export function getFromDate(range: string) {
  const now = new Date();

  switch (range) {
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "30d":
      return new Date(now.setDate(now.getDate() - 30));
    case "6m":
      return new Date(now.setMonth(now.getMonth() - 6));
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}
