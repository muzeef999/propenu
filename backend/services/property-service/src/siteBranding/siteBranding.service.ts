import { Types } from "mongoose";
import { uploadFile } from "../utils/uploadFile";
import { SiteBanner, emptyDevices, ISiteBanner } from "./siteBanner.model";
import { SiteLogo } from "./siteLogo.model";
import {
  BANNER_SLOT_KEYS,
  BANNER_SLOTS,
  BannerSlot,
} from "./siteBranding.constants";
import {
  assertBannerDimensions,
  assertLogoAspectRatio,
  assertLogoFile,
  assertWebpFile,
  isLogoVideoFile,
  normalizeClickUrl,
  normalizeLocation,
  normalizePriority,
  normalizeTextBlock,
  resolveLogoMimeType,
} from "./siteBranding.validation";

type MulterFiles = {
  [fieldname: string]: Express.Multer.File[];
};

function isBannerSlot(value: string): value is BannerSlot {
  return (BANNER_SLOT_KEYS as string[]).includes(value);
}

/** Normalize legacy flat banners → devices shape for API responses. */
export function normalizeBannerDoc(raw: any) {
  if (!raw) return null;
  const obj = typeof raw.toObject === "function" ? raw.toObject() : { ...raw };

  if (obj.devices && typeof obj.devices === "object") {
    const devices = emptyDevices();
    for (const slot of BANNER_SLOT_KEYS) {
      const d = obj.devices[slot] || {};
      devices[slot] = {
        image: String(d.image || ""),
        clickUrl: String(d.clickUrl || ""),
        heading: {
          enabled: d.heading?.enabled !== false,
          html: String(d.heading?.html || ""),
        },
        subheading: {
          enabled: d.subheading?.enabled !== false,
          html: String(d.subheading?.html || ""),
        },
        location: {
          state: String(d.location?.state || ""),
          city: String(d.location?.city || ""),
          locality: String(d.location?.locality || ""),
          subLocality: String(d.location?.subLocality || ""),
        },
      };
    }
    return {
      ...obj,
      devices,
      savedDevices: BANNER_SLOT_KEYS.filter((s) => Boolean(devices[s]?.image)),
    };
  }

  // Legacy: images + shared heading/location/clickUrl
  const devices = emptyDevices();
  const sharedClick = String(obj.clickUrl || "");
  const sharedHeading = {
    enabled: obj.heading?.enabled !== false,
    html: String(obj.heading?.html || ""),
  };
  const sharedSub = {
    enabled: obj.subheading?.enabled !== false,
    html: String(obj.subheading?.html || ""),
  };
  const sharedLoc = {
    state: String(obj.location?.state || ""),
    city: String(obj.location?.city || ""),
    locality: String(obj.location?.locality || ""),
    subLocality: String(obj.location?.subLocality || ""),
  };
  for (const slot of BANNER_SLOT_KEYS) {
    const image = String(obj.images?.[slot] || "");
    if (!image) continue;
    devices[slot] = {
      image,
      clickUrl: sharedClick,
      heading: { ...sharedHeading },
      subheading: { ...sharedSub },
      location: { ...sharedLoc },
    };
  }

  return {
    _id: obj._id,
    title: obj.title,
    priority: obj.priority ?? 0,
    devices,
    savedDevices: BANNER_SLOT_KEYS.filter((s) => Boolean(devices[s]?.image)),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
    updatedBy: obj.updatedBy,
  };
}

export async function getSiteLogo() {
  const doc = await SiteLogo.findOne().sort({ updatedAt: -1 }).lean();
  return doc || null;
}

export async function upsertSiteLogo(
  file: Express.Multer.File,
  userId?: string,
): Promise<{ data: any; created: boolean }> {
  assertLogoFile(file);

  // Images: exact GIF sizes (220×80 / 300×120 / 500×165) or ~3.34:1; videos skip.
  if (!isLogoVideoFile(file)) {
    try {
      await assertLogoAspectRatio(file.buffer);
    } catch (error: any) {
      // SVG without intrinsic size: allow if sharp cannot read dimensions.
      const msg = String(error?.message || "");
      const isSvg =
        resolveLogoMimeType(file) === "image/svg+xml" ||
        String(file.originalname || "")
          .toLowerCase()
          .endsWith(".svg");
      if (!(isSvg && /could not read image dimensions/i.test(msg))) {
        throw error;
      }
    }
  }

  const mimetype = resolveLogoMimeType(file);
  const uploaded = await uploadFile({
    buffer: file.buffer,
    originalName: file.originalname || `logo${getLogoExtensionSafe(file)}`,
    mimetype,
    folder: "site/logo",
  });

  const updatedBy = userId ? new Types.ObjectId(userId) : undefined;
  const existing = await SiteLogo.findOne().sort({ updatedAt: -1 });

  if (existing) {
    existing.logoUrl = uploaded.url;
    if (updatedBy) existing.updatedBy = updatedBy;
    await existing.save();
    return { data: existing.toObject(), created: false };
  }

  const created = await SiteLogo.create({
    logoUrl: uploaded.url,
    updatedBy,
  });
  return { data: created.toObject(), created: true };
}

function getLogoExtensionSafe(file: Express.Multer.File) {
  const name = String(file.originalname || "").toLowerCase();
  const match = name.match(/(\.[a-z0-9]+)$/);
  if (match) return match[1];
  if (mimetypeLooksVideo(file.mimetype)) return ".mp4";
  return ".png";
}

function mimetypeLooksVideo(mime?: string) {
  return String(mime || "").toLowerCase().startsWith("video/");
}

export async function listSiteBanners() {
  const rows = await SiteBanner.find().sort({ priority: -1, updatedAt: -1 }).lean();
  return rows.map(normalizeBannerDoc);
}

export async function getSiteBannerById(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await SiteBanner.findById(id).lean();
  return normalizeBannerDoc(doc);
}

function deviceMatchesLocation(
  location: { state?: string; city?: string; locality?: string; subLocality?: string },
  query: {
    state?: string;
    city?: string;
    locality?: string;
    subLocality?: string;
  },
) {
  const bState = String(location?.state || "").trim().toLowerCase();
  const bCity = String(location?.city || "").trim().toLowerCase();
  const bLocality = String(location?.locality || "").trim().toLowerCase();
  const bSub = String(location?.subLocality || "").trim().toLowerCase();
  const state = String(query.state || "").trim().toLowerCase();
  const city = String(query.city || "").trim().toLowerCase();
  const locality = String(query.locality || "").trim().toLowerCase();
  const subLocality = String(query.subLocality || "").trim().toLowerCase();

  if (!bState && !bCity && !bLocality && !bSub) return true;
  if (bState && state && bState !== state) return false;
  if (bState && !state) return false;
  if (bCity && city && bCity !== city) return false;
  if (bCity && !city) return false;
  if (bLocality && locality && bLocality !== locality) return false;
  if (bLocality && !locality) return false;
  if (bSub && subLocality && bSub !== subLocality) return false;
  if (bSub && !subLocality) return false;
  return true;
}

export async function resolveSiteBanners(query: {
  state?: string;
  city?: string;
  locality?: string;
  subLocality?: string;
  device?: string;
}) {
  const banners = await listSiteBanners();
  const device = String(query.device || "").toLowerCase();
  const slots = isBannerSlot(device) ? [device] : BANNER_SLOT_KEYS;

  return banners
    .map((banner) => {
      const matched: Partial<Record<BannerSlot, any>> = {};
      for (const slot of slots) {
        const block = banner?.devices?.[slot];
        if (!block?.image) continue;
        if (!deviceMatchesLocation(block.location, query)) continue;
        matched[slot] = block;
      }
      if (!Object.keys(matched).length) return null;
      return {
        _id: banner._id,
        title: banner.title,
        priority: banner.priority,
        devices: matched,
      };
    })
    .filter(Boolean);
}

export async function createSiteBanner(
  body: Record<string, unknown>,
  userId?: string,
) {
  const title = String(body.title || "").trim();
  if (!title) throw new Error("Title is required");
  const priority = normalizePriority(body.priority);

  const doc = await SiteBanner.create({
    title,
    priority,
    devices: emptyDevices(),
    createdBy: userId ? new Types.ObjectId(userId) : undefined,
    updatedBy: userId ? new Types.ObjectId(userId) : undefined,
  });

  return normalizeBannerDoc(doc);
}

export async function updateSiteBannerMeta(
  id: string,
  body: Record<string, unknown>,
  userId?: string,
) {
  const existing = (await SiteBanner.findById(id)) as ISiteBanner | null;
  if (!existing) return null;

  if (body.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) throw new Error("Title is required");
    existing.title = title;
  }
  if (body.priority !== undefined) {
    existing.priority = normalizePriority(body.priority);
  }
  if (userId) existing.updatedBy = new Types.ObjectId(userId);
  await existing.save();
  return normalizeBannerDoc(existing);
}

export async function upsertBannerDevice(
  id: string,
  slotRaw: string,
  body: Record<string, unknown>,
  file: Express.Multer.File | undefined,
  userId?: string,
) {
  if (!isBannerSlot(slotRaw)) {
    throw new Error(`Invalid device slot. Use: ${BANNER_SLOT_KEYS.join(", ")}`);
  }
  const slot = slotRaw;

  const existing = (await SiteBanner.findById(id)) as ISiteBanner | null;
  if (!existing) return null;

  if (!existing.devices) {
    existing.set("devices", emptyDevices());
  }

  const current = (existing.devices as any)[slot] || emptyDevices()[slot];
  let imageUrl = String(current.image || "");

  if (file) {
    assertWebpFile(file, BANNER_SLOTS[slot].label);
    await assertBannerDimensions(file.buffer, slot);
    const uploaded = await uploadFile({
      buffer: file.buffer,
      originalName: file.originalname || `${slot}.webp`,
      mimetype: "image/webp",
      folder: `site/banners/${slot}`,
    });
    imageUrl = uploaded.url;
  }

  if (!imageUrl) {
    throw new Error(`${BANNER_SLOTS[slot].label} image is required`);
  }

  const clickUrl = normalizeClickUrl(body.clickUrl ?? current.clickUrl, {
    optional: true,
  });
  const location = normalizeLocation({
    state: body.state !== undefined ? body.state : current.location?.state,
    city: body.city !== undefined ? body.city : current.location?.city,
    locality:
      body.locality !== undefined ? body.locality : current.location?.locality,
    subLocality:
      body.subLocality !== undefined || body.sub_locality !== undefined
        ? body.subLocality ?? body.sub_locality
        : current.location?.subLocality,
  });
  const heading = normalizeTextBlock(body, "heading", current.heading);
  const subheading = normalizeTextBlock(body, "subheading", current.subheading);

  (existing.devices as any)[slot] = {
    image: imageUrl,
    clickUrl,
    heading,
    subheading,
    location,
  };
  existing.markModified("devices");
  if (userId) existing.updatedBy = new Types.ObjectId(userId);
  await existing.save();
  return normalizeBannerDoc(existing);
}

export async function clearBannerDevice(
  id: string,
  slotRaw: string,
  userId?: string,
) {
  if (!isBannerSlot(slotRaw)) {
    throw new Error(`Invalid device slot. Use: ${BANNER_SLOT_KEYS.join(", ")}`);
  }
  const existing = (await SiteBanner.findById(id)) as ISiteBanner | null;
  if (!existing) return null;
  if (!existing.devices) existing.set("devices", emptyDevices());
  (existing.devices as any)[slotRaw] = emptyDevices()[slotRaw];
  existing.markModified("devices");
  if (userId) existing.updatedBy = new Types.ObjectId(userId);
  await existing.save();
  return normalizeBannerDoc(existing);
}

export async function deleteSiteBanner(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return SiteBanner.findByIdAndDelete(id).lean();
}

/** @deprecated legacy helpers kept for route compile during transition */
export async function createSiteBannerLegacy() {
  throw new Error("Use create banner shell + device upsert APIs");
}
