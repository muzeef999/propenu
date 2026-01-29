import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputField";
import { numberToWords } from "@/utilies/NumberToWord";

type PricingDetailsProps = {
  propertyType: "residential" | "commercial" | "land" | "agricultural";
  data: any;
  fieldErrors: any;
};

export default function PricingDetails({
  propertyType,
  data,
  fieldErrors,
}: PricingDetailsProps) {
  const dispatch = useDispatch();
  const isLandLike = propertyType === "land" || propertyType === "agricultural";

  const areaKey =
    propertyType === "agricultural"
      ? "totalArea"
      : propertyType === "land"
        ? "plotArea"
        : "carpetArea";
  const areaLabel =
    propertyType === "agricultural"
      ? "Total Area (sq ft)"
      : propertyType === "land"
        ? "Plot Area (sq ft)"
        : "Carpet Area (sq ft)";
  const extraFieldKey = isLandLike ? "roadWidth" : "builtUpArea";
  const extraFieldLabel = isLandLike
    ? "Road Width (ft)"
    : "Built-up Area (sq ft)";

  /* ✅ AUTO CALCULATE PRICE / SQ FT */
  useEffect(() => {
    const price = Number(data.price) || Number(data.expectedPrice);

    const area = Number(data[areaKey]);

    if (price > 0 && area > 0) {
      const pricePerSqft = String(Math.round(price / area));

      if (pricePerSqft !== data.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType,
            key: "pricePerSqft",
            value: pricePerSqft,
          }),
        );
      }
    } else if (data.pricePerSqft) {
      dispatch(
        setProfileField({
          propertyType,
          key: "pricePerSqft",
          value: "",
        }),
      );
    }
  }, [
    data.price,
    data.expectedPrice,
    data.pricePerSqft,
    data[areaKey],
    areaKey,
    propertyType,
    dispatch,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {/* Total Price */}
      <div className="flex flex-col">
        <InputField
          label="Total Price"
          value={data.price || ""}
          placeholder="e.g. 75,00,000"
          error={fieldErrors.price?.[0]}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "price",
                value: value.replace(/\D/g, ""),
              }),
            )
          }
        />

        {data.price && (
          <p className="mt-1 text-xs text-gray-500 italic">
            ₹ {numberToWords(Number(data.price))}
            {data.pricePerSqft && (
              <> (₹ {Number(data.pricePerSqft).toLocaleString()} per sq.ft.)</>
            )}
          </p>
        )}
      </div>

      <InputField
        label={areaLabel}
        value={data[areaKey] || ""}
        placeholder="e.g. 1200"
        error={fieldErrors[areaKey]?.[0]}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType,
              key: areaKey,
              value: value.replace(/\D/g, ""),
            }),
          )
        }
      />

      {/* Price / sq ft */}
      <InputField
        label="Price / sq ft"
        value={data.pricePerSqft || ""}
        placeholder="Auto calculated"
        disabled
        onChange={() => { }}
      />

      {/* Built-up Area */}
      <InputField
        label={extraFieldLabel}
        value={data[extraFieldKey] || ""}
        placeholder={isLandLike ? "e.g. 40" : "Optional"}
        error={fieldErrors[extraFieldKey]?.[0]}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType,
              key: extraFieldKey,
              value: value.replace(/\D/g, ""),
            }),
          )
        }
      />
    </div>
  );
}
