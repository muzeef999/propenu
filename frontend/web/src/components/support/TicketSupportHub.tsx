"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getHighlightProjectBuilders, getMyProperties } from "@/data/ClientData";
import { ArrowDropdownIcon } from "@/icons/icons";
import {
  FiAlertCircle,
  FiClock,
  FiFilter,
  FiPaperclip,
  FiPlus,
  FiX,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiShield,
  FiUserCheck,
} from "react-icons/fi";

type Role = "user" | "builder" | "agent";
type Priority = "low" | "medium" | "high" | "urgent";
type Status =
  | "open"
  | "in_progress"
  | "waiting_for_customer"
  | "waiting_for_internal_team"
  | "resolved"
  | "closed"
  | "reopened";

type Ticket = {
  _id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category?: string;
  department?: string;
  propertyId?: string;
  dueAt?: string;
  createdAt?: string;
  updatedAt?: string;
  requester?: { name?: string; userId?: string; email?: string };
  assignedTo?: { name?: string; userId?: string };
  attachments?: { url: string; name?: string }[];
  comments?: {
    _id?: string;
    message: string;
    visibility: "public" | "internal";
    author?: { name?: string; role?: string };
    createdAt?: string;
  }[];
};

type TicketForm = {
  title: string;
  description: string;
  category: string;
  relatedId: string;
  priority: Priority;
};

type RelatedItem = {
  id: string;
  label: string;
  meta: string;
  kind: "property" | "project";
};

const config = {
  user: {
    title: "Support Center",
    eyebrow: "Your help desk",
    description: "Create a ticket, attach proof, and track support replies in one simple place.",
    action: "Create Ticket",
    listTitle: "My Tickets",
    department: "support",
    requesterRole: "customer",
    categories: ["Property Verification", "Owner Contact", "Payment", "Technical", "Account"],
    relatedLabel: "Related property",
    relatedEmpty: "No properties found. You can still create a general support ticket.",
  },
  builder: {
    title: "Builder Support",
    eyebrow: "Project assistance",
    description: "Raise project, listing, verification, lead, and payment issues with clear ownership.",
    action: "Create Project Ticket",
    listTitle: "Project Tickets",
    department: "builder-success",
    requesterRole: "builder",
    categories: ["Verification", "Listing Approval", "Leads", "Payment", "Technical"],
    relatedLabel: "Related project",
    relatedEmpty: "No projects found. Create a general builder support ticket.",
  },
  agent: {
    title: "Agent Support Workspace",
    eyebrow: "Resolution desk",
    description: "Resolve assigned tickets, reply publicly, and keep internal notes for your team.",
    action: "Log Ticket",
    listTitle: "Ticket Queue",
    department: "agent-support",
    requesterRole: "agent",
    categories: ["Lead Issue", "Property Issue", "Customer Request", "Payment", "Technical"],
    relatedLabel: "Related property or project",
    relatedEmpty: "No linked properties or projects found. Create a general agent ticket.",
  },
} as const;

const statusLabel: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_for_customer: "Waiting Customer",
  waiting_for_internal_team: "Internal Team",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const statusTone: Record<Status, string> = {
  open: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-blue-50 text-blue-700",
  waiting_for_customer: "bg-amber-50 text-amber-700",
  waiting_for_internal_team: "bg-violet-50 text-violet-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-slate-100 text-slate-600",
  reopened: "bg-red-50 text-red-700",
};

const priorityTone: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

const cx = (...items: Array<string | false | undefined>) =>
  items.filter(Boolean).join(" ");

const apiUrl = (path: string) => {
  const raw =
    process.env.NEXT_PUBLIC_TICKET_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  return `${raw.replace(/\/$/, "")}${path}`;
};

const readUser = () => {
  if (typeof window === "undefined") return { id: "guest-user", name: "Propenu User", email: "" };
  return {
    id: localStorage.getItem("userId") || localStorage.getItem("id") || localStorage.getItem("_id") || "guest-user",
    name: localStorage.getItem("name") || localStorage.getItem("userName") || "Propenu User",
    email: localStorage.getItem("email") || "",
  };
};

const dateLabel = (value?: string) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const flattenProperties = (data: any): RelatedItem[] => {
  if (!data) return [];

  const groups = Array.isArray(data)
    ? { properties: data }
    : {
        residential: data.residential,
        commercial: data.commercial,
        land: data.land,
        agricultural: data.agricultural,
        properties: data.properties,
        data: data.data,
      };

  return Object.entries(groups).flatMap(([kind, value]) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item?._id)
      .map((item) => ({
        id: String(item._id),
        label: item.title || item.projectName || item.name || "Untitled property",
        meta: [kind, item.city || item.locality || item.address].filter(Boolean).join(" • "),
        kind: "property" as const,
      }));
  });
};

const normalizeProjects = (data: any): RelatedItem[] => {
  const list = Array.isArray(data) ? data : data?.data ?? data?.projects ?? [];
  if (!Array.isArray(list)) return [];

  return list
    .filter((item) => item?._id)
    .map((item) => ({
      id: String(item._id),
      label: item.title || item.projectName || item.name || "Untitled project",
      meta: ["project", item.city || item.locality || item.state].filter(Boolean).join(" • "),
      kind: "project" as const,
    }));
};

export default function TicketSupportHub({ role }: { role: Role }) {
  const copy = config[role];
  const user = useMemo(readUser, []);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TicketForm>({
    title: "",
    description: "",
    category: copy.categories[0],
    relatedId: "",
    priority: "medium" as Priority,
  });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const relatedDropdownRef = useRef<HTMLDivElement | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);
  const priorityDropdownRef = useRef<HTMLDivElement | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket._id === selectedId) || tickets[0],
    [selectedId, tickets],
  );

  const metrics = useMemo(
    () => ({
      active: tickets.filter((ticket) => ["open", "in_progress", "reopened"].includes(ticket.status)).length,
      urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
      waiting: tickets.filter((ticket) => ticket.status.startsWith("waiting")).length,
      resolved: tickets.filter((ticket) => ["resolved", "closed"].includes(ticket.status)).length,
    }),
    [tickets],
  );

  const selectedRelated = useMemo(
    () => relatedItems.find((item) => item.id === form.relatedId),
    [form.relatedId, relatedItems],
  );

  const filteredRelatedItems = useMemo(() => {
    const query = relatedSearch.trim().toLowerCase();
    if (!query) return relatedItems;

    return relatedItems.filter((item) =>
      [item.label, item.meta, item.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [relatedItems, relatedSearch]);

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "30", sortBy: "updatedAt" });
      if (role === "agent") params.set("assignedTo", user.id);
      else params.set("requesterId", user.id);
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("q", search.trim());

      const response = await fetch(apiUrl(`/api/tickets?${params.toString()}`), { cache: "no-store" });
      if (!response.ok) throw new Error("Ticket service is not reachable");
      const result = await response.json();
      const data = (result.data ?? []) as Ticket[];
      setTickets(data);
      setSelectedId((current) => current || data[0]?._id || "");
    } catch (err: any) {
      setError(err.message || "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, status]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (relatedDropdownRef.current && !relatedDropdownRef.current.contains(target)) {
        setRelatedOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(target)) {
        setCategoryOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(target)) {
        setPriorityOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(target)) {
        setStatusDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRelatedOpen(false);
        setCategoryOpen(false);
        setPriorityOpen(false);
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRelatedItems = async () => {
      setRelatedLoading(true);
      try {
        if (role === "builder") {
          const projects = normalizeProjects(await getHighlightProjectBuilders());
          if (mounted) setRelatedItems(projects);
          return;
        }

        if (role === "agent") {
          const [propertiesResult, projectsResult] = await Promise.allSettled([
            getMyProperties(),
            getHighlightProjectBuilders(),
          ]);

          const properties =
            propertiesResult.status === "fulfilled"
              ? flattenProperties(propertiesResult.value)
              : [];
          const projects =
            projectsResult.status === "fulfilled"
              ? normalizeProjects(projectsResult.value)
              : [];

          const unique = new Map<string, RelatedItem>();
          [...properties, ...projects].forEach((item) => {
            unique.set(`${item.kind}:${item.id}`, item);
          });
          if (mounted) setRelatedItems(Array.from(unique.values()));
          return;
        }

        const properties = flattenProperties(await getMyProperties());
        if (mounted) setRelatedItems(properties);
      } catch {
        if (mounted) setRelatedItems([]);
      } finally {
        if (mounted) setRelatedLoading(false);
      }
    };

    loadRelatedItems();

    return () => {
      mounted = false;
    };
  }, [role]);

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const related = relatedItems.find((item) => item.id === form.relatedId);
      const attachments = files.map((file) => ({
        url: `local-file://${encodeURIComponent(file.name)}`,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }));
      const response = await fetch(apiUrl("/api/tickets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          requester: { userId: user.id, name: user.name, email: user.email },
          category: form.category,
          department: copy.department,
          propertyId: form.relatedId || undefined,
          priority: form.priority,
          source: "web",
          tags: [
            role,
            related?.kind || "general",
            form.category.toLowerCase().replace(/\s+/g, "-"),
          ],
          attachments,
        }),
      });
      if (!response.ok) throw new Error("Ticket could not be created");
      setForm({ title: "", description: "", category: copy.categories[0], relatedId: "", priority: "medium" });
      setFiles([]);
      await loadTickets();
    } catch (err: any) {
      setError(err.message || "Ticket could not be created");
    } finally {
      setSubmitting(false);
    }
  };

  const sendComment = async (visibility: "public" | "internal") => {
    const message = visibility === "internal" ? note : reply;
    if (!selected?._id || !message.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/ticket-comments/tickets/${selected._id}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          visibility,
          author: {
            userId: user.id,
            name: user.name,
            role: visibility === "internal" ? "agent" : copy.requesterRole,
          },
        }),
      });
      if (!response.ok) throw new Error("Reply could not be sent");
      setReply("");
      setNote("");
      await loadTickets();
    } catch (err: any) {
      setError(err.message || "Reply could not be sent");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (nextStatus: Status) => {
    if (!selected?._id) return;
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl(`/api/tickets/${selected._id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, actor: { userId: user.id, name: user.name, role } }),
      });
      if (!response.ok) throw new Error("Status could not be updated");
      await loadTickets();
    } catch (err: any) {
      setError(err.message || "Status could not be updated");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="overflow-visible rounded-[10px] border border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/70 shadow-sm">
        <div className="grid items-start gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:p-5 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="rounded-[10px] p-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27A361]">{copy.eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">{copy.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{copy.description}</p>
            </div>
            <div className="mt-5 grid max-w-3xl grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="Active" value={metrics.active} icon={<FiClock />} />
              <Metric label="Urgent" value={metrics.urgent} icon={<FiAlertCircle />} />
              <Metric label="Waiting" value={metrics.waiting} icon={<FiUserCheck />} />
              <Metric label="Resolved" value={metrics.resolved} icon={<FiShield />} />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-gray-600 lg:grid-cols-3">
              <div className="rounded-lg border border-emerald-100 bg-white/75 p-3">
                <p className="font-semibold text-gray-900">Smart routing</p>
                <p className="mt-1 text-xs leading-5">Tickets are linked to the right property or project.</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white/75 p-3">
                <p className="font-semibold text-gray-900">Clear proof</p>
                <p className="mt-1 text-xs leading-5">Upload screenshots or files with every request.</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white/75 p-3">
                <p className="font-semibold text-gray-900">Fast updates</p>
                <p className="mt-1 text-xs leading-5">Track replies, status, and ownership in one view.</p>
              </div>
            </div>
          </div>

          <form onSubmit={createTicket} className="rounded-[10px] border border-gray-100 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-950">{copy.action}</h2>
                <p className="text-xs text-gray-500">Add clear details for faster resolution.</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#27A361]">
                <FiPlus size={19} />
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <div ref={categoryDropdownRef} className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => setCategoryOpen((prev) => !prev)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
                  >
                    <span className="truncate">{form.category || "Select Category"}</span>
                    <ArrowDropdownIcon
                      size={12}
                      color="#111827"
                      className={`transition-transform duration-200 ${
                        categoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {categoryOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-60 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <div className="pointer-events-none absolute -top-2 left-6">
                        <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                      </div>
                      <h4 className="mb-2 text-sm font-semibold">Select Category</h4>
                      <div className="flex flex-col gap-1">
                        {copy.categories.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, category: item }));
                              setCategoryOpen(false);
                            }}
                            className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                              form.category === item
                                ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Priority">
                <div ref={priorityDropdownRef} className="relative mt-2">
                  <button
                    type="button"
                    onClick={() => setPriorityOpen((prev) => !prev)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
                  >
                    <span className="truncate capitalize">{form.priority || "Select Priority"}</span>
                    <ArrowDropdownIcon
                      size={12}
                      color="#111827"
                      className={`transition-transform duration-200 ${
                        priorityOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {priorityOpen && (
                    <div className="absolute left-0 top-[calc(100%+8px)] z-60 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <div className="pointer-events-none absolute -top-2 left-6">
                        <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                      </div>
                      <h4 className="mb-2 text-sm font-semibold">Select Priority</h4>
                      <div className="flex flex-col gap-1">
                        {(["low", "medium", "high", "urgent"] as const).map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, priority: item }));
                              setPriorityOpen(false);
                            }}
                            className={`rounded px-3 py-2 text-left text-sm transition-colors capitalize ${
                              form.priority === item
                                ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Field>
            </div>
            <Field label={copy.relatedLabel}>
              <div ref={relatedDropdownRef} className="relative mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRelatedOpen((prev) => !prev);
                    setRelatedSearch("");
                  }}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-[#ECECEC] bg-[#F3F3F3] px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A] focus:bg-white"
                >
                  <span className="truncate">
                    {relatedLoading
                      ? "Loading related items..."
                      : selectedRelated?.label || "General support ticket"}
                  </span>
                  <ArrowDropdownIcon
                    size={12}
                    color="#111827"
                    className={`transition-transform duration-200 shrink-0 ${
                      relatedOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {relatedOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-60 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                    <div className="pointer-events-none absolute -top-2 left-6">
                      <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                    </div>
                    <div className="border-b border-gray-100 pb-2 mb-2">
                      <label className="relative block">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={relatedSearch}
                          onChange={(event) => setRelatedSearch(event.target.value)}
                          autoFocus
                          placeholder={`Search ${copy.relatedLabel.toLowerCase()}`}
                          className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#27A361] focus:bg-white"
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setRelatedOpen(false);
                          }}
                        />
                      </label>
                    </div>

                    <div className="max-h-64 overflow-y-auto flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, relatedId: "" }));
                          setRelatedOpen(false);
                          setRelatedSearch("");
                        }}
                        className={`rounded px-3 py-2 text-left transition-colors flex items-start gap-3 ${
                          !form.relatedId
                            ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#27A361]" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            General support ticket
                          </span>
                          <span className="block text-xs opacity-80">
                            Use this when the issue is not linked to a specific item.
                          </span>
                        </span>
                      </button>

                      {relatedLoading ? (
                        <p className="px-3 py-4 text-sm text-gray-500">
                          Loading related items...
                        </p>
                      ) : filteredRelatedItems.length > 0 ? (
                        filteredRelatedItems.map((item) => (
                          <button
                            type="button"
                            key={`${item.kind}:${item.id}`}
                            onClick={() => {
                              setForm((p) => ({ ...p, relatedId: item.id }));
                              setRelatedOpen(false);
                              setRelatedSearch("");
                            }}
                            className={`rounded px-3 py-2 text-left transition-colors flex items-start gap-3 ${
                              form.relatedId === item.id
                                ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span
                              className={cx(
                                "mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                item.kind === "project"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {item.kind}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">
                                {item.label}
                              </span>
                              <span className="block truncate text-xs opacity-80">
                                {item.meta || item.id}
                              </span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4">
                          <p className="text-sm font-medium text-gray-700">
                            No matching result
                          </p>
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {relatedItems.length === 0
                              ? copy.relatedEmpty
                              : "Try searching by title, location, project, or property type."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!relatedLoading && relatedItems.length === 0 && (
                  <p className="mt-2 text-[11px] leading-5 text-gray-500">
                    {copy.relatedEmpty}
                  </p>
                )}
              </div>
            </Field>
            <Field label="Subject">
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Example: Verification is pending" className="support-input" />
            </Field>
            <Field label="Description">
              <textarea required rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Tell us what happened and what you need." className="support-input resize-none" />
            </Field>
            <Field label="Attachments">
              <div className="mt-2 rounded-lg border border-dashed border-emerald-200 bg-white p-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md bg-emerald-50/60 px-4 py-3 text-center transition hover:bg-emerald-50">
                  <FiPaperclip className="mb-2 text-[#27A361]" size={20} />
                  <span className="text-sm font-semibold text-gray-800">
                    Upload screenshots or documents
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    PNG, JPG, PDF or DOC files up to your browser limit
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files ?? []);
                      setFiles((prev) => [...prev, ...selectedFiles]);
                      e.target.value = "";
                    }}
                  />
                </label>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.lastModified}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-800">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="rounded-full p-1 text-gray-400 hover:bg-white hover:text-red-500"
                          aria-label={`Remove ${file.name}`}
                        >
                          <FiX size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <button disabled={submitting} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#27A361] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#208650] disabled:opacity-60">
              <FiSend /> {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      </section>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[10px] border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">{copy.listTitle}</h2>
                <p className="text-sm text-gray-500">{tickets.length} ticket{tickets.length === 1 ? "" : "s"} found</p>
              </div>
              <button onClick={loadTickets} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:border-[#27A361] hover:text-[#27A361]">
                <FiRefreshCw /> Refresh
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
              <label className="relative block">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadTickets()} placeholder="Search tickets" className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#27A361]" />
              </label>
              <div ref={statusDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setStatusDropdownOpen((prev) => !prev)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition hover:border-[#D7E7DC] focus:border-[#16A34A]"
                >
                  <span className="flex items-center gap-2 truncate">
                    <FiFilter className="text-gray-400 shrink-0" />
                    {status === "all" ? "All Status" : statusLabel[status as Status]}
                  </span>
                  <ArrowDropdownIcon
                    size={12}
                    color="#111827"
                    className={`transition-transform duration-200 shrink-0 ${
                      statusDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {statusDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-60 w-48 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                    <div className="pointer-events-none absolute -top-2 right-6">
                      <div className="h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white" />
                    </div>
                    <h4 className="mb-2 text-sm font-semibold">Filter Status</h4>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStatus("all");
                          setStatusDropdownOpen(false);
                        }}
                        className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                          status === "all"
                            ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        All Status
                      </button>
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setStatus(value);
                            setStatusDropdownOpen(false);
                          }}
                          className={`rounded px-3 py-2 text-left text-sm transition-colors ${
                            status === value
                              ? "bg-[#D1EFDD] font-medium text-[#15803D]"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="max-h-[680px] overflow-y-auto">
            {loading ? <EmptyText text="Loading tickets..." /> : tickets.length === 0 ? <EmptyText text="No tickets yet. Create your first ticket from the form above." /> : tickets.map((ticket) => (
              <button key={ticket._id} onClick={() => setSelectedId(ticket._id)} className={cx("block w-full border-b border-gray-100 p-4 text-left transition hover:bg-emerald-50/50", selected?._id === ticket._id && "bg-emerald-50/80 shadow-[inset_3px_0_0_#27A361]")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-950">{ticket.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{ticket.description}</p>
                  </div>
                  <span className={cx("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ring-black/5", priorityTone[ticket.priority])}>{ticket.priority}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-black/5", statusTone[ticket.status])}>{statusLabel[ticket.status]}</span>
                  {ticket.category && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600">{ticket.category}</span>}
                  <span className="text-[11px] text-gray-400">Updated {dateLabel(ticket.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Detail role={role} ticket={selected} reply={reply} note={note} submitting={submitting} setReply={setReply} setNote={setNote} sendComment={sendComment} changeStatus={changeStatus} />
      </section>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-emerald-100 bg-white/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-950">{value}</p></div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#27A361]">{icon}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-3 block text-xs font-medium text-gray-600">{label}{children}</label>;
}

function EmptyText({ text }: { text: string }) {
  return <div className="p-6 text-sm text-gray-500">{text}</div>;
}

function Detail({ role, ticket, reply, note, submitting, setReply, setNote, sendComment, changeStatus }: {
  role: Role;
  ticket?: Ticket;
  reply: string;
  note: string;
  submitting: boolean;
  setReply: (value: string) => void;
  setNote: (value: string) => void;
  sendComment: (visibility: "public" | "internal") => void;
  changeStatus: (status: Status) => void;
}) {
  if (!ticket) return <div className="rounded-[10px] border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Select a ticket to see details.</div>;
  const publicComments = ticket.comments?.filter((item) => item.visibility === "public") ?? [];
  const internalComments = ticket.comments?.filter((item) => item.visibility === "internal") ?? [];

  return (
    <div className="overflow-hidden rounded-[10px] border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-linear-to-br from-white to-emerald-50/50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#27A361]">Ticket Detail</p>
            <h2 className="mt-2 text-xl font-semibold text-gray-950">{ticket.title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{ticket.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={cx("rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-black/5", statusTone[ticket.status])}>{statusLabel[ticket.status]}</span>
            <span className={cx("rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ring-black/5", priorityTone[ticket.priority])}>{ticket.priority}</span>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Info label="Requester" value={ticket.requester?.name || "Customer"} />
          <Info label="Department" value={ticket.department || "Support"} />
          <Info label="Property" value={ticket.propertyId || "Not linked"} />
          <Info label="Due" value={dateLabel(ticket.dueAt)} />
        </div>
        {role === "agent" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Action onClick={() => changeStatus("in_progress")} disabled={submitting} label="Start Progress" />
            <Action onClick={() => changeStatus("waiting_for_customer")} disabled={submitting} label="Wait Customer" />
            <Action onClick={() => changeStatus("resolved")} disabled={submitting} label="Resolve Ticket" />
          </div>
        )}
      </div>
      <div className="grid xl:grid-cols-[1fr_280px]">
        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-950">Conversation</h3>
          <div className="mt-3 space-y-3">
            {publicComments.length === 0 ? <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No public replies yet.</div> : publicComments.map((comment, index) => (
              <div key={comment._id || index} className="rounded-lg bg-gray-50 p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-700">{comment.author?.name || "Support"}</p>
                  <span className="text-[11px] text-gray-400">{dateLabel(comment.createdAt)}</span>
                </div>
                <p className="text-sm leading-6 text-gray-700">{comment.message}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[10px] border border-gray-100 bg-[#FBFFFD] p-4">
            <label className="text-xs font-semibold text-gray-600">Public Reply</label>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder="Write a clear update..." className="support-input resize-none" />
            <button onClick={() => sendComment("public")} disabled={submitting || !reply.trim()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#27A361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#208650] disabled:opacity-60"><FiSend /> Send Reply</button>
          </div>
          {role === "agent" && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <label className="text-xs font-semibold text-amber-800">Internal Note</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Visible only to support team." className="mt-2 w-full resize-none rounded-md border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400" />
              <button onClick={() => sendComment("internal")} disabled={submitting || !note.trim()} className="mt-3 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60">Save Internal Note</button>
              {internalComments.length > 0 && <div className="mt-4 space-y-2">{internalComments.map((comment, index) => <p key={comment._id || index} className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-amber-900">{comment.message}</p>)}</div>}
            </div>
          )}
        </div>
        <aside className="border-t border-gray-100 bg-gray-50/50 p-5 xl:border-l xl:border-t-0">
          <div className="mb-3 flex items-center gap-2"><FiPaperclip className="text-[#27A361]" /><h3 className="text-sm font-semibold text-gray-950">Attachments</h3></div>
          <div className="space-y-2">
            {ticket.attachments?.length ? ticket.attachments.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-md border border-gray-100 px-3 py-2 text-xs text-gray-700 hover:border-[#27A361] hover:text-[#27A361]">{item.name || "Attachment"}</a>) : <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">No attachments</p>}
          </div>
          <div className="mt-6 space-y-2 text-xs text-gray-600">
            <h3 className="text-sm font-semibold text-gray-950">Ownership</h3>
            <p className="rounded-md bg-gray-50 px-3 py-2">Assigned: {ticket.assignedTo?.name || "Not assigned"}</p>
            <p className="rounded-md bg-gray-50 px-3 py-2">Category: {ticket.category || "General"}</p>
            <p className="rounded-md bg-gray-50 px-3 py-2">Created: {dateLabel(ticket.createdAt)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-sm"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-gray-800">{value}</p></div>;
}

function Action({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">{label}</button>;
}
