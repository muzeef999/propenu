export function normalizeFilterValue(key: string, value: string) {
  const trimmed = value.trim();
  const labelToken = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const compactToken = trimmed.toLowerCase().replace(/[\s_-]+/g, "");

  if (
    [
      "commercialType",
      "facing",
    ].includes(key)
  ) {
    return compactToken;
  }

  if (
    [
      "commercialSubType",
      "furnishing",
      "furnishingStatus",
      "landType",
      "landSubType",
      "agriculturalType",
      "agriculturalSubType",
      "soilType",
      "irrigationType",
      "waterSource",
      "currentCrop",
      "accessRoadType",
      "amenities",
    ].includes(key)
  ) {
    const valueMap: Record<string, string> = {
      farmland: "farm-land",
      wetland: "wet-land",
      dryland: "dry-land",
    };

    return valueMap[labelToken] ?? labelToken;
  }

  if (["powerCapacity", "roadWidth", "plantationAge"].includes(key)) {
    const numericValue = trimmed.replace(/[^\d.]/g, "");
    return numericValue || trimmed;
  }

  if (key === "parking") {
    const compact = compactToken;
    if (compact.includes("visitor")) return "visitorParking";
    if (compact.includes("two") || compact.includes("2")) return "twoWheeler";
    if (compact.includes("four") || compact.includes("4")) return "fourWheeler";
    return compact;
  }

  if (key === "fireSafety") {
    const compact = compactToken;
    const fireSafetyMap: Record<string, string> = {
      fireextinguisher: "fireExtinguisher",
      firesprinkler: "fireSprinklerSystem",
      firesprinklersystem: "fireSprinklerSystem",
      sprinklersystem: "fireSprinklerSystem",
      firehosereel: "fireHoseReel",
      firehydrant: "fireHydrant",
      smokedetector: "smokeDetector",
      firealarm: "fireAlarmSystem",
      firealarmsystem: "fireAlarmSystem",
      firecontrolpanel: "fireControlPanel",
      emergencyexit: "emergencyExitSignage",
      emergencyexitsignage: "emergencyExitSignage",
      fireexitsigns: "emergencyExitSignage",
      fireexitsign: "emergencyExitSignage",
    };

    return fireSafetyMap[compact] ?? compact;
  }

  if (
    [
      "tenantAvailable",
      "priceNegotiable",
      "verifiedProperties",
      "cornerPlot",
      "readyToConstruct",
      "waterConnection",
      "electricityConnection",
      "boundaryWall",
      "insidePremises",
      "isPriceNegotiable",
    ].includes(key)
  ) {
    const compact = compactToken;
    if (["yes", "true", "1", "available", "negotiable"].includes(compact)) return "true";
    if (["no", "false", "0", "unavailable", "nonnegotiable"].includes(compact)) return "false";
    return compact;
  }

  if (key === "flooringType") {
    if (labelToken === "vitrified") return "vitrified-tiles";
    if (labelToken === "concrete") return "bare-cement";
    return labelToken;
  }

  if (key === "wallFinish" || key === "wallFinishStatus") {
    const compact = compactToken;
    const wallFinishMap: Record<string, string> = {
      nopartitions: "no-partitions",
      bare: "no-partitions",
      brickwalls: "brick-walls",
      brick: "brick-walls",
      cementblockwalls: "cement-block-walls",
      cementblock: "cement-block-walls",
      plasteredwalls: "plastered-walls",
      plastered: "plastered-walls",
      painted: "painted",
      finished: "finished",
    };

    return wallFinishMap[compact] ?? labelToken;
  }

  if (key === "pantry") {
    if (labelToken.includes("inside")) return "inside";
    if (labelToken.includes("shared")) return "shared";
    return labelToken;
  }

  if (key === "plotAreaUnit" || key === "areaUnit") {
    return trimmed.toLowerCase();
  }

  return trimmed;
}

export function areFilterValuesEqual(key: string, left: string, right: string) {
  return normalizeFilterValue(key, String(left)) === normalizeFilterValue(key, String(right));
}

export function uniqueFilterValues(key: string, values: string[] = []) {
  return values.filter(
    (value, index, source) =>
      source.findIndex((candidate) =>
        areFilterValuesEqual(key, candidate, value),
      ) === index,
  );
}

export function toggleFilterArrayValue(
  key: string,
  values: string[] = [],
  value: string,
) {
  const hasValue = values.some((item) =>
    areFilterValuesEqual(key, item, value),
  );

  if (hasValue) {
    return values.filter(
      (item) => !areFilterValuesEqual(key, item, value),
    );
  }

  return [...uniqueFilterValues(key, values), value];
}
