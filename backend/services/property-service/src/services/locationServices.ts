import Location from "../models/locationModel";

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

  await Location.findOneAndUpdate(
    {
      city: cityName,
      state: stateName,
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
