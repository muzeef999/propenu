"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import StepperHeader, { Step } from "./StepperHeader";
import BasicTab from "./tabs/BasicTab";
import LocationTab from "./tabs/LocationTab";
import PriceTab from "./tabs/PriceTab";
import AmenitiesTab from "./tabs/AmenitiesTab";
import MediaTab from "./tabs/MediaTab";
import OwnerTab from "./tabs/OwnerTab";
import { buildPropertyFormData } from "@/lib/formDataBuilder";
import confetti from "canvas-confetti";
import { toast } from "sonner";


export default function PropertyForm({
  initialValues,
}: {
  initialValues?: any;
}) {
  const methods = useForm({ defaultValues: initialValues || {} });

  const steps = useMemo<Step[]>(
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

  const [step, setStep] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const [completed, setCompleted] = useState<boolean[]>(
    Array(steps.length).fill(false)
  );

  // watch form values and update completed flags
  useEffect(() => {
    const sub = methods.watch((vals) => {
      const next = steps.map((_, i) => {
        switch (i) {
          case 0:
            return Boolean(vals.title && vals.category && vals.listingType);
          case 1:
            return Boolean(vals.address?.city);
          case 2:
            return Boolean(vals.price || vals.area);
          case 3:
            return Boolean(
              vals.amenities && Object.values(vals.amenities).some(Boolean)
            );
          case 4:
            return (vals.images?.length || imageFiles.length) > 0;
          case 5:
            return Boolean(vals.createdBy || vals.createdByRole);
          default:
            return false;
        }
      });
      setCompleted(next);
    });
    return () => sub.unsubscribe();
  }, [methods, steps, imageFiles]);

  const handleBack = () => setStep((s) => Math.max(0, s - 1));
  const handleNext = async () => {
    const ok = await methods.trigger();
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const onSubmit = async (values: any) => {
    const fd = buildPropertyFormData(values, {
      images: imageFiles,
      videos: videoFiles,
    });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URLc}/api/properties`, {
        method: "POST",
        body: fd,
      });
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (!res.ok) throw new Error("Failed to create property");
      toast.success("Property created");
    } catch (e:any) {
      toast.error("Failed to create property", e);
    }
  };

  const onStepClick = (index: number) => {
    if (index <= step || steps.slice(0, index).every((_, k) => completed[k])) {
      setStep(index);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="mt-[50px]">
        <StepperHeader
          steps={steps}
          current={step}
          completed={completed}
          onStepClick={onStepClick}
        />

        <div>
          {step === 0 && <BasicTab onNext={handleNext} />}
          {step === 1 && (
            <LocationTab onNext={handleNext} onBack={handleBack} />
          )}
          {step === 2 && <PriceTab onNext={handleNext} onBack={handleBack} />}
          {step === 3 && (
            <AmenitiesTab onNext={handleNext} onBack={handleBack} />
          )}
          {step === 4 && (
            <MediaTab
              setImageFiles={setImageFiles}
              setVideoFiles={setVideoFiles}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === 5 && (
            <OwnerTab
              onBack={handleBack}
              onPublish={methods.handleSubmit(onSubmit)}
            />
          )}
        </div>
      </div>
    </FormProvider>
  );
}
