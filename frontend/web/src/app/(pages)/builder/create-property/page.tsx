'use client';
import React, { useState, useEffect } from 'react';
import { useCreateProperty } from './hooks/useCreateProperty';
import { STEPS } from './types';
import { StepNavigation } from './components/StepNavigation';
import { StepActions } from './components/StepActions';
import { SuccessModal } from './components/SuccessModal';
import { Step1BasicDetails } from './components/Step1BasicDetails';
import { Step2Hero } from './components/Step2Hero';
import { Step3BHKDetails } from './components/Step3BHKDetails';
import { Step4Amenities } from './components/Step4Amenities';
import { Step5Media } from './components/Step5Media';
import { Step6About } from './components/Step6About';
import { Step7Location } from './components/Step7Location';
import { Step8PropertyProfile } from './components/Step8PropertyProfile';
import { Step9SEO } from './components/Step9SEO';


export default function CreatePropertyPage() {
  const {
    formState,
    loading,
    error,
    stepErrors,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    submit,
    reset,
  } = useCreateProperty({
    onSuccess: (property) => {
      setShowSuccess(true);
      setSuccessProperty(property);
    },
    onError: (error) => {
      console.error('Error creating property:', error);
    },
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [successProperty, setSuccessProperty] = useState<any>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setDisplayError(error);
      const timer = setTimeout(() => setDisplayError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const renderStepContent = () => {
    const props = {
      data: formState,
      onUpdate: updateField,
      errors: stepErrors[formState.currentStep] || [],
    };

    switch (formState.currentStep) {
      case 1:
        return <Step1BasicDetails {...props} />;
      case 2:
        return <Step2Hero {...props} />;
      case 3:
        return <Step3BHKDetails {...props} />;
      case 4:
        return <Step4Amenities {...props} />;
      case 5:
        return <Step5Media {...props} />;
      case 6:
        return <Step6About {...props} />;
      case 7:
        return <Step7Location {...props} />;
      case 8:
        return <Step8PropertyProfile {...props} />;
      case 9:
        return <Step9SEO {...props} />;
      default:
        return <Step1BasicDetails {...props} />;
    }
  };

  const isStepValid = (stepErrors[formState.currentStep]?.length || 0) === 0;

  return (
    <div className="max-w-4xl">
      <StepNavigation
        currentStep={formState.currentStep}
        onStepClick={goToStep}
        stepErrors={stepErrors}
      />

      <main className="">
        <div className="bg-white rounded-lg shadow-md p-8">
          {renderStepContent()}
        </div>
      </main>

      <StepActions
        currentStep={formState.currentStep}
        totalSteps={STEPS.length}
        isLoading={loading}
        isValid={isStepValid}
        onPrev={prevStep}
        onNext={nextStep}
        onSubmit={submit}
      />

      {displayError && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          {displayError}
        </div>
      )}

      <SuccessModal
        isOpen={showSuccess}
        propertyTitle={successProperty?.title}
        propertyId={successProperty?._id}
        onClose={() => {
          setShowSuccess(false);
          reset();
        }}
      />
    </div>
  );
}