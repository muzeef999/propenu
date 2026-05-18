import Location from "../models/locationModel";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactCaseInsensitive(value: string) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
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
  coordinates?: [number, number];
}) {
  if (!city || !locality) return;

  const cityName = city.trim();
  const stateName = state?.trim() ?? null;
  const localityName = locality.trim();
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
      if (coordinates) {
        await Location.updateOne(
          {
            _id: existingCity._id,
            "localities.name": existingLocality?.name,
          },
          {
            $set: {
              "localities.$.location": {
                type: "Point",
                coordinates,
              },
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
