'use client';

import { useState, useCallback } from 'react';
import { IFeaturedProject, ICreatePropertyFormState } from '../types';
import { validateStep, buildFormData } from '../utils/formDataBuilder';
import { createFeaturedProperty } from '@/data/ClientData';

interface UseCreatePropertyOptions {
  onSuccess?: (property: IFeaturedProject) => void;
  onError?: (error: Error) => void;
}

const TOTAL_STEPS = 9;

export const useCreateProperty = (options?: UseCreatePropertyOptions) => {
  const [formState, setFormState] = useState<ICreatePropertyFormState>({
    title: '',
    address: '',
    city: '',
    currency: 'INR',
    status: 'active',
    currentStep: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});

  // Update form field (FIXED typing)
  const updateField = useCallback(
    <K extends keyof ICreatePropertyFormState>(
      field: K,
      value: ICreatePropertyFormState[K]
    ) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    []
  );

  // Move to next step with validation
  const nextStep = useCallback((): boolean => {
    const currentStep = formState.currentStep;
    const validation = validateStep(currentStep, formState);

    if (!validation.isValid) {
      setStepErrors((prev) => ({
        ...prev,
        [currentStep]: validation.errors,
      }));
      setError(validation.errors[0] || 'Validation failed');
      return false;
    }

    setStepErrors((prev) => {
      const updated = { ...prev };
      delete updated[currentStep];
      return updated;
    });

    if (currentStep < TOTAL_STEPS) {
      setFormState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }

    return true;
  }, [formState]);

  // Move to previous step
  const prevStep = useCallback(() => {
    if (formState.currentStep > 1) {
      setFormState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
      setError(null);
    }
  }, [formState.currentStep]);

  // Jump to specific step (no validation)
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setFormState((prev) => ({
        ...prev,
        currentStep: step,
      }));
      setError(null);
    }
  }, []);

  // Submit form (CREATE ONLY)
  const submit = useCallback(async (): Promise<IFeaturedProject | null> => {
    try {
      setLoading(true);
      setError(null);

      // Validate all steps
      for (let step = 1; step <= TOTAL_STEPS; step++) {
        const validation = validateStep(step, formState);
        if (!validation.isValid) {
          setStepErrors((prev) => ({
            ...prev,
            [step]: validation.errors,
          }));
          throw new Error(`Step ${step}: ${validation.errors[0]}`);
        }
      }

      const formData = buildFormData(formState);
      const result = await createFeaturedProperty(formData);

      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      options?.onError?.(err instanceof Error ? err : new Error(message));
      return null;
    } finally {
      setLoading(false);
    }
  }, [formState, options]);

  // Reset form
  const reset = useCallback(() => {
    setFormState({
      title: '',
      address: '',
      city: '',
      currency: 'INR',
      status: 'active',
      currentStep: 1,
    });
    setError(null);
    setStepErrors({});
  }, []);

  return {
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
    setFormState,
  };
};
