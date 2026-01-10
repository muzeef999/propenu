"use client";

import React, { useState } from "react";
import { ICreatePropertyFormState, INearbyPlace } from "../types";
import InputField from "@/ui/InputField";

interface Step7LocationProps {
    data: ICreatePropertyFormState;
    onUpdate: <K extends keyof ICreatePropertyFormState>(
        field: K,
        value: ICreatePropertyFormState[K]
    ) => void;
    errors: string[];
}

const NEARBY_TYPES = [
    "School",
    "Hospital",
    "Market",
    "Park",
    "Station",
    "Airport",
    "Bank",
    "Restaurant",
];

export const Step7Location: React.FC<Step7LocationProps> = ({
    data,
    onUpdate,
    errors = [],
}) => {
    const [newPlace, setNewPlace] = useState<INearbyPlace>({
        name: "",
        type: "School",
        distanceText: "",
        coordinates: undefined,
        order: (data.nearbyPlaces?.length || 0) + 1,
    });

    /* ---------------- Nearby Places ---------------- */

    const addPlace = () => {
        if (!newPlace.name.trim()) return;

        const updated = [...(data.nearbyPlaces || []), newPlace];
        onUpdate("nearbyPlaces", updated);

        setNewPlace({
            name: "",
            type: "School",
            distanceText: "",
            coordinates: undefined,
            order: updated.length + 1,
        });
    };

    const removePlace = (index: number) => {
        const updated = (data.nearbyPlaces || []).filter((_, i) => i !== index);
        onUpdate("nearbyPlaces", updated);
    };

    /* ---------------- UI ---------------- */

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold">Location</h2>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <ul className="list-disc list-inside text-sm text-red-700">
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Coordinates */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Project Location *</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Longitude"
                        type="number"
                        placeholder="72.8479"
                        value={data.location?.coordinates?.[0] ?? ""}
                        onChange={(v) => {
                            const lng = Number(v);
                            const lat = data.location?.coordinates?.[1] || 0;
                            onUpdate("location", {
                                type: "Point",
                                coordinates: [lng, lat],
                            });
                        }}
                    />

                    <InputField
                        label="Latitude"
                        type="number"
                        placeholder="19.0760"
                        value={data.location?.coordinates?.[1] ?? ""}
                        onChange={(v) => {
                            const lat = Number(v);
                            const lng = data.location?.coordinates?.[0] || 0;
                            onUpdate("location", {
                                type: "Point",
                                coordinates: [lng, lat],
                            });
                        }}
                    />
                </div>
            </div>

      

            {/* Add Nearby Place */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
                <h3 className="text-lg font-semibold">Add Nearby Place</h3>

                <InputField
                    label="Place Name"
                    required
                    placeholder="e.g., Delhi Public School"
                    value={newPlace.name ?? ""}
                    onChange={(v) => setNewPlace({ ...newPlace, name: v })}
                />


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <select
                            value={newPlace.type}
                            onChange={(e) =>
                                setNewPlace({ ...newPlace, type: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 bg-white focus:ring-2 focus:ring-green-500"
                        >
                            {NEARBY_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <InputField
                        label="Distance"
                        placeholder="e.g., 2.5 km"
                        value={newPlace.distanceText ?? ""}
                        onChange={(v) =>
                            setNewPlace({ ...newPlace, distanceText: v })
                        }
                    />

                </div>

                <button
                    onClick={addPlace}
                    disabled={!newPlace.name.trim()}
                    className="btn-primary w-full text-white py-2 disabled:opacity-50"
                >
                    Add Place
                </button>
            </div>

            {/* Nearby Places List */}
            <div className="space-y-3">
                <h3 className="font-semibold">
                    Nearby Places ({data.nearbyPlaces?.length || 0})
                </h3>

                {data.nearbyPlaces?.map((place, index) => (
                    <div
                        key={index}
                        className="rounded-lg border bg-white p-4 flex justify-between"
                    >
                        <div>
                            <h4 className="font-semibold">{place.name}</h4>
                            <p className="text-sm text-gray-600">
                                {place.type} • {place.distanceText}
                            </p>
                        </div>

                        <button
                            onClick={() => removePlace(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
