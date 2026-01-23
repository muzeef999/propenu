import { useAppSelector } from "@/Redux/store";
import VerifyResidential from "../verifyproperty/VerifyResidential";
import VerifyCommercial from "../verifyproperty/VerifyCommercial";
import VerifyLand from "../verifyproperty/VerifyLand";
import VerifyAgricultural from "../verifyproperty/VerifyAgricultural";

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
        {propertyType === "residential" && <VerifyResidential />}
        {propertyType === "commercial" && <VerifyCommercial />}
        {propertyType === "land" && <VerifyLand />}
        {propertyType === "agricultural" && <VerifyAgricultural />}
      </div>
    </div>
  );
};

export default VerificationStep;
