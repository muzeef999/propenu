import { FeaturedProject } from "@/types";

function extractBhkValue(item: FeaturedProject["bhkSummary"][number]) {
  const labelMatch = item?.bhkLabel?.match(/\d+(\.\d+)?/);

  if (labelMatch) {
    return Number(labelMatch[0]);
  }

  return typeof item?.bhk === "number" ? item.bhk : null;
}

function getProjectBhkValues(project: FeaturedProject) {
  return Array.from(
    new Set(
      (project.bhkSummary ?? [])
        .map(extractBhkValue)
        .filter((bhk): bhk is number => typeof bhk === "number" && !Number.isNaN(bhk)),
    ),
  ).sort((a, b) => a - b);
}

export function getProjectConfigurationLabel(
  project: FeaturedProject,
  unitLabel = "Apartments",
) {
  const bhkValues = getProjectBhkValues(project);

  if (bhkValues.length === 0) {
    return project.propertyType ?? unitLabel;
  }

  return `${bhkValues.join(", ")} BHK ${unitLabel}`;
}

export function getProjectConfigurationValue(project: FeaturedProject) {
  const bhkValues = getProjectBhkValues(project);

  if (bhkValues.length === 0) {
    return project.propertyType ?? "Apartments";
  }

  return `${bhkValues.join("-")} BHK`;
}
