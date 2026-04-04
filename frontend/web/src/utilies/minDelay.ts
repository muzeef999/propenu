export const MIN_SECTION_SKELETON_MS = 1200;

export function minDelay(ms: number = MIN_SECTION_SKELETON_MS) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
