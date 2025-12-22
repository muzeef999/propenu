"use client";
import { useAppSelector } from "@/Redux/store";
import ResidentialFilters from "./filters/ResidentialFilters";
import CommercialFilters from "./filters/CommercialFilters";
import LandFilters from "./filters/LandFilters";
import AgriculturalFilters from "./filters/AgriculturalFilters";

const CategoryFilters = () => {
  const { category } = useAppSelector((s) => s.filters);

  switch (category) {
    case "Residential":
      return <ResidentialFilters />;

    case "Commercial":
      return <CommercialFilters />;

    case "Land":
      return <LandFilters />;

    case "Agricultural":
      return <AgriculturalFilters />;

    default:
      return null;
  }
};

export default CategoryFilters;
