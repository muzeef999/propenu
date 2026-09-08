export const BANNER_SLOTS = {
  desktop: { width: 1920, height: 600, label: "Desktop" },
  laptop: { width: 1440, height: 500, label: "Laptop" },
  tablet: { width: 1536, height: 768, label: "Tablet" },
  mobile: { width: 1080, height: 900, label: "Mobile" },
} as const;

export type BannerSlot = keyof typeof BANNER_SLOTS;

export const BANNER_SLOT_KEYS = Object.keys(BANNER_SLOTS) as BannerSlot[];

export const BANNER_MAX_BYTES = 1 * 1024 * 1024; // 1 MB
export const LOGO_MAX_BYTES = 1 * 1024 * 1024; // 1 MB
export const LOGO_ASPECT_RATIO = 167 / 50; // ~3.34:1
export const LOGO_ASPECT_TOLERANCE = 0.12;

/** Allow ±4px drift from recommended banner sizes */
export const BANNER_SIZE_TOLERANCE_PX = 4;
