// components/PropertyForm.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import StepperHeader from "./StepperHeader";
import BasicTab from "./tabs/BasicTab";
import LocationTab from "./tabs/LocationTab";
import PriceTab from "./tabs/PriceTab";
import AmenitiesTab from "./tabs/AmenitiesTab";
import MediaTab from "./tabs/MediaTab";
import OwnerTab from "./tabs/OwnerTab";

function isTabComplete(values: any, tabIndex: number): boolean {
  if (!values) return false;

  switch (tabIndex) {
    // Basic: title, category, listingType
    case 0:
      return Boolean(
        values.title &&
          String(values.title).trim().length >= 4 &&
          values.category &&
          values.listingType
      );

    // Location: city (and optional addressLine or pincode)
    case 1:
      return Boolean(
        values.address?.city && String(values.address.city).trim().length > 0
      );

    // Price & Details: at least price or area or some details like bhk
    case 2:
      return Boolean(
        (typeof values.price === "number" && values.price > 0) ||
          (typeof values.area === "number" && values.area > 0) ||
          (values.details &&
            (values.details.bhk ||
              values.details.propertyType ||
              values.details.floor))
      );

    // Amenities: any amenity selected OR amenity object exists
    case 3:
      if (!values.amenities) return false;
      return Object.values(values.amenities).some((v: any) => v === true);

    // Media: at least one image
    case 4:
      return Array.isArray(values.images) && values.images.length > 0;

    // Owner & Publish: createdBy or createdByRole present
    case 5:
      return Boolean(values.createdBy || values.createdByRole);

    default:
      return false;
  }
}

export default function PropertyForm({
  initialValues,
}: {
  initialValues?: any;
}) {
  const methods = useForm({
    defaultValues: initialValues || {
      title: "",
      description: "",
      category: "Residential",
      listingType: "Sale",
      status: "draft",
      address: { city: "", addressLine: "", nearbyLandmarks: [] },
      price: undefined,
      area: undefined,
      facing: "",
      details: {},
      amenities: {
        waterSupply: false,
        powerBackup: false,
        parking: false,
        security: false,
        gym: false,
        swimmingPool: false,
        clubhouse: false,
        lift: false,
      },
      images: [],
      videos: [],
      createdBy: undefined,
      createdByRole: undefined,
      builder: null,
      agent: null,
      seller: null,
    },
  });

  const [step, setStep] = useState(0);
  const steps = useMemo(
    () => [
      { key: "basic", label: "Basic Details" },
      { key: "location", label: "Location Details" },
      { key: "profile", label: "Property Profile" },
      { key: "amenities", label: "Amenities" },
      { key: "media", label: "Media" },
      { key: "owner", label: "Owner & Publish" },
    ],
    []
  );

  // compute completed flags whenever form values change
  const [completed, setCompleted] = useState<boolean[]>(
    Array(steps.length).fill(false)
  );

  // watch all values (react-hook-form watch returns unsubscribe function)
  useEffect(() => {
    const subscription = methods.watch((vals) => {
      const newCompleted = steps.map((_, i) => isTabComplete(vals, i));
      // only update state when changed to reduce re-renders
      let changed = false;
      for (let i = 0; i < newCompleted.length; i++) {
        if (newCompleted[i] !== completed[i]) {
          changed = true;
          break;
        }
      }
      if (changed) setCompleted(newCompleted);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods]);

  // auto-advance when current tab becomes complete (small debounce)
  useEffect(() => {
    if (completed[step]) {
      // if already last step, don't advance
      if (step < steps.length - 1) {
        const t = setTimeout(() => {
          setStep((s) => Math.min(s + 1, steps.length - 1));
        }, 400);
        return () => clearTimeout(t);
      }
    }
  }, [completed, step, steps.length]);

  // when clicking a step: only allow navigation to steps that are <= highest completed+1
  function goTo(i: number) {
    const canGo = (idx: number) => {
      // allow any step <= current (backwards) or any completed step
      if (idx <= step) return true;
      // allow forward only if all prior steps are completed
      return steps.slice(0, idx).every((_, k) => completed[k]);
    };
    if (canGo(i)) setStep(i);
  }

  // autosave draft (keeps your existing behavior)
  useEffect(() => {
    const subscription = methods.watch((val) => {
      const id = setTimeout(() => {
        try {
          localStorage.setItem("property_draft", JSON.stringify(val));
        } catch (e) {}
      }, 800);
      return () => clearTimeout(id);
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  async function onNext() {
    // trigger validation if you still want react-hook-form rules
    const ok = await methods.trigger(); // optional
    if (!ok) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function onBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit(values: any) {
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("Server error:", err);
        return;
      }
      try {
        localStorage.removeItem("property_draft");
      } catch (e) {}
      const data = await res.json();
      console.log("Created", data);
    } catch (e) {
      console.error("Network error", e);
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="bg-white p-4 rounded shadow"
      >
        {/* Stepper header */}
        <div className="mb-6">
          <StepperHeader
            steps={steps}
            current={step}
            completed={completed}
            onClick={goTo}
          />
        </div>

        {/* Tab content */}
        <div className="min-h-[360px]">
          {step === 0 && <BasicTab />}
          {step === 1 && <LocationTab />}
          {step === 2 && <PriceTab />}
          {step === 3 && <AmenitiesTab />}
          {step === 4 && <MediaTab />}
          {step === 5 && <OwnerTab />}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between mt-6">
          <div>
            {step > 0 && (
              <button type="button" onClick={onBack} className="btn">
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                const vals = methods.getValues();
                try {
                  await fetch("/api/properties/draft", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...vals, status: "draft" }),
                  });
                  // show toast if you have one
                } catch (e) {
                  console.error("Draft save failed", e);
                }
              }}
              className="btn btn-ghost"
            >
              Save draft
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={onNext}
                className="btn btn-primary"
              >
                Next
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                Publish
              </button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
