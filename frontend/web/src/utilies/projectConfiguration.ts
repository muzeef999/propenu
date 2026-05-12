import { FeaturedProject } from "@/types";

type ProjectSummaryItem = NonNullable<
  FeaturedProject["projectSummary"] | FeaturedProject["bhkSummary"]
>[number];

function extractBhkValue(item: ProjectSummaryItem) {
  const labelMatch = (item?.label ?? item?.bhkLabel)?.match(/\d+(\.\d+)?/);

  if (labelMatch) {
    return Number(labelMatch[0]);
  }

  return typeof item?.bhk === "number" ? item.bhk : null;
}

function getProjectBhkValues(project: FeaturedProject) {
  const summary = project.projectSummary ?? project.bhkSummary ?? [];

  return Array.from(
    new Set(
      summary
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
