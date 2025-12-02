import { getOwnerProperties } from "@/data/serverData";
import { JSX } from "react";
import PopularOwnerPropertiesClient from "./PopularOwnerPropertiesClient";

export default async function GetOwnerProperties(): Promise<JSX.Element> {

  try {
    const data = await getOwnerProperties();
    const typedData = data as any as { properties?: any[] } | undefined;
    const items = typedData?.properties ?? [];

    console.log("Owner properties items length:", items.length); // server log

    if (!items.length)
      return <h3 className="text-slate-700">No Owner Properties</h3>;

    return <PopularOwnerPropertiesClient items={items} />;
  } catch (err: any) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
        Error loading Owner Properties: {String(err?.message ?? err)}
      </div>
    );
  }
}
