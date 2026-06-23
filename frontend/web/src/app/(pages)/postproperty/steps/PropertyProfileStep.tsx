import { useAppSelector } from "@/Redux/store";
import ResidentialProfile from "../profile/ResidentialProfile";
import CommercialProfile from "../profile/CommercialProfile";
import LandProfile from "../profile/LandProfile";
import AgriculturalProfile from "../profile/AgriculturalProfile";

const PropertyProfileStep = () => {
  const { propertyType, project } = useAppSelector((state) => state.postProperty);

 

  switch (propertyType) {
    case "residential":
      return <ResidentialProfile />;

    case "commercial":
      return <CommercialProfile />;

    case "land":
      return <LandProfile />;

    case "agricultural":
      return <AgriculturalProfile />;

    case "project":
      if (["apartment", "villa"].includes(project.propertyType)) {
        return <ResidentialProfile />;
      }

      if (["open-plot", "commercial-plot"].includes(project.propertyType)) {
        return <LandProfile />;
      }

      return null;

    default:
      return null;
  }
};

export default PropertyProfileStep;
