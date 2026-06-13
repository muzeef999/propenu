export const isDirectAgentRole = (roleName?: string) =>
  String(roleName ?? "").toLowerCase() === "agent";

export async function submitAgentListingForReview(Model: any, id: string) {
  const property = await Model.findById(id);
  if (!property) return null;

  property.status = "pending";
  property.isPublished = false;
  property.completion = {
    ...(property.completion?.toObject?.() ?? property.completion ?? {}),
    percent: 80,
    step: 4,
    lastSection: "verification",
  };
  property.approval ??= {};
  property.approval.status = "pending";

  await property.save();

  return Model.findById(id).populate("createdBy", "name email phone").lean();
}
