"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  createBuilderMember,
  createBuilderRole,
  getBuilderMembers,
  getBuilderPermissionCatalog,
  getBuilderRoles,
  getMyProperties,
  updateBuilderMember,
  updateBuilderRole,
} from "@/data/ClientData";
import {
  FiBriefcase,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiShield,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

type BuilderRole = {
  _id: string;
  name: string;
  permissions: string[];
  isActive?: boolean;
};

type BuilderMember = {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  };
  builderRoleId?: BuilderRole;
  projectIds?: string[];
  isActive?: boolean;
};

type Project = {
  _id: string;
  title?: string;
  projectName?: string;
  city?: string;
  locality?: string;
};

const permissionLabels: Record<string, string> = {
  "project:view": "View Projects",
  "project:create": "Create Projects",
  "project:update": "Update Projects",
  "project:delete": "Delete Projects",
  "lead:view": "View Leads",
  "lead:create": "Create Leads",
  "lead:update": "Update Lead Status",
  "lead:delete": "Delete Leads",
  "lead:assign": "Assign Leads",
  "lead:import": "Import Leads",
  "lead:download": "Download Leads",
  "team:view": "View Team",
  "team:create": "Create Team",
  "team:update": "Update Team",
  "team:delete": "Delete Team",
  "role:view": "View Roles",
  "role:create": "Create Roles",
  "role:update": "Update Roles",
  "role:delete": "Delete Roles",
};

const permissionGroup = (permission: string) => permission.split(":")[0] || "other";

const groupLabels: Record<string, string> = {
  project: "Projects",
  lead: "Leads",
  team: "Team",
  role: "Roles",
};

const actionLabels: Record<string, string> = {
  view: "View",
  create: "Create",
  update: "Update",
  edit: "Edit",
  delete: "Delete",
  assign: "Assign",
  import: "Import",
  download: "Download",
};

const actionOrder = [
  "view",
  "create",
  "update",
  "edit",
  "assign",
  "import",
  "download",
  "delete",
];

const moduleOrder = ["project", "lead", "team", "role"];

const getPermissionAction = (permission: string) =>
  permission.split(":")[1] || permission;

const normalizeRoleName = (name: string) => name.trim().toLowerCase();

const getRoleTone = (index: number) => {
  const tones = [
    "border-emerald-200 bg-emerald-50 text-emerald-800",
    "border-sky-200 bg-sky-50 text-sky-800",
    "border-violet-200 bg-violet-50 text-violet-800",
    "border-amber-200 bg-amber-50 text-amber-800",
  ];
  return tones[index % tones.length];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

function SwitchToggle({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-6 w-11 items-center rounded-full p-0.5 transition disabled:cursor-not-allowed disabled:opacity-30"
      style={{ backgroundColor: active ? "#16A34A" : "#D1D5DB" }}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          active ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function BuilderRolesPage() {
  const queryClient = useQueryClient();
  const roleEditorRef = useRef<HTMLElement | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    builderRoleId: "",
    projectIds: [] as string[],
  });

  const permissionsQuery = useQuery<{ permissions: string[] }>({
    queryKey: ["builder-permissions"],
    queryFn: getBuilderPermissionCatalog,
  });

  const rolesQuery = useQuery<{ roles: BuilderRole[] }>({
    queryKey: ["builder-roles"],
    queryFn: getBuilderRoles,
  });

  const membersQuery = useQuery<{ members: BuilderMember[] }>({
    queryKey: ["builder-members"],
    queryFn: getBuilderMembers,
  });

  const propertiesQuery = useQuery<Record<string, Project[]>>({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
  });

  const roles = rolesQuery.data?.roles ?? [];
  const members = membersQuery.data?.members ?? [];
  const activeRoles = roles.filter((role) => role.isActive !== false);
  const activeMembers = members.filter((member) => member.isActive !== false);

  const projects = useMemo(() => {
    const data = propertiesQuery.data;
    if (!data) return [];
    const seen = new Set<string>();

    return Object.values(data)
      .flat()
      .filter((project) => {
        if (!project?._id || seen.has(project._id)) return false;
        seen.add(project._id);
        return true;
      });
  }, [propertiesQuery.data]);

  const groupedPermissions = useMemo(() => {
    const permissions: string[] = permissionsQuery.data?.permissions ?? [];
    return permissions.reduce<Record<string, string[]>>((groups, permission) => {
      const group = permissionGroup(permission);
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [permissionsQuery.data]);

  const permissionModules = useMemo(
    () =>
      Object.keys(groupedPermissions).sort(
        (a, b) => moduleOrder.indexOf(a) - moduleOrder.indexOf(b),
      ),
    [groupedPermissions],
  );

  const permissionActions = useMemo(() => {
    const actions = new Set<string>();
    Object.values(groupedPermissions).forEach((permissions) => {
      permissions.forEach((permission) => {
        actions.add(getPermissionAction(permission));
      });
    });

    return [...actions].sort(
      (a, b) => actionOrder.indexOf(a) - actionOrder.indexOf(b),
    );
  }, [groupedPermissions]);

  const createRoleMutation = useMutation({
    mutationFn: createBuilderRole,
    onSuccess: () => {
      setRoleName("");
      setSelectedPermissions([]);
      setEditingRoleId(null);
      queryClient.invalidateQueries({ queryKey: ["builder-roles"] });
      toast.success("Role created successfully");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      id,
      name,
      permissions,
    }: {
      id: string;
      name: string;
      permissions: string[];
    }) => updateBuilderRole(id, { name, permissions }),
    onSuccess: () => {
      setRoleName("");
      setSelectedPermissions([]);
      setEditingRoleId(null);
      queryClient.invalidateQueries({ queryKey: ["builder-roles"] });
      toast.success("Role updated successfully");
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: createBuilderMember,
    onSuccess: () => {
      setMemberFormError(null);
      setMemberForm({
        name: "",
        email: "",
        phone: "",
        builderRoleId: "",
        projectIds: [],
      });
      queryClient.invalidateQueries({ queryKey: ["builder-members"] });
      toast.success("Team member added successfully");
    },
    onError: (error) => {
      const message = getErrorMessage(
        error,
        "Failed to add team member. Please try again.",
      );
      setMemberFormError(message);
      toast.error(message);
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBuilderRole(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["builder-roles"] }),
  });

  const toggleMemberMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateBuilderMember(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["builder-members"] }),
  });

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const toggleProject = (projectId: string) => {
    setMemberFormError(null);
    setMemberForm((current) => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter((item) => item !== projectId)
        : [...current.projectIds, projectId],
    }));
  };

  const resetRoleForm = () => {
    setRoleName("");
    setSelectedPermissions([]);
    setEditingRoleId(null);
  };

  const handleEditRole = (role: BuilderRole) => {
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
    setEditingRoleId(role._id);
    roleEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveRole = () => {
    const trimmedRoleName = roleName.trim();
    if (!trimmedRoleName) return toast.error("Role name is required");
    if (!selectedPermissions.length) return toast.error("Select at least one permission");

    const roleAlreadyExists = roles.some(
      (role) =>
        role._id !== editingRoleId &&
        normalizeRoleName(role.name) === normalizeRoleName(trimmedRoleName),
    );

    if (roleAlreadyExists) return toast.error("This role already exists");

    if (editingRoleId) {
      updateRoleMutation.mutate({
        id: editingRoleId,
        name: trimmedRoleName,
        permissions: selectedPermissions,
      });
      return;
    }

    createRoleMutation.mutate({
      name: trimmedRoleName,
      permissions: selectedPermissions,
    });
  };

  const handleCreateMember = () => {
    setMemberFormError(null);

    if (!memberForm.name.trim()) return toast.error("Member name is required");
    if (!memberForm.phone.trim()) return toast.error("Phone number is required");
    if (!memberForm.email.trim()) return toast.error("Email is required");
    if (!memberForm.builderRoleId) return toast.error("Select a role");
    if (!memberForm.projectIds.length) return toast.error("Assign at least one project");

    createMemberMutation.mutate({
      name: memberForm.name.trim(),
      email: memberForm.email.trim() || undefined,
      phone: memberForm.phone.trim() || undefined,
      builderRoleId: memberForm.builderRoleId,
      projectIds: memberForm.projectIds,
    });
  };

  const loading =
    permissionsQuery.isLoading ||
    rolesQuery.isLoading ||
    membersQuery.isLoading ||
    propertiesQuery.isLoading;

  const isSavingRole = createRoleMutation.isPending || updateRoleMutation.isPending;

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading builder access...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-[#DDE8E1] bg-white shadow-sm">
        <div className="border-b border-[#E6EFE9] bg-[#F4FAF6] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#15803D]">
              Builder Access
            </p>
            <h1 className="mt-1 text-xl font-semibold text-gray-950 sm:text-2xl">
              Roles & Team
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              Create custom permissions, add team members, and control which projects each person can work on.
            </p>
          </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
              <div className="rounded-md border border-white bg-white px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <FiShield className="h-4 w-4 text-[#16A34A]" />
                Roles
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-950">{roles.length}</p>
            </div>
            <div className="rounded-md border border-white bg-white px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <FiUsers className="h-4 w-4 text-[#16A34A]" />
                Members
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-950">{activeMembers.length}</p>
            </div>
            <div className="rounded-md border border-white bg-white px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <FiBriefcase className="h-4 w-4 text-[#16A34A]" />
                Projects
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-950">{projects.length}</p>
            </div>
          </div>
          </div>
        </div>
        <div className="grid gap-px bg-[#E6EFE9] sm:grid-cols-3">
          <div className="bg-white px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold uppercase text-gray-400">Step 1</p>
            <p className="mt-1 text-sm font-medium text-gray-800">Create a permission role</p>
          </div>
          <div className="bg-white px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold uppercase text-gray-400">Step 2</p>
            <p className="mt-1 text-sm font-medium text-gray-800">Add staff member</p>
          </div>
          <div className="bg-white px-4 py-3 sm:px-6">
            <p className="text-xs font-semibold uppercase text-gray-400">Step 3</p>
            <p className="mt-1 text-sm font-medium text-gray-800">Assign allowed projects</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <section
          ref={roleEditorRef}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-sm font-semibold text-white">
                  1
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">
                    {editingRoleId ? "Edit Role" : "Create Role"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {editingRoleId
                      ? "Update the role name and permissions."
                      : "Define the actions this role can perform."}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="Role name, e.g. Sales Manager"
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100 sm:w-[300px]"
                />
                {editingRoleId && (
                  <button
                    type="button"
                    onClick={resetRoleForm}
                    disabled={isSavingRole}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiX className="h-4 w-4" />
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveRole}
                  disabled={isSavingRole}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-60"
                >
                  {editingRoleId ? (
                    <FiCheck className="h-4 w-4" />
                  ) : (
                    <FiPlus className="h-4 w-4" />
                  )}
                  {isSavingRole
                    ? "Saving..."
                    : editingRoleId
                      ? "Update Role"
                      : "Save Role"}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
            <p className="text-sm font-semibold text-gray-900">Permission Matrix</p>
                <p className="mt-1 text-xs text-gray-500">
                  {editingRoleId
                    ? "Changes will apply to the selected role."
                    : "Rows are modules, columns are actions."}
                </p>
              </div>
              <span className="w-fit rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {selectedPermissions.length} selected
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#F9FAFB] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="sticky left-0 z-10 w-44 bg-[#F9FAFB] px-4 py-3 font-semibold">
                        Module
                      </th>
                      {permissionActions.map((action) => (
                        <th key={action} className="px-4 py-3 text-center font-semibold">
                          {actionLabels[action] ?? action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {permissionModules.map((module) => (
                      <tr key={module} className="hover:bg-gray-50/70">
                        <td className="sticky left-0 z-10 bg-white px-4 py-4">
                          <p className="font-medium text-gray-900">
                            {groupLabels[module] ?? module}
                          </p>
                        </td>
                        {permissionActions.map((action) => {
                          const permission = `${module}:${action}`;
                          const exists = groupedPermissions[module]?.includes(permission);
                          const active = selectedPermissions.includes(permission);

                          return (
                            <td key={permission} className="px-4 py-4 text-center">
                              {exists ? (
                                <SwitchToggle
                                  active={active}
                                  onClick={() => togglePermission(permission)}
                                />
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-sm font-semibold text-white">
                  2
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-950">Add Team Member</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create staff login and map them to a role.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(220px,1.2fr)_minmax(220px,1.2fr)]">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                  value={memberForm.name}
                  onChange={(event) => {
                    setMemberFormError(null);
                    setMemberForm((current) => ({ ...current, name: event.target.value }));
                  }}
                  placeholder="Member name"
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={memberForm.phone}
                  onChange={(event) => {
                    setMemberFormError(null);
                    setMemberForm((current) => ({ ...current, phone: event.target.value }));
                  }}
                  placeholder="WhatsApp number"
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  value={memberForm.email}
                  onChange={(event) => {
                    setMemberFormError(null);
                    setMemberForm((current) => ({ ...current, email: event.target.value }));
                  }}
                  placeholder="Email address"
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={memberForm.builderRoleId}
                  onChange={(event) => {
                    setMemberFormError(null);
                    setMemberForm((current) => ({
                      ...current,
                      builderRoleId: event.target.value,
                    }));
                  }}
                  className="mt-2 h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none transition focus:border-[#16A34A] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">Select role</option>
                  {activeRoles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">Assign Projects</p>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                  {memberForm.projectIds.length} selected
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/60 p-2">
                {projects.length ? (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => {
                    const active = memberForm.projectIds.includes(project._id);
                    return (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => toggleProject(project._id)}
                        className={`flex min-h-[76px] w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "border-[#16A34A] bg-white text-green-800 shadow-sm"
                            : "border-transparent bg-white text-gray-700 hover:border-gray-200"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {project.title || project.projectName || "Project"}
                          </span>
                          <span className="block truncate text-xs text-gray-500">
                            {[project.locality, project.city].filter(Boolean).join(", ")}
                          </span>
                        </span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            active
                              ? "border-[#16A34A] bg-[#16A34A] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {active && <FiCheck className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No projects found
                  </p>
                )}
              </div>
            </div>

            {memberFormError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {memberFormError}
              </div>
            )}

            <button
              onClick={handleCreateMember}
              disabled={createMemberMutation.isPending}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#16A34A] px-4 text-sm font-semibold text-white transition hover:bg-[#15803D] disabled:opacity-60"
            >
              <FiUserPlus className="h-4 w-4" />
              {createMemberMutation.isPending ? "Saving..." : "Add Member"}
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Existing Roles</h2>
            <p className="mt-1 text-sm text-gray-500">Review active and inactive access templates.</p>
          </div>
          <FiShield className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role, index) => (
            <div
              key={role._id}
              className={`rounded-lg border p-4 transition hover:shadow-sm ${
                editingRoleId === role._id
                  ? "border-[#16A34A] bg-green-50/30"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getRoleTone(index)}`}>
                    {role.name}
                  </span>
                  <p className="mt-3 text-xs text-gray-500">
                    {role.permissions.length} permissions
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditRole(role)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition hover:border-[#16A34A] hover:text-[#15803D]"
                    aria-label={`Edit ${role.name}`}
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      toggleRoleMutation.mutate({
                        id: role._id,
                        isActive: role.isActive === false,
                      })
                    }
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      role.isActive === false
                        ? "bg-gray-100 text-gray-600"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {role.isActive === false ? "Inactive" : "Active"}
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 6).map((permission) => (
                  <span
                    key={permission}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    {permissionLabels[permission] ?? permission}
                  </span>
                ))}
                {role.permissions.length > 6 && (
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{role.permissions.length - 6}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Team Members</h2>
            <p className="mt-1 text-sm text-gray-500">People who can access this builder workspace.</p>
          </div>
          <FiUsers className="h-5 w-5 text-[#16A34A]" />
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Projects</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-50 text-sm font-semibold text-green-700">
                        {(member.userId?.name || "M").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-950">
                          {member.userId?.name || "Member"}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {member.userId?.phone || member.userId?.email || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                      {member.builderRoleId?.name || "-"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {(member.projectIds ?? []).length} assigned
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() =>
                        toggleMemberMutation.mutate({
                          id: member._id,
                          isActive: member.isActive === false,
                        })
                      }
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        member.isActive === false
                          ? "bg-gray-100 text-gray-600"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {member.isActive === false ? "Inactive" : "Active"}
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                    No team members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
