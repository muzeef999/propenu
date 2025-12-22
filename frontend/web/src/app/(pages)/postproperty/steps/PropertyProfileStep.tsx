import { useAppSelector } from "@/Redux/store";
import ResidentialProfile from "../profile/ResidentialProfile";
import CommercialProfile from "../profile/CommercialProfile";
import LandProfile from "../profile/LandProfile";
import AgriculturalProfile from "../profile/AgriculturalProfile";

const PropertyProfileStep = () => {
  const propertyType = useAppSelector(
    (state) => state.postProperty.propertyType
  );

 

  switch (propertyType) {
    case "residential":
      return <ResidentialProfile />;

    case "commercial":
      return <CommercialProfile />;

    case "land":
      return <LandProfile />;

    case "agricultural":
      return <AgriculturalProfile />;

    default:
      return <CommercialProfile />;
  }
};

export default PropertyProfileStep;
