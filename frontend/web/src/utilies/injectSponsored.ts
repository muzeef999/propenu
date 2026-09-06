export function injectSponsored(list: any[], sponsored: any[], interval = 5) {
  const result = [];
  let sIndex = 0;

  for (const item of list) {
    if (
      result.length > 0 &&
      (result.length + 1) % interval === 0 &&
      sponsored[sIndex]
    ) {
      result.push({
        ...sponsored[sIndex],
        isSponsored: true
      });
      sIndex++;
    }

    result.push(item);
  }

  if (
    result.length > 0 &&
    (result.length + 1) % interval === 0 &&
    sponsored[sIndex]
  ) {
    result.push({
      ...sponsored[sIndex],
      isSponsored: true
    });
  }

  return result;
}
