import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { canApproveProjectByHierarchy } from "./projectApprovalPolicy";

const resolveCreatorMeta = (property: any) => {
  const createdBy = property?.createdBy;
  const postedBy = property?.postedBy;
  const creatorId =
    (createdBy && typeof createdBy === "object" ? createdBy._id : createdBy) ||
    postedBy?.userId ||
    property?.ownerId ||
    null;
  const creatorRole =
    (createdBy && typeof createdBy === "object"
      ? createdBy.roleName || createdBy.role
      : null) ||
    postedBy?.roleName ||
    null;
  return {
    creatorId: creatorId ? String(creatorId) : null,
    creatorRole: creatorRole ? String(creatorRole) : null,
  };
};

/**
 * Hierarchy gate for property verify/approve (same rules as projects).
 * Returns false and sends 403 when actor cannot approve.
 */
export const assertCanApproveListing = (
  req: AuthRequest,
  res: Response,
  property: any,
  permissionKeys: string[] = [],
): boolean => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return false;
  }

  const listingStatus = String(property?.status || "").toLowerCase();
  if (listingStatus === "active") {
    res.status(400).json({
      success: false,
      code: "ALREADY_LIVE",
      message:
        "Property is already live. Approve is hidden until an edit sends it back for re-verification.",
    });
    return false;
  }
  if (listingStatus !== "pending") {
    res.status(400).json({
      success: false,
      code: "NOT_PENDING",
      message: "Only pending listings can be approved by hierarchy staff.",
    });
    return false;
  }

  const { creatorId, creatorRole } = resolveCreatorMeta(property);
  const permissions = Array.isArray(req.user.permissions)
    ? req.user.permissions
    : [];
  const hasApprovePermission =
    permissions.includes("*") ||
    permissionKeys.some((key) => permissions.includes(key)) ||
    permissions.includes("residential:verify_document") ||
    permissions.includes("commercial:verify_document") ||
    permissions.includes("land:verify_document") ||
    permissions.includes("agricultural:verify_document") ||
    permissions.includes("residential:approve") ||
    permissions.includes("commercial:approve") ||
    permissions.includes("land:approve") ||
    permissions.includes("agricultural:approve");

  const decision = canApproveProjectByHierarchy({
    actorRole: req.user.roleName ?? null,
    actorId: req.user.id ?? null,
    creatorRole,
    creatorId,
    hasApprovePermission,
  });

  if (!decision.ok) {
    res.status(403).json({
      success: false,
      code: "HIERARCHY_APPROVAL_REQUIRED",
      message: decision.reason,
    });
    return false;
  }

  return true;
};
