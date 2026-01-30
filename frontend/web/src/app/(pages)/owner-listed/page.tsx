"use client";

import { getOwnerProperties } from "@/data/ClientData";
import { PopularOwnerProperty } from "@/types";
import { useQuery } from "@tanstack/react-query";
import ResidentialCard from "../properties/cards/ResidentialCard";
import CommercialCard from "../properties/cards/CommercialCard";
import AgriculturalCard from "../properties/cards/AgriculturalCard";
import { LandCard } from "../properties/cards/LandCard";

const renderPropertyCard = (item: PopularOwnerProperty) => {
  const p = { ...(item as any), id: (item as any)._id };

  switch (p.type) {
    case "residential":
      return <ResidentialCard p={p} />;

    case "commercial":
      return <CommercialCard p={p} />;

    case "land":
      return <LandCard p={p} />;

    case "agricultural":
      return <AgriculturalCard p={p} />;

    default:
      return null;
  }
};


const Page = () => {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<{ items: PopularOwnerProperty[] }>({
    queryKey: ["owner-properties"],
    // Based on other usages, getOwnerProperties expects an object. Pass an empty one for no filters.
    queryFn: () => getOwnerProperties({}),
  });

  

  /* -------------------- Loading -------------------- */
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading owner properties...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load owner properties
      </div>
    );
  }

  // The data from getOwnerProperties is an object with an 'items' array.
  const properties = data?.items ?? [];
  if (properties.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No properties found
      </div>
    );
  }

  /* -------------------- Success -------------------- */
  return (
    <div className="container p-4 sm:p-6">
      

      <div className="space-y-4 w-[80%] ">
        {properties.map((item) => (
          <div key={item._id}>
            {renderPropertyCard(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
