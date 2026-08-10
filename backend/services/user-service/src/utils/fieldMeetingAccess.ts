import User from "../models/userModel";

const normalizeRole = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const ROLE_ALIASES: Record<string, string> = {
  sales_agent: "sales_executive",
  sales_executives: "sales_executive",
  operation_head: "operations_head",
};

export const canonicalFieldMeetingRole = (roleName?: string) => {
  const n = normalizeRole(roleName);
  return ROLE_ALIASES[n] || n;
};

export const FIELD_MEETING_STAFF_ROLES = new Set([
  "sales_executive",
  "sales_agent",
  "sales_manager",
  "business_development_manager",
  "regional_manager",
  "business_development_head",
  "operations_head",
  "super_admin",
  "admin",
]);

export const FIELD_MEETING_GLOBAL_ROLES = new Set([
  "super_admin",
  "admin",
  "operations_head",
  "business_development_head",
]);

const asId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

/** All staff userIds that report (directly/indirectly) to actor. */
export async function getDescendantStaffIds(actorId: string): Promise<string[]> {
  if (!actorId) return [];
  const ids = new Set<string>();
  let frontier = [actorId];
  let guard = 0;
  while (frontier.length && guard < 10) {
    const reports = await User.find({ managerId: { $in: frontier } })
      .select("_id")
      .lean();
    frontier = [];
    for (const row of reports) {
      const id = String(row._id);
      if (ids.has(id)) continue;
      ids.add(id);
      frontier.push(id);
    }
    guard += 1;
  }
  return [...ids];
}

/** Owner ids the actor may list meetings for (includes self for SE). */
export async function getVisibleOwnerIds(
  actorId: string,
  actorRoleRaw?: string,
): Promise<"all" | string[]> {
  const role = canonicalFieldMeetingRole(actorRoleRaw);
  if (FIELD_MEETING_GLOBAL_ROLES.has(role)) return "all";

  if (role === "sales_executive" || role === "sales_agent") {
    return [actorId];
  }

  // Managers: self-owned + descendants
  const descendants = await getDescendantStaffIds(actorId);
  return [actorId, ...descendants];
}

export async function actorCanAccessMeeting(
  actorId: string,
  actorRoleRaw: string | undefined,
  ownerUserId: string,
): Promise<boolean> {
  const visible = await getVisibleOwnerIds(actorId, actorRoleRaw);
  if (visible === "all") return true;
  return visible.includes(String(ownerUserId));
}

/** Walk manager chain upward for visibility label. */
export async function buildVisibilityChain(ownerUserId: string): Promise<string[]> {
  const labels: string[] = [];
  let current = ownerUserId;
  let guard = 0;
  const ROLE_LABEL: Record<string, string> = {
    sales_executive: "Sales Executive",
    sales_manager: "Sales Manager",
    business_development_manager: "BD Manager",
    regional_manager: "Regional Manager",
    business_development_head: "BD Head",
    operations_head: "Operations Head",
    super_admin: "Super Admin",
    admin: "Admin",
  };

  while (current && guard < 8) {
    const user = await User.findById(current)
      .select("name managerId roleId")
      .populate("roleId", "name label")
      .lean();
    if (!user) break;
    const roleName = canonicalFieldMeetingRole((user.roleId as any)?.name || "");
    const label =
      (user.roleId as any)?.label ||
      ROLE_LABEL[roleName] ||
      roleName ||
      "Manager";
    if (guard === 0) {
      labels.push(`${label}`);
    } else {
      labels.push(label);
    }
    current = asId(user.managerId);
    guard += 1;
  }

  // Prefer parent chain for “Visible to …” (skip SE self as first if parents exist)
  if (labels.length > 1) return labels.slice(1);
  return labels;
}

export function defaultPrepTasks() {
  return [
    {
      key: "review_client",
      title: "Review client profile",
      description: "Go through client details and previous interactions.",
      completed: false,
    },
    {
      key: "check_properties",
      title: "Check property matches",
      description: "Shortlist relevant properties as per client needs.",
      completed: false,
    },
    {
      key: "prepare_plan",
      title: "Prepare meeting plan",
      description: "Define key discussion points and next steps.",
      completed: false,
    },
  ];
}
