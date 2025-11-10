import { getOwnerProperties } from "@/serverSideData/serverData";
import { PopularOwnerPropertiesResponse } from "@/types";
import { JSX } from "react";
import { LuBed, LuRuler } from "react-icons/lu";
import { TbBath } from "react-icons/tb";
import { MdOutlineLocationOn } from "react-icons/md";
import formatINR from "@/utilies/PriceFormat";

export default async function GetOwnerProperties(): Promise<JSX.Element> {
  try {
    const data = await getOwnerProperties();
    const typedData = (data as any) as { properties?: any[] } | undefined;
    const items = typedData?.properties ?? [];

    if (!items.length) return <h3 className="text-slate-700">No Owner Properties</h3>;

    return (
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((project: any) => (
          <div
            key={project._id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            {/* IMAGE */}
            <div className="h-40 w-full overflow-hidden">
              <img
                src={project?.images?.[0]?.url ?? "/images/placeholder.png"}
                alt={project?.title ?? "Property"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>

            {/* CONTENT */}
            <div className="space-y-3 p-4">
              {/* TITLE */}
              <div className="flex items-start justify-between w-full">
  
  <h3 className="truncate max-w-[70%] text-[18px] font-semibold leading-tight text-slate-900">
  {project?.title ?? "Untitled Property"}
</h3>


  <p className="text-[20px] font-semibold text-primary border-b-2  whitespace-nowrap">
    {formatINR(project?.price)}
  </p>
</div>

              {/* LOCATION */}
              <div className="flex items-start gap-1.5 text-[14px] text-slate-600">
                <MdOutlineLocationOn className="mt-[2px] text-[18px] text-slate-500" />
                <span className="line-clamp-1">
                  {project?.address?.addressLine ?? "Location not specified"}
                </span>
              </div>

              {/* DIVIDER */}
              <div className="h-px w-full bg-slate-100" />

              {/* SPECS */}
              <div className="grid grid-cols-3 text-[14px] font-medium text-slate-800">
                <div className="flex items-center justify-center gap-1.5 px-1">
                  <LuBed className="text-[18px]" />
                  <span>{project?.details?.bhk ?? "-"}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 border-x border-slate-100 px-1">
                  <TbBath className="text-[18px]" />
                  <span>{project?.details?.bathrooms ?? "-"}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 px-1">
                  <LuRuler className="text-[18px]" />
                  <span>{project?.area ?? "-"}</span>
                </div>
              </div>
            </div>

            {/* SUBTLE CORNER RADIUS SHADOW (premium feel) */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/0 group-hover:ring-black/5" />
          </div>
        ))}
      </div>
    );
  } catch (err: any) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">
        Error loading Owner Properties: {String(err?.message ?? err)}
      </div>
    );
  }
}
