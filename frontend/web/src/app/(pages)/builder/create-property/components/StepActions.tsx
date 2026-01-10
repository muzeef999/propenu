"use client";

import React from "react";

interface StepActionsProps {
    currentStep: number;
    totalSteps: number;
    isLoading?: boolean;
    isValid?: boolean;
    onPrev: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export const StepActions: React.FC<StepActionsProps> = ({
    currentStep,
    totalSteps,
    isLoading = false,
    isValid = true,
    onPrev,
    onNext,
    onSubmit,
}) => {
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return (
        <div className="bottom-0 z-20 bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Progress + Actions */}
                <div className="flex flex-col gap-3">
                    {/* Step Info */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                            Step <strong>{currentStep}</strong> of {totalSteps}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-2">
                        {/* Previous */}
                        <button
                            onClick={onPrev}
                            disabled={isFirstStep || isLoading}
                            className={`
                px-6 py-2 rounded-lg font-medium transition-all
                ${isFirstStep || isLoading
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }
              `}
                        >
                            ← Previous
                        </button>

                        {/* Next / Submit */}
                        {isLastStep ? (
                            <button
                                onClick={onSubmit}
                                disabled={isLoading || !isValid}
                                className={`
                  px-8 py-2 rounded-lg font-medium text-white transition-all
                  ${isLoading || !isValid
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                                    }
                `}
                            >
                                {isLoading ? "Submitting…" : "✓ Submit Property"}
                            </button>
                        ) : (
                            <button
                                onClick={onNext}
                                disabled={isLoading || !isValid}
                                className={`
                  px-6 py-2 rounded-lg font-medium text-white transition-all
                  ${isLoading || !isValid
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-emerald-500 hover:bg-emerald-600 shadow-lg"
                                    }
                `}
                            >
                                {isLoading ? "Processing…" : "Next →"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
