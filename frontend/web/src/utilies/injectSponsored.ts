export function injectSponsored(list: any[], sponsored: any[], interval = 5) {
  const result = [];
  let sIndex = 0;

  for (let i = 0; i < list.length; i++) {
    result.push(list[i]);

    if ((i + 1) % interval === 0 && sponsored[sIndex]) {
      result.push({
        ...sponsored[sIndex],
        isSponsored: true
      });
      sIndex++;
    }
  }

  return result;
}