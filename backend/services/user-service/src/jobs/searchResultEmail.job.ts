import cron from "node-cron";
import mongoose from "mongoose";
import User from "../models/userModel";
import { sendEmail } from "../../../../shared/email/email.service";
import { generateUnsubscribeToken } from "../utils/unsubscribeToken";

const TIMEZONE = "Asia/Kolkata";
const SCHEDULE_KEY = "search-results";
const MAX_SEND_DAYS = 4;
const MATCHES_PER_DAY = 4;
const PLATFORM_ROLES = ["user", "agent", "builder", "builder_staff"];
const WEBSITE = "https://propenu.com";

type SearchSettings = {
  locality: string;
  search: string;
  minPrice: number;
  maxPrice: number;
  city: string;
  category: string;
  listingType: string;
  pageUrl: string;
  sourceKey?: string;
};

type MatchCard = {
  key: string;
  title: string;
  kind: "Project" | "Property";
  place: string;
  priceLabel: string;
  imageUrl: string;
  url: string;
};

const COLLECTIONS: Array<{
  name: string;
  kind: "Project" | "Property";
  path: (slug: string) => string;
}> = [
  { name: "residentials", kind: "Property", path: (slug) => `/properties/residential/${slug}` },
  { name: "commercials", kind: "Property", path: (slug) => `/properties/commercial/${slug}` },
  { name: "landplots", kind: "Property", path: (slug) => `/properties/land/${slug}` },
  { name: "agriculturals", kind: "Property", path: (slug) => `/properties/agricultural/${slug}` },
  { name: "featuredprojects", kind: "Project", path: (slug) => `/project/${slug}` },
];

function istDay(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function priceLabel(amount: unknown) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 10000000) {
    const crore = value / 10000000;
    return `₹${crore >= 10 ? Math.round(crore) : crore.toFixed(1).replace(/\.0$/, "")} Cr`;
  }
  if (value >= 100000) return `₹${Math.round(value / 100000)} L`;
  return `₹${Math.round(value)}`;
}

function httpUrl(value: unknown): string {
  const url = typeof value === "string" ? value : (value as { url?: string } | null)?.url;
  return typeof url === "string" && /^https?:\/\//i.test(url) ? url.trim() : "";
}

function listingImage(doc: any) {
  return (
    httpUrl(doc?.heroImage) ||
    httpUrl(doc?.gallerySummary?.[0]?.url) ||
    httpUrl(doc?.gallery?.[0]?.url) ||
    httpUrl(doc?.gallery?.[0]) ||
    ""
  );
}

function parseSearch(pageUrl: unknown): SearchSettings | null {
  const raw = String(pageUrl || "").trim();
  if (!raw.includes("/properties")) return null;
  let url: URL;
  try {
    url = raw.startsWith("http") ? new URL(raw) : new URL(raw, "https://propenu.com");
  } catch {
    return null;
  }
  if (!url.pathname.startsWith("/properties")) return null;
  const locality = url.searchParams.get("locality")?.trim() || "";
  const search = url.searchParams.get("search")?.trim() || "";
  const minPrice = Number(url.searchParams.get("minPrice") || 0);
  const maxPrice = Number(url.searchParams.get("maxPrice") || 0);
  const hasBudget = (Number.isFinite(minPrice) && minPrice > 0) || (Number.isFinite(maxPrice) && maxPrice > 0);
  if (!locality && !search && !hasBudget) return null;
  return {
    locality,
    search,
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : 0,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : 0,
    city: url.searchParams.get("city")?.trim() || "",
    category: url.searchParams.get("category")?.trim() || "",
    listingType: url.searchParams.get("listingType")?.trim().toLowerCase() || "",
    pageUrl: `${url.pathname}${url.search}`,
  };
}

function searchKey(settings: SearchSettings) {
  return [
    settings.locality,
    settings.minPrice,
    settings.maxPrice,
    settings.search,
    settings.category,
    settings.listingType,
  ]
    .join("|")
    .toLowerCase();
}

const LISTING_COLLECTIONS = [
  { name: "residentials", category: "Residential" },
  { name: "commercials", category: "Commercial" },
  { name: "landplots", category: "Land" },
  { name: "agriculturals", category: "Agricultural" },
  { name: "featuredprojects", category: "Residential" },
];

const LISTING_PATHS: Array<{ pattern: RegExp; collection: string; category: string }> = [
  { pattern: /^\/properties\/residential\/([^/?#]+)/i, collection: "residentials", category: "Residential" },
  { pattern: /^\/properties\/commercial\/([^/?#]+)/i, collection: "commercials", category: "Commercial" },
  { pattern: /^\/properties\/land(?:ploat)?\/([^/?#]+)/i, collection: "landplots", category: "Land" },
  { pattern: /^\/properties\/agricultural\/([^/?#]+)/i, collection: "agriculturals", category: "Agricultural" },
  { pattern: /^\/(?:project|prime)\/([^/?#]+)/i, collection: "featuredprojects", category: "Residential" },
];

function bhkSearch(title: string) {
  const match = title.match(/(\d+)\s*bhk/i);
  return match ? `${match[1]} BHK` : "";
}

function settingsFromListing(doc: any, category: string, sourceKey: string): SearchSettings | null {
  const locality = String(doc?.locality || "").trim();
  const city = String(doc?.city || "").trim();
  const title = String(doc?.title || "").trim();
  const amount = priceOf(doc);
  if (!locality && !city) return null;
  const search = bhkSearch(title);
  const minPrice = amount > 0 ? Math.round(amount * 0.7) : 0;
  const maxPrice = amount > 0 ? Math.round(amount * 1.3) : 0;
  const listingType = String(doc?.listingType || "").trim().toLowerCase();
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (listingType) params.set("listingType", listingType);
  if (city) params.set("city", city);
  if (locality) params.set("locality", locality);
  if (minPrice) params.set("minPrice", String(minPrice));
  if (maxPrice) params.set("maxPrice", String(maxPrice));
  if (search) params.set("search", search);
  return {
    locality,
    search,
    minPrice,
    maxPrice,
    city,
    category,
    listingType,
    pageUrl: `/properties?${params.toString()}`,
    sourceKey,
  };
}

async function listingById(id: unknown) {
  const raw = String(id || "");
  if (!mongoose.Types.ObjectId.isValid(raw)) return null;
  const oid = new mongoose.Types.ObjectId(raw);
  for (const source of LISTING_COLLECTIONS) {
    const doc = await mongoose.connection.collection(source.name).findOne({ _id: oid });
    if (doc) return { doc, source, key: `${source.name}:${String(doc._id)}` };
  }
  return null;
}

async function listingFromAction(action: any) {
  const byProperty = await listingById(action?.propertyId);
  if (byProperty) return byProperty;
  const byProject = await listingById(action?.projectId);
  if (byProject) return byProject;
  const raw = String(action?.pageUrl || "");
  let pathname = raw.split("?")[0] || "";
  try {
    pathname = (raw.startsWith("http") ? new URL(raw) : new URL(raw, "https://propenu.com")).pathname;
  } catch {
    pathname = raw.split("?")[0] || "";
  }
  for (const route of LISTING_PATHS) {
    const match = pathname.match(route.pattern);
    const slug = match?.[1] ? decodeURIComponent(match[1]) : "";
    if (!slug) continue;
    const doc = await mongoose.connection.collection(route.collection).findOne({ slug });
    if (!doc) continue;
    return {
      doc,
      source: { name: route.collection, category: route.category },
      key: `${route.collection}:${String(doc._id)}`,
    };
  }
  return null;
}

async function resolveInterest(actions: any[]): Promise<SearchSettings | null> {
  const recent = Array.isArray(actions) ? actions.slice(0, 120) : [];
  for (const action of recent) {
    const fromSearch = parseSearch(action?.pageUrl);
    if (fromSearch) return fromSearch;
    const eventType = String(action?.eventType || "");
    if (eventType === "session_heartbeat" || eventType === "page_exit") continue;
    const listing = await listingFromAction(action);
    if (!listing) continue;
    const settings = settingsFromListing(listing.doc, listing.source.category, listing.key);
    if (settings) return settings;
  }
  return null;
}

function collectionsFor(category: string) {
  const name = category.toLowerCase();
  if (name.startsWith("resid")) {
    return COLLECTIONS.filter((item) => item.name === "residentials" || item.name === "featuredprojects");
  }
  if (name.startsWith("comm")) return COLLECTIONS.filter((item) => item.name === "commercials");
  if (name.startsWith("land")) return COLLECTIONS.filter((item) => item.name === "landplots");
  if (name.startsWith("agri")) return COLLECTIONS.filter((item) => item.name === "agriculturals");
  return COLLECTIONS;
}

function priceOf(doc: any) {
  const value = Number(doc?.price || doc?.priceFrom || 0);
  return Number.isFinite(value) ? value : 0;
}

function withinBudget(amount: number, settings: SearchSettings) {
  if (!settings.minPrice && !settings.maxPrice) return true;
  if (amount <= 0) return false;
  if (settings.minPrice && amount < settings.minPrice) return false;
  if (settings.maxPrice && amount > settings.maxPrice) return false;
  return true;
}

function titleMatches(title: string, search: string) {
  if (!search) return true;
  const words = search.toLowerCase().split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) return true;
  const haystack = title.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

function mixCards(cards: MatchCard[], into: MatchCard[]) {
  const properties = cards.filter((card) => card.kind === "Property");
  const projects = cards.filter((card) => card.kind === "Project");
  while (into.length < MATCHES_PER_DAY && (properties.length || projects.length)) {
    const property = properties.shift();
    if (property) into.push(property);
    if (into.length >= MATCHES_PER_DAY) break;
    const project = projects.shift();
    if (project) into.push(project);
  }
}

async function collectMatches(
  settings: SearchSettings,
  blocked: Set<string>,
  ownerId: string,
  taken: Set<string>,
  strict: boolean,
) {
  const localities = settings.locality
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const localityFilter = localities.length
    ? { $in: localities.map((item) => new RegExp(`^${escapeRegex(item)}$`, "i")) }
    : null;
  const cards: MatchCard[] = [];

  for (const source of collectionsFor(settings.category)) {
    const filter: Record<string, unknown> = { status: "active" };
    if (localityFilter) filter.locality = localityFilter;
    else if (settings.city) filter.city = new RegExp(`^${escapeRegex(settings.city)}$`, "i");
    if (settings.listingType && source.kind === "Property") filter.listingType = settings.listingType;
    const docs = await mongoose.connection
      .collection(source.name)
      .find(filter)
      .project({
        title: 1,
        slug: 1,
        city: 1,
        locality: 1,
        price: 1,
        priceFrom: 1,
        gallery: { $slice: 1 },
        gallerySummary: { $slice: 1 },
        heroImage: 1,
        createdBy: 1,
        updatedAt: 1,
      })
      .sort({ updatedAt: -1 })
      .limit(40)
      .toArray();

    for (const doc of docs) {
      const key = `${source.name}:${String(doc._id)}`;
      if (blocked.has(key) || taken.has(key)) continue;
      if (ownerId && String(doc.createdBy || "") === ownerId) continue;
      const title = String(doc.title || "").trim();
      const imageUrl = listingImage(doc);
      const slug = String(doc.slug || "").trim();
      if (!title || !imageUrl || !slug) continue;
      if (strict && !withinBudget(priceOf(doc), settings)) continue;
      if (strict && !titleMatches(title, settings.search)) continue;
      const amount = priceOf(doc);
      cards.push({
        key,
        title,
        kind: source.kind,
        place: [doc.locality, doc.city].filter(Boolean).join(", "),
        priceLabel: source.kind === "Project" && amount ? `from ${priceLabel(amount)}` : priceLabel(amount),
        imageUrl,
        url: `${WEBSITE}${source.path(slug)}`,
      });
    }
  }

  return cards;
}

async function findMatches(settings: SearchSettings, blocked: Set<string>, ownerId: string) {
  if (settings.sourceKey) blocked.add(settings.sourceKey);
  const mixed: MatchCard[] = [];
  mixCards(await collectMatches(settings, blocked, ownerId, new Set(), true), mixed);
  if (mixed.length < MATCHES_PER_DAY) {
    const taken = new Set(mixed.map((card) => card.key));
    mixCards(await collectMatches(settings, blocked, ownerId, taken, false), mixed);
  }
  return mixed;
}

function buildHtml(name: string, email: string, cards: MatchCard[], searchUrl: string) {
  const unsubscribeUrl = `${WEBSITE}/unsubscribe?email=${generateUnsubscribeToken(email)}`;
  const rows = cards
    .map(
      (card) => `<tr>
        <td style="padding:0 0 12px;">
          <a href="${escapeHtml(card.url)}" style="text-decoration:none;color:#111827;display:block;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;">
              <tr>
                <td width="84" valign="middle" style="padding:10px;">
                  <img src="${escapeHtml(card.imageUrl)}" alt="" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:8px;border:0;" />
                </td>
                <td valign="middle" style="padding:10px 12px 10px 0;">
                  <p style="margin:0 0 4px;font-size:15px;line-height:20px;font-weight:700;color:#111827;">${escapeHtml(card.title)}</p>
                  <p style="margin:0;font-size:13px;line-height:18px;color:#6b7280;">${escapeHtml(card.kind)}${card.place ? ` · ${escapeHtml(card.place)}` : ""}${card.priceLabel ? ` · ${escapeHtml(card.priceLabel)}` : ""}</p>
                </td>
              </tr>
            </table>
          </a>
        </td>
      </tr>`,
    )
    .join("");

  const icon = (href: string, src: string, alt: string) =>
    `<td style="padding:0 8px 0 0;"><a href="${href}" style="text-decoration:none;"><img src="${src}" alt="${alt}" width="32" height="32" style="display:block;width:32px;height:32px;border:0;" /></a></td>`;

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#edf3ef;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#edf3ef;padding:24px 12px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:30px;background-color:#ffffff;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td align="left" valign="middle">
              <img src="${WEBSITE}/email/propenu-logo.png" alt="Propenu" width="151" style="display:block;width:151px;max-width:151px;height:auto;border:0;" />
            </td>
            <td align="right" valign="middle">
              <table cellpadding="0" cellspacing="0" align="right"><tr>
                <td valign="middle" style="padding-right:10px;font-size:11px;line-height:16px;color:#9ca3af;white-space:nowrap;">Get the app from</td>
                <td width="22" height="26" valign="middle" align="center" style="width:22px;height:26px;">
                  <a href="https://apps.apple.com/in/app/propenu/id6762111856" style="text-decoration:none;"><img src="${WEBSITE}/email/apple.png" alt="App Store" width="22" height="26" style="display:block;width:22px;height:26px;border:0;" /></a>
                </td>
                <td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
                <td width="24" height="26" valign="middle" align="center" style="width:24px;height:26px;">
                  <a href="https://play.google.com/store/apps/details?id=com.propenu.app" style="text-decoration:none;"><img src="${WEBSITE}/email/playstore.png" alt="Google Play" width="24" height="26" style="display:block;width:24px;height:26px;border:0;" /></a>
                </td>
              </tr></table>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="height:1px;background:#eeeeee;font-size:0;">&nbsp;</td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 14px;font-size:16px;line-height:24px;">Hello ${escapeHtml(name)},</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:24px;color:#374151;">These listings follow your search settings: preferred locality first, then your budget, then the title.</p>
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;"><tr><td align="center">
            <a href="${escapeHtml(searchUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">Open this search</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:8px 28px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td valign="top" style="font-size:13px;color:#475569;">
              <p style="margin:0 0 4px;">Warm regards,</p>
              <p style="margin:0 0 4px;font-weight:700;color:#1f2937;">Propenu Team</p>
              <p style="margin:0;"><img src="${WEBSITE}/email/emailicon.png" alt="" width="16" height="16" style="vertical-align:middle;border:0;" /> <a href="mailto:marketingteam@propenu.com" style="color:#2563eb;text-decoration:none;">marketingteam@propenu.com</a></p>
            </td>
            <td valign="top" align="right">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;">Follow Us</p>
              <table cellpadding="0" cellspacing="0" align="right"><tr>
                ${icon("https://www.facebook.com/profile.php?id=61584609591479", `${WEBSITE}/email/facebook.png`, "Facebook")}
                ${icon("https://x.com/propenu", `${WEBSITE}/email/twitter.png`, "X")}
                ${icon("https://www.linkedin.com/company/propenu", `${WEBSITE}/email/linkedin.png`, "LinkedIn")}
                ${icon("https://www.instagram.com/propenu", `${WEBSITE}/email/instagram.png`, "Instagram")}
                ${icon("https://www.youtube.com/@Propenu", `${WEBSITE}/email/youtube.png`, "YouTube")}
              </tr></table>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 28px 22px;background:#f7faf8;border-top:1px solid #e5e7eb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#2fb35f;border-radius:8px;"><tr>
            <td valign="middle" style="padding:14px 10px 14px 16px;font-size:16px;line-height:20px;font-weight:700;color:#ffffff;">Download the Propenu App</td>
            <td valign="middle" align="right" width="276" style="width:276px;padding:12px 14px 12px 0;">
              <table cellpadding="0" cellspacing="0" align="right"><tr>
                <td valign="middle" width="128" style="width:128px;padding:0 8px 0 0;"><a href="https://play.google.com/store/apps/details?id=com.propenu.app" style="text-decoration:none;"><img src="${WEBSITE}/email/playstoreBadge.png" alt="Google Play" width="128" height="40" style="display:block;width:128px;height:40px;border:0;" /></a></td>
                <td valign="middle" width="128" style="width:128px;"><a href="https://apps.apple.com/in/app/propenu/id6762111856" style="text-decoration:none;"><img src="${WEBSITE}/email/appleBadge.png" alt="App Store" width="128" height="40" style="display:block;width:128px;height:40px;border:0;" /></a></td>
              </tr></table>
            </td>
          </tr></table>
          <table cellpadding="0" cellspacing="0" align="center" style="margin:18px auto 0;"><tr>
            <td style="padding:0 18px;font-size:12px;"><a href="${WEBSITE}/terms" style="color:#94a3b8;text-decoration:none;">Terms &amp; Conditions</a></td>
            <td style="padding:0 18px;font-size:12px;"><a href="${WEBSITE}/privacy-policy" style="color:#94a3b8;text-decoration:none;">Privacy Policy</a></td>
            <td style="padding:0 18px;font-size:12px;"><a href="${WEBSITE}/help-center" style="color:#94a3b8;text-decoration:none;">Contact Us</a></td>
          </tr></table>
          <table cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 0;"><tr>
            <td valign="middle" align="right"><a href="https://www.eteamworks.com/" style="text-decoration:none;"><img src="${WEBSITE}/email/teamworks.png" alt="Teamworks" width="104" height="48" style="display:block;width:104px;height:48px;border:0;" /></a></td>
            <td width="72" style="width:72px;font-size:0;line-height:0;">&nbsp;</td>
            <td valign="middle" align="left"><a href="https://www.aslijobs.com/" style="text-decoration:none;"><img src="${WEBSITE}/email/aslijobs.png" alt="Aslijobs" width="146" height="48" style="display:block;width:146px;height:48px;border:0;" /></a></td>
          </tr></table>
          <p style="margin:14px 0 0;text-align:center;font-size:13px;color:#475569;">Associated Businesses</p>
          <table cellpadding="0" cellspacing="0" align="center" style="margin:12px auto 0;"><tr><td align="center">
            <a href="${escapeHtml(unsubscribeUrl)}" style="display:inline-block;border:1px solid #d1d5db;background:#ffffff;color:#4b5563;font-size:13px;font-weight:600;text-decoration:none;padding:8px 18px;border-radius:8px;">Unsubscribe</a>
          </td></tr></table>
          <p style="margin:16px 0 0;text-align:center;font-size:10px;line-height:1.6;color:#94a3b8;">&copy; Propenu Solutions Private Limited<br />This email was sent as part of the Propenu launch partnership program.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function ensureIndex() {
  await mongoose.connection.collection("searchresultmails").createIndex(
    { userId: 1, sentOn: 1 },
    { unique: true, name: "one_search_mail_per_user_per_day" },
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const AUDIENCE =
  "Every end user, agent, builder, and builder staff who searched or opened a listing. One email a day, up to 4 cards, on propenu.com.";

type RepeatMode = "once" | "minute" | "hourly" | "daily" | "weekly" | "monthly";
type ScheduleView = {
  repeat: RepeatMode | "";
  runAt: string | null;
  hour: number;
  minute: number;
  weekday: number;
  dayOfMonth: number;
  label: string;
  summary: string;
  status: "scheduled" | "idle";
  timezone: "IST";
};

let jobRunning = false;
let pendingRunAt: Date | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let cronTask: { stop: () => void } | null = null;
let activeSchedule: ScheduleView = {
  repeat: "",
  runAt: null,
  hour: 17,
  minute: 20,
  weekday: 1,
  dayOfMonth: 1,
  label: "",
  summary: AUDIENCE,
  status: "idle",
  timezone: "IST",
};
const MAX_TIMER_MS = 2147483647;

function formatRunAt(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${read("day")}-${read("month")}-${read("year")} ${read("hour")}:${read("minute")}`;
}

function clearPendingTimer() {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
}

function stopArmed() {
  clearPendingTimer();
  cronTask?.stop();
  cronTask = null;
  pendingRunAt = null;
}

function clockLabel(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function wholeMinute(value: unknown) {
  const minute = Number(value);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return minute;
}

function wholeHour(value: unknown) {
  const hour = Number(value);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  return hour;
}

function monthDayLabel(day: number) {
  const teen = day % 100;
  if (teen >= 11 && teen <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

function describeSchedule(
  repeat: RepeatMode,
  hour: number,
  minute: number,
  weekday: number,
  dayOfMonth: number,
  runAt: Date | null,
) {
  if (repeat === "minute") return "Every minute";
  if (repeat === "hourly") return `Every hour at :${String(minute).padStart(2, "0")}`;
  if (repeat === "daily") return `Every day at ${clockLabel(hour, minute)}`;
  if (repeat === "weekly") return `Every ${WEEKDAYS[weekday] || "week"} at ${clockLabel(hour, minute)}`;
  if (repeat === "monthly") return `Every month on the ${monthDayLabel(dayOfMonth)} at ${clockLabel(hour, minute)}`;
  return runAt ? `Once on ${formatRunAt(runAt)}` : "Once";
}

function rememberSchedule(view: ScheduleView) {
  activeSchedule = view;
}

async function markSchedule(status: string, extra: Record<string, unknown> = {}) {
  await mongoose.connection.collection("searchresultschedule").updateOne(
    { key: SCHEDULE_KEY },
    { $set: { key: SCHEDULE_KEY, status, updatedAt: new Date(), ...extra } },
  );
}

function armOneShot(runAt: Date) {
  clearPendingTimer();
  pendingRunAt = runAt;
  const delay = runAt.getTime() - Date.now();
  if (delay <= 0) {
    pendingTimer = setTimeout(() => {
      void fireScheduledSend();
    }, 0);
    return;
  }
  pendingTimer = setTimeout(() => {
    if (delay > MAX_TIMER_MS) {
      armOneShot(runAt);
      return;
    }
    void fireScheduledSend();
  }, Math.min(delay, MAX_TIMER_MS));
}

async function fireScheduledSend() {
  clearPendingTimer();
  pendingRunAt = null;
  const claimed = await mongoose.connection.collection("searchresultschedule").updateOne(
    {
      key: SCHEDULE_KEY,
      status: "scheduled",
      $or: [{ repeat: "once" }, { repeat: { $exists: false } }],
    },
    { $set: { status: "running", startedAt: new Date() } },
  );
  if (!claimed.modifiedCount) return;
  try {
    const result = await runSearchResultEmailJob();
    await markSchedule("sent", { sentAt: new Date(), sentCount: result.sent });
    rememberSchedule({ ...activeSchedule, status: "idle", label: "", runAt: null });
    console.log(`[search-email] Scheduled send finished. Sent ${result.sent}`);
  } catch (error) {
    await markSchedule("scheduled");
    console.error("[search-email] Scheduled send failed:", error instanceof Error ? error.message : error);
  }
}

function armRecurring(expression: string) {
  if (!cron.validate(expression)) throw new Error("That time is not valid");
  cronTask = cron.schedule(
    expression,
    () => {
      void runSearchResultEmailJob();
    },
    { timezone: TIMEZONE },
  );
}

export function getSearchResultSchedule() {
  return activeSchedule;
}

export async function scheduleSearchResultSend(input: {
  repeat?: string;
  scheduleAt?: string;
  hour?: number;
  minute?: number;
  weekday?: number;
  dayOfMonth?: number;
}) {
  const repeat = String(input.repeat || "once") as RepeatMode;
  if (!["once", "minute", "hourly", "daily", "weekly", "monthly"].includes(repeat)) {
    throw new Error("Choose every minute, every day, every week, every month, or one time");
  }

  let runAt: Date | null = null;
  let hour = 17;
  let minute = 0;
  let weekday = 1;
  let dayOfMonth = 1;
  let expression = "";

  if (repeat === "once") {
    runAt = new Date(input.scheduleAt || "");
    if (Number.isNaN(runAt.getTime())) throw new Error("Choose a valid date and time");
    if (runAt.getTime() <= Date.now() + 15 * 1000) throw new Error("Choose a time in the future");
  } else if (repeat === "minute") {
    expression = "* * * * *";
  } else if (repeat === "hourly") {
    const picked = wholeMinute(input.minute);
    if (picked === null) throw new Error("Choose the minute of each hour");
    minute = picked;
    expression = `${minute} * * * *`;
  } else {
    const pickedHour = wholeHour(input.hour);
    const pickedMinute = wholeMinute(input.minute);
    if (pickedHour === null || pickedMinute === null) throw new Error("Choose a valid time");
    hour = pickedHour;
    minute = pickedMinute;
    if (repeat === "weekly") {
      weekday = Number(input.weekday);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new Error("Choose a day of the week");
      expression = `${minute} ${hour} * * ${weekday}`;
    } else if (repeat === "monthly") {
      dayOfMonth = Number(input.dayOfMonth);
      if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
        throw new Error("Choose a day from 1 to 28");
      }
      expression = `${minute} ${hour} ${dayOfMonth} * *`;
    } else {
      expression = `${minute} ${hour} * * *`;
    }
  }

  stopArmed();
  if (repeat === "once" && runAt) armOneShot(runAt);
  else armRecurring(expression);

  const label = describeSchedule(repeat, hour, minute, weekday, dayOfMonth, runAt);
  rememberSchedule({
    repeat,
    runAt: runAt ? runAt.toISOString() : null,
    hour,
    minute,
    weekday,
    dayOfMonth,
    label,
    summary: AUDIENCE,
    status: "scheduled",
    timezone: "IST",
  });
  await mongoose.connection.collection("searchresultschedule").updateOne(
    { key: SCHEDULE_KEY },
    {
      $set: {
        key: SCHEDULE_KEY,
        repeat,
        runAt,
        hour,
        minute,
        weekday,
        dayOfMonth,
        cron: expression,
        label,
        status: "scheduled",
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  console.log(`[search-email] Scheduled ${label}`);
  return getSearchResultSchedule();
}

export async function runSearchResultEmailJob() {
  if (jobRunning) return { sent: 0, alreadyRunning: true };
  jobRunning = true;
  const sentOn = istDay();
  console.log(`[search-email] Running for ${sentOn}`);
  try {
  await ensureIndex();
  const roles = await mongoose.connection
    .collection("roles")
    .find({ name: { $in: PLATFORM_ROLES } })
    .project({ _id: 1 })
    .toArray();
  const roleIds = roles.map((role) => role._id);
  if (!roleIds.length) return { sent: 0, alreadyRunning: false };

  const users = await User.find({
    roleId: { $in: roleIds },
    email: { $exists: true, $nin: [null, ""] },
    isUnsubscribedToEmail: { $ne: true },
    isActive: { $ne: false },
  })
    .select("name email")
    .lean();

  const mailLog = mongoose.connection.collection("searchresultmails");
  let sent = 0;

  for (const user of users) {
    const userId = String(user._id);
    try {
      const alreadyToday = await mailLog.findOne({ userId: user._id, sentOn, status: "sent" });
      if (alreadyToday) continue;

      const account = await mongoose.connection.collection("userinteractions").findOne(
        { userId: user._id, kind: "account" },
        { projection: { actions: 1 } },
      );
      const settings = await resolveInterest((account as any)?.actions || []);
      if (!settings) continue;

      const key = searchKey(settings);
      const previous = await mailLog
        .find({ userId: user._id, searchKey: key, status: "sent" })
        .project({ listingKeys: 1 })
        .toArray();
      if (previous.length >= MAX_SEND_DAYS) continue;
      const blocked = new Set<string>(previous.flatMap((row) => row.listingKeys || []));
      const cards = await findMatches(settings, blocked, userId);
      if (!cards.length) continue;

      const subject = "Listings that match your search settings";
      const html = buildHtml(user.name || "there", String(user.email || ""), cards, `${WEBSITE}${settings.pageUrl}`);
      const existing = await mailLog.findOne({ userId: user._id, sentOn });
      if (existing?.status === "sent") continue;
      if (existing?.status === "pending") {
        const age = Date.now() - new Date(existing.createdAt || 0).getTime();
        if (age < 15 * 60 * 1000) continue;
      }
      if (!existing) {
        try {
          await mailLog.insertOne({
            userId: user._id,
            sentOn,
            searchKey: key,
            status: "pending",
            listingKeys: cards.map((card) => card.key),
            createdAt: new Date(),
          });
        } catch (error: any) {
          if (error?.code === 11000) continue;
          throw error;
        }
      }

      await sendEmail(String(user.email), subject, html);
      await mailLog.updateOne(
        { userId: user._id, sentOn },
        { $set: { status: "sent", sentAt: new Date(), listingKeys: cards.map((card) => card.key) } },
      );
      await mongoose.connection.collection("emaillogs").insertOne({
        to: user.email,
        subject,
        html,
        status: "success",
        campaignId: `search-result-${userId}-${sentOn}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      sent += 1;
    } catch (error) {
      await mailLog.deleteOne({ userId: user._id, sentOn, status: "pending" }).catch(() => undefined);
      console.error(`[search-email] Failed for ${userId}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`[search-email] Sent ${sent}`);
  return { sent, alreadyRunning: false };
  } finally {
    jobRunning = false;
  }
}

export async function startSearchResultEmailJob() {
  try {
    const row = await mongoose.connection.collection("searchresultschedule").findOne({ key: SCHEDULE_KEY });
    if (row?.status !== "scheduled") return;
    const repeat = (row.repeat || (row.runAt ? "once" : "")) as RepeatMode;
    if (repeat === "once") {
      if (!row.runAt) return;
      const runAt = new Date(row.runAt);
      if (Number.isNaN(runAt.getTime())) return;
      const lateMs = Date.now() - runAt.getTime();
      if (lateMs > 6 * 60 * 60 * 1000) {
        await markSchedule("missed");
        console.log("[search-email] Saved schedule was missed and was not sent");
        return;
      }
      armOneShot(runAt);
    } else if (repeat === "minute" || repeat === "hourly" || repeat === "daily" || repeat === "weekly" || repeat === "monthly") {
      const expression = String(row.cron || "");
      if (!cron.validate(expression)) return;
      stopArmed();
      armRecurring(expression);
    } else {
      return;
    }
    rememberSchedule({
      repeat,
      runAt: row.runAt ? new Date(row.runAt).toISOString() : null,
      hour: Number(row.hour ?? 17),
      minute: Number(row.minute ?? 0),
      weekday: Number(row.weekday ?? 1),
      dayOfMonth: Number(row.dayOfMonth ?? 1),
      label: String(row.label || ""),
      summary: AUDIENCE,
      status: "scheduled",
      timezone: "IST",
    });
    console.log(`[search-email] Restored ${activeSchedule.label || repeat}`);
  } catch (error) {
    console.error(
      "[search-email] Could not read saved time:",
      error instanceof Error ? error.message : error,
    );
  }
}
