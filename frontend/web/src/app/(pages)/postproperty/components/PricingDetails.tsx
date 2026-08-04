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

/** Uppercase rate labels for PRICE / … field (matches plot area unit). */
const RATE_UNIT_LABELS: Record<string, string> = {
  sqft: "SQFT",
  sqmt: "SQ.MT",
  sqyd: "SQ.YD",
  acre: "ACRE",
  guntha: "GUNTHA",
  cent: "CENT",
  hectare: "HECTARE",
};

function normalizeAreaUnit(unit?: string) {
  return String(unit || "sqft")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\./g, "")
    .replace("acres", "acre")
    .replace("acer", "acre")
    .replace("sqfeet", "sqft")
    .replace("squarefeet", "sqft")
    .replace("squareyards", "sqyd")
    .replace("squareyard", "sqyd");
}

function getRateUnitLabel(unit?: string) {
  const key = normalizeAreaUnit(unit);
  return RATE_UNIT_LABELS[key] || String(unit || "SQFT").toUpperCase();
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
  const rateUnitLabel = getRateUnitLabel(areaUnit);

  /* ================= AUTO PRICE / SELECTED UNIT ================= */
  // Store price-per-unit in the same unit as plot/total area (matches land detail UI).
  useEffect(() => {
    const price = Number(data.price);
    const area = Number(areaValue);

    if (price > 0 && area > 0) {
      const pps = Math.round(price / area).toString();

      if (pps !== String(data.pricePerSqft ?? "")) {
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

      {/* ================= PRICE / SELECTED AREA UNIT ================= */}
      <InputField
        key={`price-per-${areaUnit}`}
        label={`PRICE / ${rateUnitLabel}`}
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
