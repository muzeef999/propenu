'use client';

import React, { FC } from 'react';
import { STEPS } from '../types';

interface StepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps?: number[];
  stepErrors?: Record<number, string[]>;
}

export const StepNavigation: FC<StepNavigationProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
  stepErrors = {},
}) => {
  return (
    <div className="bg-white border-b border-gray-200 top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Create Property</h1>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Tabs */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-4">
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const hasError = stepErrors[step.id]?.length > 0;

              return (
                <button
                  key={step.id}
                  onClick={() => onStepClick(step.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm
                    ${
                      isCurrent
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : isCompleted
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : hasError
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${
                          isCurrent
                            ? 'bg-white text-emerald-500'
                            : isCompleted
                              ? 'bg-green-600 text-white'
                              : hasError
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-300 text-gray-600'
                        }
                      `}
                    >
                      {isCompleted ? '✓' : step.id}
                    </span>
                    <span>{step.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
