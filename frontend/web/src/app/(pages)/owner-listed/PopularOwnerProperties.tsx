import { getOwnerProperties } from "@/serverSideData/serverData";
import { PopularOwnerPropertiesResponse } from "@/types";
import { JSX } from "react";

export default async function GetOwnerProperties(): Promise<JSX.Element> {
  try {
    const data = await getOwnerProperties();
     const typedData = data as PopularOwnerPropertiesResponse | undefined;
    const items = typedData?.properties ?? [];

    console.log(data);
    console.log(items);
    // if no items
    if (!items.length) {
      return <h3>No Owner Properties</h3>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
        {items.map((project: any) => (
          <div className="card" key={project._id}>
            <div style={{ width:"100%", height:140, overflow:"hidden", borderTopRightRadius:6, borderTopLeftRadius:6}}>
            <img
                  src={project.images?.[0]?.url ?? "/images/placeholder.png"}
                  alt={project.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
             </div>   
            {project.title}
           location {project?.address?.addressLine}
           <div>
            BHK: {project?.area}
            bathroom : {5}
            area: {project?.area}
           </div>
          </div>
        ))}
      </div>
    );

  } catch (err: any) {
    return <div>Error loading Owner Properties: {String(err?.message ?? err)}</div>;
  }
}
