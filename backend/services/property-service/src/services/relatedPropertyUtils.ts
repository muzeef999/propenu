type NumericBand = {
  field: string;
  tolerance: number;
  points: number;
};

type NearbyNumber = {
  field: string;
  delta: number;
  points: number;
};

type ExactField = {
  field: string;
  points: number;
};

type RelatedConfig = {
  select: string;
  numericBands?: NumericBand[];
  nearbyNumbers?: NearbyNumber[];
  exactFields?: ExactField[];
  limit?: number;
  candidateLimit?: number;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function sameText(a: unknown, b: unknown) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  return Boolean(left && right && left === right);
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isWithinBand(base: unknown, candidate: unknown, tolerance: number) {
  const baseNumber = toNumber(base);
  const candidateNumber = toNumber(candidate);
  if (!baseNumber || candidateNumber === null) return false;

  return (
    candidateNumber >= baseNumber * (1 - tolerance) &&
    candidateNumber <= baseNumber * (1 + tolerance)
  );
}

function isNearbyNumber(base: unknown, candidate: unknown, delta: number) {
  const baseNumber = toNumber(base);
  const candidateNumber = toNumber(candidate);
  if (baseNumber === null || candidateNumber === null) return false;

  return Math.abs(candidateNumber - baseNumber) <= delta;
}

function scoreRelatedProperty(source: any, candidate: any, config: RelatedConfig) {
  let score = 0;

  if (sameText(source.locality, candidate.locality)) score += 40;
  if (sameText(source.city, candidate.city)) score += 30;
  if (sameText(source.propertyType, candidate.propertyType)) score += 30;
  if (sameText(source.listingType, candidate.listingType)) score += 20;

  for (const field of config.exactFields ?? []) {
    if (sameText(source[field.field], candidate[field.field])) {
      score += field.points;
    }
  }

  for (const band of config.numericBands ?? []) {
    if (isWithinBand(source[band.field], candidate[band.field], band.tolerance)) {
      score += band.points;
    }
  }

  for (const numberField of config.nearbyNumbers ?? []) {
    if (
      isNearbyNumber(
        source[numberField.field],
        candidate[numberField.field],
        numberField.delta,
      )
    ) {
      score += numberField.points;
    }
  }

  return score;
}

function buildCandidateQuery(property: any) {
  const possibleMatches = ["locality", "city", "propertyType", "listingType"]
    .filter((field) => property[field])
    .map((field) => ({ [field]: property[field] }));

  const query: any = {
    _id: { $ne: property._id },
    status: "active",
  };

  if (possibleMatches.length > 0) {
    query.$or = possibleMatches;
  }

  return query;
}

export async function findRankedRelatedProperties(
  model: any,
  property: any,
  config: RelatedConfig,
) {
  if (!property?._id) return [];

  const limit = config.limit ?? 6;
  const candidates = await model
    .find(buildCandidateQuery(property))
    .sort({ createdAt: -1 })
    .limit(config.candidateLimit ?? 60)
    .select(`${config.select} createdAt`)
    .lean();

  return candidates
    .map((candidate: any) => ({
      candidate,
      score: scoreRelatedProperty(property, candidate, config),
      createdAt: new Date(candidate.createdAt ?? 0).getTime(),
    }))
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score || b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((item: any) => item.candidate);
}
