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

function isLandProject(project: FeaturedProject) {
  const category = `${project.categoryType ?? project.propertyType ?? ""}`.toLowerCase();
  return category.includes("land") || category.includes("plot");
}

function formatLandConfiguration(project: FeaturedProject) {
  if (
    typeof project.projectArea === "number" &&
    Number.isFinite(project.projectArea) &&
    project.projectArea > 0
  ) {
    return `${project.projectArea} Acre Land`;
  }

  const minSqft = project.sqftRange?.min;
  const maxSqft = project.sqftRange?.max;

  if (
    typeof minSqft === "number" &&
    Number.isFinite(minSqft) &&
    minSqft > 0 &&
    typeof maxSqft === "number" &&
    Number.isFinite(maxSqft) &&
    maxSqft > 0 &&
    minSqft !== maxSqft
  ) {
    return `${minSqft}-${maxSqft} sq.ft Plots`;
  }

  if (typeof minSqft === "number" && Number.isFinite(minSqft) && minSqft > 0) {
    return `${minSqft} sq.ft Plot`;
  }

  return project.propertyType ?? "Land / Plots";
}

export function getProjectConfigurationLabel(
  project: FeaturedProject,
  unitLabel = "Apartments",
) {
  if (isLandProject(project)) {
    return formatLandConfiguration(project);
  }

  const bhkValues = getProjectBhkValues(project);

  if (bhkValues.length === 0) {
    return project.propertyType ?? unitLabel;
  }

  return `${bhkValues.join(", ")} BHK ${unitLabel}`;
}

export function getProjectConfigurationValue(project: FeaturedProject) {
  if (isLandProject(project)) {
    return formatLandConfiguration(project);
  }

  const bhkValues = getProjectBhkValues(project);

  if (bhkValues.length === 0) {
    return project.propertyType ?? "Apartments";
  }

  return `${bhkValues.join("-")} BHK`;
}
