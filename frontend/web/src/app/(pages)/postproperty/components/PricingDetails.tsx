import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setProfileField } from "@/Redux/slice/postPropertySlice";
import InputField from "@/ui/InputField";
import InputWithUnit from "@/ui/InputwithUnit";
import { numberToWords } from "@/utilies/NumberToWord";

type PricingDetailsProps = {
  propertyType: "residential" | "commercial" | "land" | "agricultural" | "project";
  data: any;
  fieldErrors: any;
  listingType?: string;
};

function formatIndianNumber(value?: string | number) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  return Number(digits).toLocaleString("en-IN");
}

const LAND_AREA_UNITS = [
  { label: "SQ.FT", value: "sqft" },
  { label: "SQ.MT", value: "sqmt" },
  { label: "SQ.YD", value: "sqyd" },
  { label: "ACRE", value: "acre" },
  { label: "GUNTHA", value: "guntha" },
  { label: "CENT", value: "cent" },
  { label: "HECTARE", value: "hectare" },
];

const ROAD_WIDTH_UNITS = [
  { label: "FT", value: "ft" },
  { label: "METER", value: "meter" },
];

const AREA_TO_SQFT: Record<string, number> = {
  sqft: 1,
  sqmt: 10.7639,
  sqyd: 9,
  acre: 43560,
  guntha: 1089,
  cent: 435.6,
  hectare: 107639.104,
};

function convertAreaToSqft(value?: string | number, unit = "sqft") {
  const area = Number(value);
  const factor = AREA_TO_SQFT[unit] ?? 1;

  if (!area || area <= 0) return 0;

  return area * factor;
}

export default function PricingDetails({
  propertyType,
  data,
  fieldErrors,
  listingType,
}: PricingDetailsProps) {
  const dispatch = useDispatch();
  const isAgricultural = propertyType === "agricultural";
  const isProjectLand =
    propertyType === "project" &&
    ["open-plot", "commercial-plot"].includes(data.propertyType);
  const isLand = propertyType === "land" || isProjectLand;
  const isRentOrLease = ["rent", "lease"].includes(
    String(listingType ?? data.listingType ?? "").toLowerCase(),
  );
  const rateUnitLabel = "sq.ft";

  /* ================= AREA KEYS ================= */
  const areaValue =
    isAgricultural
      ? data.totalArea?.value
      : isLand
        ? data.plotArea
        : data.carpetArea;
  const areaUnit = isAgricultural
    ? data.totalArea?.unit ?? "acre"
    : isLand
      ? data.plotAreaUnit ?? "sqft"
      : "sqft";

  /* ================= AUTO PRICE / SQ FT ================= */
  useEffect(() => {
    const price = Number(data.price);
    const areaInSqft = convertAreaToSqft(areaValue, areaUnit);

    if (price > 0 && areaInSqft > 0) {
      const pps = Math.round(price / areaInSqft).toString();

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
  }, [data.price, areaValue, areaUnit, data.pricePerSqft, dispatch, propertyType]);

  return (
    <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">

      {/* ================= TOTAL PRICE ================= */}
      <div className="flex flex-col">
        <InputField
          label={isRentOrLease ? "Price per month" : "Total Price"}
          value={formatIndianNumber(data.price)}
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
              <> (₹ {Number(data.pricePerSqft).toLocaleString()} / {rateUnitLabel})</>
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
          units={LAND_AREA_UNITS}
          error={fieldErrors.totalArea?.[0]}
          tooltip="Total land size. You can enter it in square feet, square meters, acres, guntha, cent, or hectare."
          tooltipPosition="center"
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
      ) : isLand ? (
        <InputWithUnit
          label="Plot Area"
          placeholder="Enter plot area"
          value={areaValue || ""}
          unit={data.plotAreaUnit || "sqft"}
          units={LAND_AREA_UNITS}
          error={fieldErrors.plotArea?.[0]}
          tooltip="Total land size. You can enter it in square feet, square meters, acres, guntha, cent, or hectare."
          tooltipPosition="center"
          onValueChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "plotArea",
                value: value.replace(/[^0-9]/g, ""),
              }),
            )
          }
          onUnitChange={(unit) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "plotAreaUnit",
                value: unit,
              }),
            )
          }
        />
      ) : (
        <InputField
          label="Carpet Area (sq ft)"
          placeholder="Enter carpet area"
          value={areaValue || ""}
          error={fieldErrors.carpetArea?.[0]}
          tooltip="Usable space inside the property."
          tooltipPosition="center"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "carpetArea",
                value: value.replace(/[^0-9]/g, ""),
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
      {isAgricultural || isLand ? (
        <InputWithUnit
          label="Road Width"
          placeholder="e.g. 30"
          value={
            isLand
              ? data.roadWidthFt || data.roadWidth?.value || ""
              : data.roadWidth?.value ?? ""
          }
          unit={
            isLand
              ? data.roadWidthUnit || data.roadWidth?.unit || "ft"
              : data.roadWidth?.unit ?? "ft"
          }
          units={ROAD_WIDTH_UNITS}
          error={fieldErrors[isLand ? "roadWidthFt" : "roadWidth"]?.[0]}
          tooltip="Width of the road in front of the property. You can enter it in feet or meters."
          tooltipPosition="end"
          onValueChange={(value) =>
            dispatch(
              isLand
                ? setProfileField({
                    propertyType,
                    key: "roadWidthFt",
                    value: value.replace(/[^0-9]/g, ""),
                  })
                : setProfileField({
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
              isLand
                ? setProfileField({
                    propertyType,
                    key: "roadWidthUnit",
                    value: unit,
                  })
                : setProfileField({
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
          label="Built-up Area (sq ft)"
          placeholder="Enter built-up area (optional)"
          value={data.builtUpArea || ""}
          error={fieldErrors.builtUpArea?.[0]}
          tooltip="Total area including walls"
          tooltipPosition="end"
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType,
                key: "builtUpArea",
                value: value.replace(/[^0-9]/g, ""),
              }),
            )
          }
        />

      )}
    </div>
  );
}
