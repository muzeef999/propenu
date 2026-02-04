import { useAppSelector } from "@/Redux/store";
import VerifyProperty from "../verifyproperty/VerifyProperty";

const VerificationStep = () => {
  const propertyType = useAppSelector(
    (state) => state.postProperty.propertyType
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Verification & Compliance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Complete legal verification and compliance details for your property
        </p>
      </div>

      {/* Verification Content */}
       <div className="bg-white rounded-lg border border-gray-200 p-6">
        <VerifyProperty />
      </div>
    </div>
  );
};

export default VerificationStep;
