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

  /* ✅ AUTO CALCULATE PRICE / SQ FT */
  useEffect(() => {
    const price =
      Number(data.price) || Number(data.expectedPrice);
    const area = Number(data.carpetArea);

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
    data.carpetArea,
    data.pricePerSqft,
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

      {/* Carpet Area */}
      <InputField
        label="Carpet Area (sq ft)"
        value={data.carpetArea || ""}
        placeholder="e.g. 1200"
        error={fieldErrors.carpetArea?.[0]}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType,
              key: "carpetArea",
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
        onChange={() => {}}
      />

      {/* Built-up Area */}
      <InputField
        label="Built-up Area (sq ft)"
        value={data.builtUpArea || ""}
        placeholder="Optional"
        error={fieldErrors.builtUpArea?.[0]}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType,
              key: "builtUpArea",
              value: value.replace(/\D/g, ""),
            }),
          )
        }
      />
    </div>
  );
}
