import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  propertyTitle?: string;
  propertyId?: string;
  onClose?: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  propertyTitle,
  propertyId,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
        <p className="text-gray-600 mb-4">
          Your property listing has been created successfully.
        </p>

        {propertyTitle && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Property</p>
            <p className="font-semibold text-gray-900">{propertyTitle}</p>
          </div>
        )}

        {propertyId && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-blue-600 mb-1">Property ID</p>
            <p className="font-mono text-sm text-blue-900">{propertyId}</p>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            View Property
          </button>
          <button
            onClick={() => window.location.href = '/builder/create-property'}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Create Another
          </button>
        </div>
      </div>
    </div>
  );
};
