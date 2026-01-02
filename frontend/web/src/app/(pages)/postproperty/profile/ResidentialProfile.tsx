import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setProfileField, setStep } from "@/Redux/slice/postPropertySlice";
import Dropdownui from "@/ui/DropDownUI";
import CounterField from "@/ui/CounterField";
import InputField from "@/ui/InputFiled";
import AmenitiesSelect from "./AmenitiesSelect";
import { AMENITIES } from "../constants/amenities";
import TextArea from "@/ui/TextArae";
import { submitPropertyThunk } from "@/Redux/thunks/submitPropertyApi";
import { useAppDispatch } from "@/Redux/store";
import Toggle from "@/ui/ToggleSwitch";
import { toast } from "sonner";
import { numberToWords } from "@/utilies/NumberToWord";

export const FLOORING_TYPES = [
  "vitrified",
  "marble",
  "granite",
  "wooden",
  "ceramic-tiles",
  "mosaic",
  "normal-tiles",
  "cement",
  "other",
] as const;

export const KITCHEN_TYPES = [
  "open",
  "closed",
  "semi-open",
  "island",
  "parallel",
  "u-shaped",
  "l-shaped",
] as const;

export const FACING_TYPES = ["North", "South", "East", "West"] as const;

export const ParkingTypes = ["open", "closed", "both"] as const;

const ResidentialProfile = () => {
  const { residential } = useSelector((state: any) => state.postProperty);
  const dispatch = useAppDispatch();
  // Compute price per sqft from either `price` or `expectedPrice` and write
  // the result to `residential.pricePerSqft` (consistent key used across app).
  useEffect(() => {
    const price =
      Number(residential.price) || Number(residential.expectedPrice);
    const area = Number(residential.carpetArea);

    if (price > 0 && area > 0) {
      const pricePerSqft = String(Math.round(price / area));
      if (pricePerSqft !== residential.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "residential",
            key: "pricePerSqft",
            value: pricePerSqft,
          })
        );
      }
    } else {
      if (residential.pricePerSqft) {
        dispatch(
          setProfileField({
            propertyType: "residential",
            key: "pricePerSqft",
            value: "",
          })
        );
      }
    }
  }, [
    residential.price,
    residential.expectedPrice,
    residential.carpetArea,
    residential.pricePerSqft,
    dispatch,
  ]);

  return (
    <div className="space-y-8">
      {/* ========== CONFIGURATION ========== */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-4">
          <CounterField
            label="BHK"
            value={residential.bhk || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bhk",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Bedrooms"
            value={residential.bedrooms || residential.bhk || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bedrooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Bathrooms"
            value={residential.bathrooms || 1}
            min={1}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "bathrooms",
                  value,
                })
              )
            }
          />
          <CounterField
            label="Balconies"
            value={residential.balconies || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "balconies",
                  value,
                })
              )
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_145px] gap-1 items-start">
          {/* Furnishing */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Furnishing</p>

            <div className="flex gap-5">
              {[
                { label: "Furnished", value: "fully-furnished" },
                { label: "Semi furnished", value: "semi-furnished" },
                { label: "Un-furnished", value: "unfurnished" },
              ].map((item) => {
                const active = residential.furnishing === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      dispatch(
                        setProfileField({
                          propertyType: "residential",
                          key: "furnishing",
                          value: item.value,
                        })
                      )
                    }
                    className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-700"
              }
            `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facing */}
          <Dropdownui
            label="Facing"
            value={residential.facing || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "facing",
                  value,
                })
              )
            }
            options={FACING_TYPES.map((t) => ({ value: t, label: t }))}
            placeholder="Select"
          />
        </div>
      </div>

      <div>
        <AmenitiesSelect
          label="Amenities"
          options={AMENITIES}
          value={residential.amenities || []}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "amenities",
                value,
              })
            )
          }
        />
      </div>

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">
          Parking Details (Optional)
        </p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
          {/* Parking Type */}
          <Dropdownui
            label="Parking Type"
            value={residential.parkingType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingType",
                  value,
                })
              )
            }
            options={ParkingTypes.map((t) => ({
              value: t,
              label: t.toUpperCase(),
            }))}
            placeholder="Select"
          />

          {/* Two Wheeler */}
          <CounterField
            label="Two-Wheeler Parking"
            value={residential.parkingDetails?.twoWheeler || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingDetails",
                  value: {
                    ...residential.parkingDetails,
                    twoWheeler: value,
                  },
                })
              )
            }
          />

          {/* Four Wheeler */}
          <CounterField
            label="Four-Wheeler Parking"
            value={residential.parkingDetails?.fourWheeler || 0}
            min={0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "parkingDetails",
                  value: {
                    ...residential.parkingDetails,
                    fourWheeler: value,
                  },
                })
              )
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        {/* Section Title */}
        <p className="text-sm font-medium text-gray-800">Floor Details</p>

        {/* Fields */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3 items-start">
          {/* Flooring Type */}
          <Dropdownui
            label="Flooring Type"
            value={residential.flooringType || null}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "flooringType",
                  value,
                })
              )
            }
            options={FLOORING_TYPES.map((t) => ({
              value: t,
              label: t.replace("-", " ").toUpperCase(),
            }))}
            placeholder="Select"
          />

          {/* Floor Number */}
          <CounterField
            label="Floor Number"
            min={0}
            value={residential.floorNumber ?? 0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "floorNumber",
                  value,
                })
              )
            }
          />

          {/* Total Floors */}
          <CounterField
            label="Total Floors"
            min={0}
            value={residential.totalFloors ?? 0}
            onChange={(value) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "totalFloors",
                  value,
                })
              )
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 items-end">
        <Dropdownui
          label="Kitchen Type"
          value={residential.kitchenType || null}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "kitchenType",
                value,
              })
            )
          }
          options={KITCHEN_TYPES.map((t) => ({
            value: t,
            label: t.replace("-", " ").toUpperCase(),
          }))}
          placeholder="Select"
        />

        {/* Modular Kitchen */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Modular Kitchen
          </label>

          <div
            className="flex py-2 items-center justify-between rounded-lg border
               border-gray-300 bg-white px-4
               shadow-sm transition
               hover:border-gray-400 mt-2"
          >
            <span className="text-sm text-gray-700">Available</span>

            <input
              type="checkbox"
              checked={residential.isModularKitchen || false}
              onChange={(e) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "isModularKitchen",
                    value: e.target.checked,
                  })
                )
              }
              className="h-5 w-5 accent-green-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Availability Status</p>

        <div className="flex gap-5">
          {[
            { label: "Ready to Move", value: "ready-to-move" },
            { label: "Under Construction", value: "under-construction" },
          ].map((item) => {
            const active = residential.constructionStatus === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "residential",
                      key: "constructionStatus",
                      value: item.value,
                    })
                  )
                }
                className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-700"
              }
            `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transaction Type */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Transaction Type</p>
        <div className="flex gap-5">
          {[
            { label: "New Sale", value: "new-sale" },
            { label: "Resale", value: "resale" },
          ].map((item) => {
            const active = residential.transactionType === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  dispatch(
                    setProfileField({
                      propertyType: "residential",
                      key: "transactionType",
                      value: item.value,
                    })
                  )
                }
                className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors
              ${
                active
                  ? "border-green-500 bg-green-50 text-green-600"
                  : "border-gray-300 text-gray-700"
              }
            `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Age */}
      {residential.constructionStatus === "ready-to-move" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Property Age</p>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "0-1-year", label: "0-1 Year" },
              { value: "1-5-years", label: "1-5 Years" },
              { value: "5-10-years", label: "5-10 Years" },
              { value: "10-plus-years", label: "10+ Years" },
            ].map((item) => {
              const active = residential.propertyAge === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    dispatch(
                      setProfileField({
                        propertyType: "residential",
                        key: "propertyAge",
                        value: item.value,
                      })
                    )
                  }
                  className={`px-6 py-2 border rounded-md text-sm shadow-sm focus:outline-none  transition-colors
                ${
                  active
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-gray-300 text-gray-700"
                }
              `}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Possession Date (only when under construction) */}
      {residential.constructionStatus === "under-construction" && (
        <InputField
          label="Expected Possession Date"
          type="date"
          value={residential.possessionDate || ""}
          onChange={(value) =>
            dispatch(
              setProfileField({
                propertyType: "residential",
                key: "possessionDate",
                value,
              })
            )
          }
        />
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-800">Price Details</p>

        {/* Changed to grid-cols-4 for desktop, added items-end for alignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          {/* TOTAL PRICE COLUMN */}
          <div className="flex flex-col">
            <InputField
              label="Total Price"
              value={residential.price || ""}
              placeholder="e.g. 75,00,000"
              onChange={(value) =>
                dispatch(
                  setProfileField({
                    propertyType: "residential",
                    key: "price",
                    value: value.replace(/\D/g, ""),
                  })
                )
              }
            />

            {/* PRICE IN WORDS (UNDER TOTAL PRICE) */}
            {residential.price && (
              <p className="mt-1 text-xs text-gray-500 italic">
                ₹ {numberToWords(Number(residential.price))}
                {residential.pricePerSqft && (
                  <>
                    {" "}
                    (₹ {residential.pricePerSqft.toLocaleString()} per sq.ft.)
                  </>
                )}
              </p>
            )}
          </div>

          {/* PRICE / SQ FT COLUMN */}
          <div className="flex flex-col">
            <InputField
              label="Price / sq ft"
              value={residential.pricePerSqft || ""}
              placeholder="Auto calculated"
              disabled
              onChange={() => {}}
            />

            {/* BASED ON TEXT (UNDER PRICE / SQ FT) */}
            <button
              type="button"
              onClick={() => dispatch(setStep(1))} // Basic Details
              className="
        mt-1 flex items-center gap-1
        text-xs text-gray-400
        hover:text-green-600
        cursor-pointer
        self-start
      "
            >
              Based on
              <span className="font-medium underline">Carpet Area</span>
              <span className="text-[10px]">▼</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Is the price negotiable?
          </p>
          <p className="text-xs text-gray-500">
            Enable this if you are open to offers from buyers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium ${
              residential.isPriceNegotiable ? "text-green-600" : "text-gray-400"
            }`}
          >
            {residential.isPriceNegotiable ? "YES" : "NO"}
          </span>
          <Toggle
            enabled={residential.isPriceNegotiable || false}
            onChange={(val) =>
              dispatch(
                setProfileField({
                  propertyType: "residential",
                  key: "isPriceNegotiable",
                  value: val,
                })
              )
            }
          />
        </div>
      </div>
      <TextArea
        label="Property Description"
        value={residential.description || ""}
        placeholder="e.g. Spacious 3 BHK apartment with east-facing balcony, covered parking, power backup, and close to IT parks."
        maxLength={500}
        onChange={(value) =>
          dispatch(
            setProfileField({
              propertyType: "residential",
              key: "description",
              value,
            })
          )
        }
      />

      <button
        type="button"
        onClick={() => {
          dispatch(submitPropertyThunk())
            .unwrap()
            .then((response) => {
              console.log("Property submission successful:", response);
              toast.success("Property submitted successfully");
            })
            .catch((error) => {
              console.error("Property submission failed:", error);
              toast.error("Failed to submit property. Please try again.");
            });
        }}
        className="py-2 btn-primary text-white rounded-md cursor-pointer w-full"
      >
        Submit Property
      </button>
    </div>
  );
};

export default ResidentialProfile;
