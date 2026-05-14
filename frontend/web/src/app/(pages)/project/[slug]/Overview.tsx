import { FeaturedProject } from "@/types";

type OverviewProps = {
  project: FeaturedProject;
};

function formatDate(date?: string) {
  if (!date) return "--";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "--";

  return value.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatAvgPrice(project: FeaturedProject) {
  const price = project.priceFrom;
  const sqft = project.sqftRange?.min;

  if (!price || !sqft) return "--";

  const pricePerSqft = price / sqft;
  if (!Number.isFinite(pricePerSqft) || pricePerSqft <= 0) return "--";

  if (pricePerSqft >= 1000) {
    return `\u20b9${(pricePerSqft / 1000).toFixed(1).replace(".0", "")} K/sq.ft`;
  }

  return `\u20b9${Math.round(pricePerSqft).toLocaleString("en-IN")}/sq.ft`;
}

function formatSqftRange(project: FeaturedProject) {
  const min = project.sqftRange?.min;
  const max = project.sqftRange?.max;

  if (min && max) {
    return `${min} - ${max} sq.ft.`;
  }

  if (min) return `${min} sq.ft.`;
  if (max) return `${max} sq.ft.`;
  return "--";
}

function formatBhkConfiguration(project: FeaturedProject) {
  const summary = project.projectSummary ?? project.bhkSummary ?? [];
  const values = Array.from(
    new Set(
      summary
        .map((item) => item.label ?? item.bhkLabel ?? item.bhk)
        .filter(Boolean)
        .map((value) => String(value).replace(/\s*BHK\s*/gi, "").trim()),
    ),
  );

  if (!values.length) return "--";

  return `${values.join(", ")} Configuration`;
}

export default function Overview({ project }: OverviewProps) {
  const possessionLabel = formatDate(project.possessionDate);
  const items = [
    {
      label: "Property Type",
      value: project.propertyType || "Residential Project",
    },

    {
      label: "Availability",
      value: possessionLabel === "--" ? "--" : "Under Construction",
    },
    {
      label: "Units",
      value: project.totalUnits ? `${project.totalUnits} Units` : "--",
    },
    {
      label: "Project Area",
      value: project.projectArea ? `${project.projectArea} Acre` : "--",
    },
    {
      label: "Amenities",
      value: project.amenities?.length
        ? `${project.amenities.length} Amenities`
        : "--",
    },
    {
      label: "Launch Date",
      value: possessionLabel,
    },
    {
      label: "RERA ID",
      value: project.reraNumber || "--",
    },
  ];

  return (
    <section id="overview">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-5 py-5 text-xl font-medium text-slate-950">
            Overview
          </h2>

          <div className="grid gap-x-12 gap-y-7 px-5 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div key={`${item.label}-${index}`} className="min-w-0">
                <p className="text-sm font-medium text-slate-950">{item.label}</p>
                <p className="mt-1 truncate text-sm text-slate-500  capitalize">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
