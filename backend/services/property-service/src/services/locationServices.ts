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
  const existingCity = await Location.findOne({
    city: cityName,
    state: stateName,
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
      { _id: existingCity._id },
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
