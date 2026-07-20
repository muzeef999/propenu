"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowDropdownIcon } from "@/icons/icons";
import {
  FiBriefcase,
  FiCheck,
  FiEdit2,
  FiPlus,
  FiShield,
  FiTrash2,
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
  builderRoleId?: BuilderRole & { _id: string };
  projectIds?: string[];
  isActive?: boolean;
};

type Project = {
  _id: string;
  propertyCode?: string;
  title?: string;
  projectName?: string;
  city?: string;
  locality?: string;
  heroImage?: string;
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
  update: "Change Status",
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
const visiblePermissionActions = new Set([
  "view",
  "update",
  "edit",
  "assign",
  "import",
  "download",
]);

const moduleOrder = ["project", "lead", "team", "role"];
const visiblePermissionModules = new Set(["lead"]);

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

const INDIA_DIAL_CODE = "+91";
const NAME_REGEX = /^[A-Za-z]+(?:[A-Za-z\s'.-]*[A-Za-z])?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const normalizePhoneInput = (value: string) =>
  value.replace(/\D/g, "").slice(-10);

const getPhoneDigits = (value?: string) => {
  const digits = normalizePhoneInput(value ?? "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const validateMemberForm = (memberForm: {
  name: string;
  email: string;
  phone: string;
  builderRoleId: string;
}) => {
  const trimmedName = memberForm.name.trim();
  const trimmedEmail = memberForm.email.trim().toLowerCase();
  const phoneDigits = getPhoneDigits(memberForm.phone);

  if (!trimmedName) return "Member name is required";
  if (trimmedName.length < 2) return "Member name must be at least 2 characters";
  if (!NAME_REGEX.test(trimmedName)) return "Enter a valid member name";

  if (!trimmedEmail) return "Email is required";
  if (!EMAIL_REGEX.test(trimmedEmail)) return "Enter a valid email address";

  if (!phoneDigits) return "Phone number is required";
  if (!PHONE_REGEX.test(phoneDigits)) {
    return "Enter a valid 10-digit Indian mobile number";
  }

  if (!memberForm.builderRoleId) return "Select a role";

  return null;
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
  const memberEditorRef = useRef<HTMLElement | null>(null);
  const assignProjectRef = useRef<HTMLElement | null>(null);
  const memberRoleDropdownRef = useRef<HTMLDivElement | null>(null);
  const assignRoleDropdownRef = useRef<HTMLDivElement | null>(null);
  const assignMemberDropdownRef = useRef<HTMLDivElement | null>(null);
  const roleHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const memberHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const assignHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);
  const [memberRoleOpen, setMemberRoleOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [assignMemberOpen, setAssignMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
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
      if (!visiblePermissionModules.has(group)) return groups;
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
        const action = getPermissionAction(permission);
        if (visiblePermissionActions.has(action)) {
          actions.add(action);
        }
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
    onSuccess: (data, variables) => {
      setMemberFormError(null);
      setEditingMemberId(null);
      setSelectedMemberId(data?.member?._id || "");
      setAssignRoleId(variables.builderRoleId);
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

  const editMemberMutation = useMutation({
    mutationFn: ({
      id,
      builderRoleId,
      projectIds,
    }: {
      id: string;
      builderRoleId?: string;
      projectIds?: string[];
    }) => updateBuilderMember(id, { builderRoleId, projectIds }),
    onSuccess: () => {
      setEditingMemberId(null);
      setMemberFormError(null);
      setMemberForm({
        name: "",
        email: "",
        phone: "",
        builderRoleId: "",
        projectIds: [],
      });
      queryClient.invalidateQueries({ queryKey: ["builder-members"] });
      toast.success("Team member updated successfully");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to update team member.");
      setMemberFormError(message);
      toast.error(message);
    },
  });

  const assignProjectsMutation = useMutation({
    mutationFn: ({
      memberId,
      builderRoleId,
      projectIds,
    }: {
      memberId: string;
      builderRoleId?: string;
      projectIds: string[];
    }) =>
      updateBuilderMember(memberId, {
        ...(builderRoleId ? { builderRoleId } : {}),
        projectIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["builder-members"] });
      toast.success("Projects assigned successfully");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to assign projects"));
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

  const resetMemberForm = () => {
    setEditingMemberId(null);
    setMemberFormError(null);
    setMemberForm({
      name: "",
      email: "",
      phone: "",
      builderRoleId: "",
      projectIds: [],
    });
  };

  const handleEditRole = (role: BuilderRole) => {
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
    setEditingRoleId(role._id);
    roleEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEditMember = (member: BuilderMember) => {
    setEditingMemberId(member._id);
    setMemberFormError(null);
    setMemberForm({
      name: member.userId?.name || "",
      email: member.userId?.email || "",
      phone: getPhoneDigits(member.userId?.phone),
      builderRoleId: member.builderRoleId?._id || "",
      projectIds: (member.projectIds ?? []).map(String),
    });
    memberEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find((item) => item._id === memberId);
    if (!member) {
      setAssignRoleId("");
      setMemberForm((current) => ({ ...current, projectIds: [] }));
      return;
    }

    setAssignRoleId(member.builderRoleId?._id || "");
    setMemberForm((current) => ({
      ...current,
      projectIds: (member.projectIds ?? []).map(String),
    }));
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
    const validationError = validateMemberForm(memberForm);
    if (validationError) {
      setMemberFormError(validationError);
      return toast.error(validationError);
    }

    const trimmedName = memberForm.name.trim();
    const trimmedEmail = memberForm.email.trim().toLowerCase();
    const phoneDigits = getPhoneDigits(memberForm.phone);

    if (editingMemberId) {
      editMemberMutation.mutate({
        id: editingMemberId,
        builderRoleId: memberForm.builderRoleId,
        projectIds: memberForm.projectIds,
      });
      return;
    }

    createMemberMutation.mutate({
      name: trimmedName,
      email: trimmedEmail || undefined,
      phone: phoneDigits || undefined,
      builderRoleId: memberForm.builderRoleId,
    });
  };

  const handleAssignProjects = () => {
    if (!selectedMemberId) return toast.error("Select a team member");
    if (!assignRoleId) return toast.error("Select a role");
    if (!memberForm.projectIds.length) return toast.error("Assign at least one project");

    assignProjectsMutation.mutate({
      memberId: selectedMemberId,
      builderRoleId: assignRoleId,
      projectIds: memberForm.projectIds,
    });
  };

  const loading =
    permissionsQuery.isLoading ||
    rolesQuery.isLoading ||
    membersQuery.isLoading ||
    propertiesQuery.isLoading;

  const isSavingRole = createRoleMutation.isPending || updateRoleMutation.isPending;

  useEffect(() => {
    const updateActiveStepOnScroll = () => {
      const activationLine = 135;
      const roleTop = roleHeadingRef.current?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER;
      const memberTop = memberHeadingRef.current?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER;
      const assignTop = assignHeadingRef.current?.getBoundingClientRect().top ?? Number.MAX_SAFE_INTEGER;

      if (assignTop <= activationLine) {
        setActiveStep(3);
        return;
      }

      if (memberTop <= activationLine) {
        setActiveStep(2);
        return;
      }

      if (roleTop <= activationLine) {
        setActiveStep(1);
        return;
      }

      setActiveStep(1);
    };

    updateActiveStepOnScroll();
    window.addEventListener("scroll", updateActiveStepOnScroll, { passive: true });
    window.addEventListener("resize", updateActiveStepOnScroll);

    return () => {
      window.removeEventListener("scroll", updateActiveStepOnScroll);
      window.removeEventListener("resize", updateActiveStepOnScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!memberRoleDropdownRef.current?.contains(event.target as Node)) {
        setMemberRoleOpen(false);
      }
      if (!assignRoleDropdownRef.current?.contains(event.target as Node)) {
        setAssignRoleOpen(false);
      }
      if (!assignMemberDropdownRef.current?.contains(event.target as Node)) {
        setAssignMemberOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMemberRoleOpen(false);
        setAssignRoleOpen(false);
        setAssignMemberOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-gray-500">Loading builder access...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5 bg-white">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Team Access
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-[2.15rem]">
            Roles & Teams
          </h1>
          <p className="mt-2 max-w-4xl text-base leading-8 text-gray-500">
            Manage your sales and marketing team by creating roles, inviting team members, and controlling access to leads and projects.
          </p>
        </div>

        <div className="inline-flex w-full flex-col overflow-hidden rounded-[4px] border border-[#E2F0E6] bg-[#F4FCF6] sm:w-auto sm:flex-row">
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700">
            <FiShield className="h-4 w-4 text-gray-900" />
            <span>{roles.length} Roles</span>
          </div>
          <div className="hidden w-px bg-[#D8E9DE] sm:block" />
          <div className="block h-px bg-[#D8E9DE] sm:hidden" />
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700">
            <FiUsers className="h-4 w-4 text-gray-900" />
            <span>{activeMembers.length} Team Members</span>
          </div>
          <div className="hidden w-px bg-[#D8E9DE] sm:block" />
          <div className="block h-px bg-[#D8E9DE] sm:hidden" />
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700">
            <FiBriefcase className="h-4 w-4 text-gray-900" />
            <span>{projects.length} Projects</span>
          </div>
        </div>
      </div>

      <div className="bg-white md:sticky md:top-0 md:z-30">
        <div className="grid gap-2 rounded-md bg-white sm:gap-3 md:grid-cols-3">
          <div className={`rounded-md border border-[#E2F0E6] px-4 py-3 transition sm:px-5 sm:py-4 ${activeStep === 1 ? "bg-[#F4FCF6] shadow-[0_8px_18px_rgba(39,174,96,0.08)]" : "bg-[#F8FCF9]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${activeStep === 1 ? "text-gray-500" : "text-gray-400"}`}>Step 1</p>
            <p className={`mt-2 text-base leading-6 sm:mt-3 sm:text-[1.1rem] ${activeStep === 1 ? "font-semibold text-gray-950" : "font-medium text-gray-400"}`}>Create Roles &amp; Permissions</p>
          </div>
          <div className={`rounded-md border border-[#E2F0E6] px-4 py-3 transition sm:px-5 sm:py-4 ${activeStep === 2 ? "bg-[#F4FCF6] shadow-[0_8px_18px_rgba(39,174,96,0.08)]" : "bg-[#F8FCF9]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${activeStep === 2 ? "text-gray-500" : "text-gray-400"}`}>Step 2</p>
            <p className={`mt-2 text-base leading-6 sm:mt-3 sm:text-[1.1rem] ${activeStep === 2 ? "font-semibold text-gray-950" : "font-medium text-gray-400"}`}>Add Team Member</p>
          </div>
          <div className={`rounded-md border border-[#E2F0E6] px-4 py-3 transition sm:px-5 sm:py-4 ${activeStep === 3 ? "bg-[#F4FCF6] shadow-[0_8px_18px_rgba(39,174,96,0.08)]" : "bg-[#F8FCF9]"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${activeStep === 3 ? "text-gray-500" : "text-gray-400"}`}>Step 3</p>
            <p className={`mt-2 text-base leading-6 sm:mt-3 sm:text-[1.1rem] ${activeStep === 3 ? "font-semibold text-gray-950" : "font-medium text-gray-400"}`}>Assign Project</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <section
          ref={roleEditorRef}
          className="bg-white"
        >
          <div className="flex flex-col gap-4 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 ref={roleHeadingRef} className="text-[1.15rem] font-semibold text-gray-950 sm:text-[1.2rem]">
                Create Roles &amp; Permissions
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Create a role and assign permissions for your team.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
              <input
                value={roleName}
                onChange={(event) => setRoleName(event.target.value)}
                placeholder="Enter Role Name, e.g.Sales Manager"
                className="h-10 w-full rounded-md border border-[#D7D7D7] bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#16A34A] sm:w-[260px] lg:w-[340px]"
              />
              <span className="inline-flex h-10 items-center justify-center rounded-md bg-[#E8F9EE] px-4 text-sm font-medium text-[#16A34A]">
                {selectedPermissions.length} permissions
              </span>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={resetRoleForm}
                  disabled={isSavingRole}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D7D7D7] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <FiX className="h-4 w-4" />
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveRole}
                disabled={isSavingRole}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#27AE60] px-4 text-sm font-semibold text-white transition hover:bg-[#1f9752] disabled:opacity-60"
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

          <div className="overflow-hidden rounded-md border border-[#E3E3E3]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#F4FCF6] text-[1rem] text-[#6B7280]">
                  <tr>
                    <th className="sticky left-0 z-10 w-44 bg-[#F4FCF6] px-4 py-3 font-semibold">
                      Module
                    </th>
                    {permissionActions.map((action) => (
                      <th key={action} className="px-4 py-3 text-center font-semibold">
                        {actionLabels[action] ?? action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEFEF] bg-white">
                  {permissionModules.map((module) => (
                    <tr key={module}>
                      <td className="sticky left-0 z-10 bg-white px-4 py-6">
                        <p className="text-[1rem] font-medium text-gray-900">
                          {groupLabels[module] ?? module}
                        </p>
                      </td>
                      {permissionActions.map((action) => {
                        const permission = `${module}:${action}`;
                        const exists = groupedPermissions[module]?.includes(permission);
                        const active = selectedPermissions.includes(permission);

                        return (
                          <td key={permission} className="px-4 py-6 text-center">
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
        </section>

        <section ref={memberEditorRef} className="bg-white">
          <div className="flex flex-col gap-4 py-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 ref={memberHeadingRef} className="text-[1.15rem] font-semibold text-gray-950 sm:text-[1.2rem]">
                Add Team Member
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Invite your team and assign their role.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {editingMemberId && (
                <button
                  type="button"
                  onClick={resetMemberForm}
                  disabled={createMemberMutation.isPending || editMemberMutation.isPending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D7D7D7] bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <FiX className="h-4 w-4" />
                  Cancel
                </button>
              )}
              <button
                onClick={handleCreateMember}
                disabled={createMemberMutation.isPending || editMemberMutation.isPending}
                className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-[#27AE60] px-4 text-sm font-semibold text-white transition hover:bg-[#1f9752] disabled:opacity-60"
              >
                <FiUserPlus className="h-4 w-4" />
                {createMemberMutation.isPending || editMemberMutation.isPending
                  ? "Saving..."
                  : editingMemberId
                    ? "Update Team Member"
                    : "Add Team Member"}
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <input
                value={memberForm.name}
                onChange={(event) => {
                  setMemberFormError(null);
                  setMemberForm((current) => ({
                    ...current,
                    name: event.target.value.replace(/\s{2,}/g, " "),
                  }));
                }}
                maxLength={60}
                placeholder="Enter Member Name"
                className="h-10 w-full rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus:border-[#16A34A] focus:bg-white"
              />
            </div>
            <div>
              <input
                value={memberForm.email}
                onChange={(event) => {
                  setMemberFormError(null);
                  setMemberForm((current) => ({
                    ...current,
                    email: event.target.value.replace(/\s/g, ""),
                  }));
                }}
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Enter Email Address"
                className="h-10 w-full rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-800 outline-none placeholder:text-gray-500 focus:border-[#16A34A] focus:bg-white"
              />
            </div>
            <div>
              <div className="flex h-10 overflow-hidden rounded-md border border-[#ECECEC] bg-[#F3F3F3] focus-within:border-[#16A34A] focus-within:bg-white">
                <span className="inline-flex items-center border-r border-[#E5E7EB] bg-[#EBF7EF] px-3 text-sm font-semibold text-[#15803D]">
                  {INDIA_DIAL_CODE}
                </span>
                <input
                  value={memberForm.phone}
                  onChange={(event) => {
                    setMemberFormError(null);
                    setMemberForm((current) => ({
                      ...current,
                      phone: normalizePhoneInput(event.target.value),
                    }));
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter WhatsApp Number"
                  className="h-full w-full bg-transparent px-4 text-sm text-gray-800 outline-none placeholder:text-gray-500"
                />
              </div>
            </div>
            <div ref={memberRoleDropdownRef} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMemberRoleOpen((prev) => !prev);
                }}
                className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
              >
                <span
                  className={`truncate ${
                    memberForm.builderRoleId ? "text-gray-700" : "text-[#6B7280]"
                  }`}
                >
                  {activeRoles.find((role) => role._id === memberForm.builderRoleId)?.name ||
                    "Assign Role"}
                </span>
                <ArrowDropdownIcon
                  size={12}
                  color="#111827"
                  className={`transition-transform duration-200 ${
                    memberRoleOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {memberRoleOpen && (
                <div
                  className="absolute left-0 top-[calc(100%+8px)] z-60 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="pointer-events-none absolute -top-2 left-6">
                    <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                  </div>
                  <h4 className="mb-2 text-sm font-semibold">Assign Role</h4>
                  <div className="flex flex-col gap-1">
                    {activeRoles.map((role) => (
                      <button
                        key={role._id}
                        type="button"
                        onClick={() => {
                          setMemberFormError(null);
                          setMemberForm((current) => ({
                            ...current,
                            builderRoleId: role._id,
                          }));
                          setMemberRoleOpen(false);
                        }}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          memberForm.builderRoleId === role._id
                            ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {memberFormError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {memberFormError}
            </div>
          )}
        </section>

        <section ref={assignProjectRef} className="bg-white">
          <div>
            <h2 ref={assignHeadingRef} className="text-[1.15rem] font-semibold text-gray-950 sm:text-[1.2rem]">
              Assign Project
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Select projects this member can work on.
            </p>
          </div>

          <div className="mt-6 sm:mt-7">
            <div className="mb-5 flex flex-col gap-3 sm:mb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[585px]">
                <div ref={assignRoleDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssignRoleOpen((prev) => !prev);
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
                  >
                    <span
                      className={`truncate ${
                        assignRoleId ? "text-gray-700" : "text-[#6B7280]"
                      }`}
                    >
                      {activeRoles.find((role) => role._id === assignRoleId)?.name ||
                        "Select Role"}
                    </span>
                    <ArrowDropdownIcon
                      size={12}
                      color="#111827"
                      className={`transition-transform duration-200 ${
                        assignRoleOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {assignRoleOpen && (
                    <div
                      className="absolute left-0 top-[calc(100%+8px)] z-60 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="pointer-events-none absolute -top-2 left-6">
                        <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                      </div>
                      <h4 className="mb-2 text-sm font-semibold">Select Role</h4>
                      <div className="flex flex-col gap-1">
                        {activeRoles.map((role) => (
                          <button
                            key={role._id}
                            type="button"
                            onClick={() => {
                              setMemberFormError(null);
                              setAssignRoleId(role._id);
                              setAssignRoleOpen(false);
                            }}
                            className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                              assignRoleId === role._id
                                ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {role.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div ref={assignMemberDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssignMemberOpen((prev) => !prev);
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
                  >
                    <span
                      className={`truncate ${
                        selectedMemberId ? "text-gray-700" : "text-[#6B7280]"
                      }`}
                    >
                      {activeMembers.find((member) => member._id === selectedMemberId)?.userId
                        ?.name ||
                        activeMembers.find((member) => member._id === selectedMemberId)?.userId
                          ?.email ||
                        activeMembers.find((member) => member._id === selectedMemberId)?.userId
                          ?.phone ||
                        "Select Team Member"}
                    </span>
                    <ArrowDropdownIcon
                      size={12}
                      color="#111827"
                      className={`transition-transform duration-200 ${
                        assignMemberOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {assignMemberOpen && (
                    <div
                      className="absolute left-0 top-[calc(100%+8px)] z-60 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="pointer-events-none absolute -top-2 left-6">
                        <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                      </div>
                      <h4 className="mb-2 text-sm font-semibold">Select Team Member</h4>
                      <div className="flex flex-col gap-1">
                        {activeMembers.map((member) => (
                          <button
                            key={member._id}
                            type="button"
                            onClick={() => {
                              handleSelectMember(member._id);
                              setAssignMemberOpen(false);
                            }}
                            className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                              selectedMemberId === member._id
                                ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {member.userId?.name ||
                              member.userId?.email ||
                              member.userId?.phone ||
                              "Member"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                <span className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gray-100 px-4 text-sm font-semibold text-gray-500 sm:w-auto">
                  {memberForm.projectIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleAssignProjects}
                  disabled={assignProjectsMutation.isPending}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-[#27AE60] px-4 text-sm font-semibold text-white transition hover:bg-[#1f9752] disabled:opacity-60 sm:w-auto"
                >
                  {assignProjectsMutation.isPending ? "Assigning..." : "Assign Project"}
                </button>
              </div>
            </div>
            <div className="max-h-[430px] overflow-y-auto">
              {projects.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => {
                    const active = memberForm.projectIds.includes(project._id);
                    const projectTitle = project.title || project.projectName || "Project";
                    const projectLocation = [project.locality, project.city].filter(Boolean).join(", ");
                    return (
                      <button
                        key={project._id}
                        type="button"
                        onClick={() => toggleProject(project._id)}
                        className={`group flex min-h-[108px] w-full flex-col gap-3 rounded-xl border p-3 text-left text-sm transition sm:flex-row sm:items-start ${
                          active
                            ? "border-[#BFE6CB] bg-[#F4FCF6] text-gray-800 shadow-[0_8px_18px_rgba(39,174,96,0.08)]"
                            : "border-[#E7E7E7] bg-white text-gray-700 hover:border-[#CFE3D6] hover:bg-[#FBFDFC]"
                        }`}
                      >
                        <img
                          src={project.heroImage || "/images/placeholder.svg"}
                          alt={projectTitle}
                          className="h-40 w-full rounded-lg object-cover sm:h-[82px] sm:w-[104px] sm:shrink-0"
                        />
                        <span className="min-w-0 flex-1 pt-0.5">
                          <span className="inline-flex max-w-full rounded-full bg-[#F3F6F4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5F6F66] sm:text-[11px]">
                            Code: {project.propertyCode || project._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="mt-2 line-clamp-2 block text-[0.95rem] font-semibold leading-6 text-gray-900 sm:text-[0.98rem]">
                            {projectTitle}
                          </span>
                          <span className="mt-1 block text-xs font-medium text-[#7B8A82]">
                            {projectLocation || "Location unavailable"}
                          </span>
                        </span>
                        <span
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center self-end rounded-md border transition sm:self-auto ${
                            active
                              ? "border-[#27AE60] bg-[#27AE60] text-white"
                              : "border-[#CFCFCF] bg-white text-transparent group-hover:border-[#A9D5B6]"
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
        </section>
      </div>     
      <div className="border-t border-[#E6EFE9]" />

      <section className="bg-white">
        <div className="py-2">
          <div>
            <h2 className="text-[1.15rem] font-semibold text-gray-950 sm:text-[1.2rem]">Existing Roles</h2>
            <p className="mt-2 text-sm text-gray-600">View and manage your existing roles.</p>
          </div>
        </div>
        <div className="mt-7 hidden space-y-2 md:block">
          {roles.map((role) => (
            <div
              key={role._id}
              className="flex flex-col gap-3 rounded-md bg-[#F8F8F8] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-40 text-[1rem] font-medium text-gray-800">
                {role.name}
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-x-8 gap-y-2 text-[1rem]">
                {role.permissions.map((permission) => (
                  <span key={permission} className="text-[#27AE60]">
                    {permissionLabels[permission] ?? permission}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-gray-800">
                <button
                  type="button"
                  onClick={() => handleEditRole(role)}
                  className="transition hover:text-[#27AE60]"
                  aria-label={`Edit ${role.name}`}
                >
                  <FiEdit2 className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleRoleMutation.mutate({
                      id: role._id,
                      isActive: role.isActive === false,
                    })
                  }
                  className="transition hover:text-red-500"
                  aria-label={`${role.isActive === false ? "Activate" : "Deactivate"} ${role.name}`}
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-7 space-y-3 md:hidden">
          {roles.map((role, index) => (
            <div
              key={role._id}
              className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{role.name}</h3>
                  <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRoleTone(index)}`}>
                    {role.permissions.length} permissions
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-800">
                  <button
                    type="button"
                    onClick={() => handleEditRole(role)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#27AE60] transition hover:bg-[#F4FCF6]"
                    aria-label={`Edit ${role.name}`}
                  >
                    <FiEdit2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      toggleRoleMutation.mutate({
                        id: role._id,
                        isActive: role.isActive === false,
                      })
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#D92D20] transition hover:bg-[#FEF3F2]"
                    aria-label={`${role.isActive === false ? "Activate" : "Deactivate"} ${role.name}`}
                  >
                    <FiTrash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {role.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-full bg-[#EAF8EF] px-2.5 py-1 text-xs font-medium text-[#1D8E4A]"
                  >
                    {permissionLabels[permission] ?? permission}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="py-2">
          <div>
            <h2 className="text-[1.15rem] font-semibold text-gray-950 sm:text-[1.2rem]">Team Members</h2>
            <p className="mt-2 text-sm text-gray-600">People who can access this builder workspace.</p>
          </div>
        </div>
        <div className="mt-7 hidden overflow-x-auto rounded-md border border-[#E3E3E3] md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#F4FCF6] text-[1rem] text-[#6B7280]">
              <tr>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Email</th>
                <th className="px-3 py-3 font-semibold">Number</th>
                <th className="px-3 py-3 font-semibold">Role</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {members.map((member) => (
                <tr key={member._id} className="border-b border-[#E6E6E6] last:border-0">
                  <td className="px-3 py-3 text-[1rem] text-gray-800">
                    {member.userId?.name || "Member"}
                  </td>
                  <td className="px-3 py-3 text-[1rem] text-gray-800">
                    {member.userId?.email || "-"}
                  </td>
                  <td className="px-3 py-3 text-[1rem] text-gray-800">
                    {member.userId?.phone || "-"}
                  </td>
                  <td className="px-3 py-3 text-[1rem] text-gray-800">
                    {member.builderRoleId?.name || "-"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditMember(member)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#27AE60] transition hover:bg-[#F4FCF6]"
                        aria-label={`Edit ${member.userId?.name || "member"}`}
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toggleMemberMutation.mutate({
                            id: member._id,
                            isActive: member.isActive === false,
                          })
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#D92D20] transition hover:bg-[#FEF3F2]"
                        aria-label={`${member.isActive === false ? "Activate" : "Deactivate"} ${member.userId?.name || "member"}`}
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!members.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    No team members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-7 space-y-3 md:hidden">
          {members.map((member) => (
            <div
              key={member._id}
              className="rounded-xl border border-[#E3E3E3] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {member.userId?.name || "Member"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {member.builderRoleId?.name || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditMember(member)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#27AE60] transition hover:bg-[#F4FCF6]"
                    aria-label={`Edit ${member.userId?.name || "member"}`}
                  >
                    <FiEdit2 className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      toggleMemberMutation.mutate({
                        id: member._id,
                        isActive: member.isActive === false,
                      })
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#D92D20] transition hover:bg-[#FEF3F2]"
                    aria-label={`${member.isActive === false ? "Activate" : "Deactivate"} ${member.userId?.name || "member"}`}
                  >
                    <FiTrash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 rounded-lg bg-[#F8FBF9] p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-1 break-all text-sm text-gray-700">{member.userId?.email || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Number</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {member.userId?.phone ? `${INDIA_DIAL_CODE} ${getPhoneDigits(member.userId.phone)}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!members.length && (
            <div className="rounded-xl border border-dashed border-[#DADADA] px-4 py-8 text-center text-gray-500">
              No team members yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
