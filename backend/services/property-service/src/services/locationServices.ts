import Location from "../models/locationModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import FeaturedProject from "../models/featurePropertiesModel";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactCaseInsensitive(value: string) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
export async function upsertCityAndLocality({
  city,
  state,
  locality,
  coordinates,
}: {
  city?: string;
  state?: string;
  locality?: string;
  coordinates?: [number, number] | undefined;
}) {
  if (!city || !locality) return;

  const cityName = city.trim();
  const stateName = state?.trim() ?? null;
  const localityName = toTitleCase(locality);
  if (!cityName || !localityName) return;

  const existingCity = await Location.findOne({
    city: exactCaseInsensitive(cityName),
    ...(stateName === null
      ? { $or: [{ state: null }, { state: "" }, { state: { $exists: false } }] }
      : { state: exactCaseInsensitive(stateName) }),
  });

  if (existingCity) {
    const localityIndex = existingCity.localities.findIndex(
      (item: any) => item.name?.trim().toLowerCase() === localityName.toLowerCase(),
    );

    if (localityIndex >= 0) {
      const existingLocality = existingCity.localities[localityIndex];
      if (coordinates || existingLocality?.name !== localityName) {
        await Location.updateOne(
          {
            _id: existingCity._id,
            "localities.name": existingLocality?.name,
          },
          {
            $set: {
              "localities.$.name": localityName,
              ...(coordinates && {
                "localities.$.location": {
                  type: "Point",
                  coordinates,
                },
              }),
            },
          },
        );
      }
      return;
    }

    await Location.updateOne(
      {
        _id: existingCity._id,
        localities: {
          $not: {
            $elemMatch: { name: exactCaseInsensitive(localityName) },
          },
        },
      },
      {
        $push: {
          localities: {
            name: localityName,
            ...(coordinates && {
              location: {
                type: "Point",
                coordinates,
              },
            }),
          },
        },
      },
    );
    return;
  }

  await Location.findOneAndUpdate(
    {
      city: exactCaseInsensitive(cityName),
      ...(stateName === null
        ? { $or: [{ state: null }, { state: "" }, { state: { $exists: false } }] }
        : { state: exactCaseInsensitive(stateName) }),
    },
    {
      $setOnInsert: {
        city: cityName,
        state: stateName,
        category: "city",
      },
      $addToSet: {
        localities: {
          name: localityName,
          ...(coordinates && {
            location: {
              type: "Point",
              coordinates,
            },
          }),
        },
      },
    },
    {
      upsert: true,
      new: true,
    }
  );
}
export function shouldExposeLocalityFromListing(source: any) {
  return String(source?.status || "").trim().toLowerCase() === "active";
}

export async function upsertActiveListingCityAndLocality(source: any) {
  if (!shouldExposeLocalityFromListing(source)) return;
  if (!source?.city || !source?.locality) return;

  const coordinates = source.location?.coordinates;
  const localityCoordinates =
    Array.isArray(coordinates) && coordinates.length === 2
      ? ([Number(coordinates[0]), Number(coordinates[1])] as [number, number])
      : undefined;

  await upsertCityAndLocality({
    city: source.city,
    locality: source.locality,
    ...(source.state && { state: source.state }),
    ...(localityCoordinates && { coordinates: localityCoordinates }),
  });
}
type ActiveLocationEntry = {
  city: string;
  state: string | null;
  locality: string;
  coordinates?: [number, number] | undefined;
};

function activeLocationKey(city: string, state: string | null) {
  return `${city.trim().toLowerCase()}|${(state || "").trim().toLowerCase()}`;
}

function hasUsableCoordinates(coordinates?: [number, number]) {
  if (!coordinates) return false;
  const [lng, lat] = coordinates;
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

function toActiveLocationEntry(source: any): ActiveLocationEntry | null {
  if (!shouldExposeLocalityFromListing(source)) return null;

  const city = String(source?.city || "").trim();
  const locality = toTitleCase(String(source?.locality || ""));
  const state = source?.state ? String(source.state).trim() : null;
  if (!city || !locality) return null;

  const rawCoordinates = source?.location?.coordinates;
  const coordinates =
    Array.isArray(rawCoordinates) && rawCoordinates.length === 2
      ? ([Number(rawCoordinates[0]), Number(rawCoordinates[1])] as [number, number])
      : undefined;

  return {
    city,
    state,
    locality,
    ...(hasUsableCoordinates(coordinates) && { coordinates }),
  };
}

async function findActiveLocationEntries(model: any) {
  const docs = await model
    .find({ status: "active", city: { $exists: true, $ne: "" }, locality: { $exists: true, $ne: "" } })
    .select("city state locality location status")
    .lean();

  return docs
    .map(toActiveLocationEntry)
    .filter((entry: ActiveLocationEntry | null): entry is ActiveLocationEntry => Boolean(entry));
}

export async function getActiveLocationsFromListings() {
  const entries = (
    await Promise.all([
      findActiveLocationEntries(Residential),
      findActiveLocationEntries(Commercial),
      findActiveLocationEntries(LandPlot),
      findActiveLocationEntries(Agricultural),
      findActiveLocationEntries(FeaturedProject),
    ])
  ).flat();

  const activeByCity = new Map<string, {
    city: string;
    state: string | null;
    localities: Map<string, { name: string; location?: { type: "Point"; coordinates: [number, number] } }>;
  }>();

  for (const entry of entries) {
    const cityKey = activeLocationKey(entry.city, entry.state);
    const cityGroup = activeByCity.get(cityKey) ?? {
      city: entry.city,
      state: entry.state,
      localities: new Map<string, { name: string; location?: { type: "Point"; coordinates: [number, number] } }>(),
    };

    const localityKey = entry.locality.trim().toLowerCase();
    const existingLocality = cityGroup.localities.get(localityKey);
    if (!existingLocality) {
      cityGroup.localities.set(localityKey, {
        name: toTitleCase(entry.locality),
        ...(entry.coordinates && { location: { type: "Point", coordinates: entry.coordinates } }),
      });
    } else if (!existingLocality.location && entry.coordinates) {
      existingLocality.location = { type: "Point", coordinates: entry.coordinates };
    }

    activeByCity.set(cityKey, cityGroup);
  }

  return Array.from(activeByCity.values())
    .map((cityGroup) => ({
      _id: activeLocationKey(cityGroup.city, cityGroup.state),
      city: cityGroup.city,
      state: cityGroup.state,
      category: "city",
      localities: Array.from(cityGroup.localities.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }))
    .filter((location) => location.localities.length > 0)
    .sort((a, b) => a.city.localeCompare(b.city));
}
export async function syncLocationsFromActiveListings() {
  const entries = (
    await Promise.all([
      findActiveLocationEntries(Residential),
      findActiveLocationEntries(Commercial),
      findActiveLocationEntries(LandPlot),
      findActiveLocationEntries(Agricultural),
      findActiveLocationEntries(FeaturedProject),
    ])
  ).flat();

  const activeByCity = new Map<string, {
    city: string;
    state: string | null;
    localities: Map<string, { name: string; location?: { type: "Point"; coordinates: [number, number] } }>;
  }>();

  for (const entry of entries) {
    const cityKey = activeLocationKey(entry.city, entry.state);
    const cityGroup = activeByCity.get(cityKey) ?? {
      city: entry.city,
      state: entry.state,
      localities: new Map<string, { name: string; location?: { type: "Point"; coordinates: [number, number] } }>(),
    };

    const localityKey = entry.locality.trim().toLowerCase();
    const existingLocality = cityGroup.localities.get(localityKey);
    if (!existingLocality) {
      cityGroup.localities.set(localityKey, {
        name: toTitleCase(entry.locality),
        ...(entry.coordinates && { location: { type: "Point", coordinates: entry.coordinates } }),
      });
    } else if (!existingLocality.location && entry.coordinates) {
      existingLocality.location = { type: "Point", coordinates: entry.coordinates };
    }

    activeByCity.set(cityKey, cityGroup);
  }

  const existingCities = await Location.find();
  let updated = 0;
  let removedLocalities = 0;

  for (const cityDoc of existingCities) {
    const key = activeLocationKey(cityDoc.city, cityDoc.state ?? null);
    const activeCity = activeByCity.get(key);
    const nextLocalities = activeCity ? Array.from(activeCity.localities.values()) : [];

    if (cityDoc.localities.length !== nextLocalities.length) {
      removedLocalities += Math.max(0, cityDoc.localities.length - nextLocalities.length);
      cityDoc.localities = nextLocalities as any;
      await cityDoc.save();
      updated += 1;
      continue;
    }

    const currentNames = cityDoc.localities.map((locality: any) => String(locality.name || "").trim()).sort();
    const nextNames = nextLocalities.map((locality) => locality.name.trim()).sort();
    if (JSON.stringify(currentNames) !== JSON.stringify(nextNames)) {
      cityDoc.localities = nextLocalities as any;
      await cityDoc.save();
      updated += 1;
    }
  }

  for (const activeCity of activeByCity.values()) {
    const exists = existingCities.some(
      (cityDoc) => activeLocationKey(cityDoc.city, cityDoc.state ?? null) === activeLocationKey(activeCity.city, activeCity.state),
    );

    if (exists) continue;

    await Location.create({
      city: activeCity.city,
      state: activeCity.state,
      category: "city",
      localities: Array.from(activeCity.localities.values()),
    });
    updated += 1;
  }

  return {
    activeLocalities: entries.length,
    activeCities: activeByCity.size,
    updatedCities: updated,
    removedLocalities,
  };
}