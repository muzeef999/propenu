import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputField";
import InputWithUnit from "@/ui/InputwithUnit";
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
  const isAgricultural = propertyType === "agricultural";
  const isLand = propertyType === "land";

  /* ================= AREA KEYS ================= */
  const areaValue =
    isAgricultural
      ? data.totalArea?.value
      : isLand
        ? data.plotArea
        : data.carpetArea;

  /* ================= AUTO PRICE / SQ FT ================= */
  useEffect(() => {
    const price = Number(data.price);
    const area = Number(areaValue);

    if (price > 0 && area > 0) {
      const pps = Math.round(price / area).toString();

      if (pps !== data.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType,
            key: "pricePerSqft",
            value: pps,
          }),
        );
      }
    }
  }, [data.price, areaValue, data.pricePerSqft, dispatch, propertyType]);

  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">

      {/* ================= TOTAL PRICE ================= */}
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
              <> (₹ {Number(data.pricePerSqft).toLocaleString()} / sq.ft)</>
            )}
          </p>
        )}
      </div>

      {/* ================= AGRICULTURAL AREA ================= */}
      {isAgricultural ? (
        <InputWithUnit
          label="Total Area"
          placeholder="e.g. 5"
          value={data?.totalArea?.value ?? ""}
          unit={data?.totalArea?.unit ?? "acre"}
          units={[
            { label: "SQ.FT", value: "sqft" },
            { label: "SQ.MT", value: "sqmt" },
            { label: "ACRE", value: "acre" },
            { label: "GUNTHA", value: "guntha" },
            { label: "CENT", value: "cent" },
            { label: "HECTARE", value: "hectare" },
          ]}
          error={fieldErrors.totalArea?.[0]}
          onValueChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "totalArea",
                value: {
                  value,
                  unit: data.totalArea?.unit || "acre",
                },
              }),
            )
          }
          onUnitChange={(unit) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "totalArea",
                value: {
                  value: data.totalArea?.value || "",
                  unit,
                },
              }),
            )
          }
        />
      ) : (
        <InputField
          label={isLand ? "Plot Area (sq ft)" : "Carpet Area (sq ft)"}
          placeholder={isLand ? "e.g. 2400" : "e.g. 1200"}
          value={areaValue ?? ""}
          error={fieldErrors[isLand ? "plotArea" : "carpetArea"]?.[0]}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: isLand ? "plotArea" : "carpetArea",
                value: value.replace(/\D/g, ""),
              }),
            )
          }
        />

      )}

      {/* ================= PRICE / SQ FT ================= */}
      <InputField
        label="Price / sq ft"
        value={data.pricePerSqft || ""}
        placeholder="Auto calculated"
        disabled
      />


      {/* ================= ROAD WIDTH / BUILT-UP ================= */}
      {isAgricultural ? (
        <InputWithUnit
          label="Road Width"
          placeholder="e.g. 30"
          value={data.roadWidth?.value ?? ""}
          unit={data.roadWidth?.unit ?? "ft"}
          units={[
            { label: "FT", value: "ft" },
            { label: "METER", value: "meter" },
          ]}
          error={fieldErrors.roadWidth?.[0]}
          onValueChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "roadWidth",
                value: {
                  value,
                  unit: data.roadWidth?.unit || "ft",
                },
              }),
            )
          }
          onUnitChange={(unit) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "roadWidth",
                value: {
                  value: data.roadWidth?.value || "",
                  unit,
                },
              }),
            )
          }
        />
      ) : (
        <InputField
          label={isLand ? "Road Width (ft)" : "Built-up Area (sq ft)"}
          placeholder={isLand ? "e.g. 30" : "Optional"}
          value={isLand ? data.roadWidth ?? "" : data.builtUpArea ?? ""}
          error={fieldErrors[isLand ? "roadWidth" : "builtUpArea"]?.[0]}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: isLand ? "roadWidth" : "builtUpArea",
                value: value.replace(/\D/g, ""),
              }),
            )
          }
        />

      )}
    </div>
  );
}
