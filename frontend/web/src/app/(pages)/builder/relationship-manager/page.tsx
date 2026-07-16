"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSupportTicket,
  createRequestCallTicket,
  deleteTicket,
  getFeaturedProjectsDashboard,
  getTickets,
  getHighlightProjectBuilders,
  me,
} from "@/data/ClientData";
import { RequestCallSvg } from "@/icons/icons";
import {
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiEdit2,
  FiFileText,
  FiPaperclip,
  FiShield,
  FiTrash2,
  FiX,
} from "react-icons/fi";

type BuilderProject = {
  _id?: string;
  id?: string;
  title?: string;
  projectName?: string;
  name?: string;
  city?: string;
  locality?: string;
  categoryType?: string;
  propertyType?: string;
  relationshipManager?: {
    userId?: string | RelationshipManager;
    designation?: string;
    availability?: string;
    responseTime?: string;
  } | null;
  relationshipManagerId?: string | RelationshipManager;
};

type RelationshipManager = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  profileImage?: string;
  avatar?: string;
};

const REQUEST_CATEGORIES = [
  "Verification",
  "Listing Approval",
  "Leads",
  "Payment",
  "Technical",
] as const;

const TICKET_CATEGORIES = [
  "Verification",
  "Listing Approval",
  "Leads",
  "Payment",
  "Technical",
] as const;

const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

const TIME_SLOTS = [
  "11:00 AM",
  "12:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const GENERAL_SUPPORT_NAME = "General support ticket";
const DEFAULT_MANAGER_NAME = "Relationship Manager";
const DEFAULT_MANAGER_ROLE = "Relationship Manager";
const DEFAULT_MANAGER_AVAILABILITY = "11:00 AM - 6:00 PM";
const DEFAULT_MANAGER_RESPONSE = "within 24 Hours";

type TicketRow = {
  _id?: string;
  title?: string;
  category?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
};

const getProjectId = (project: BuilderProject) =>
  project._id || project.id || "";

const getProjectName = (project: BuilderProject) =>
  project.title || project.projectName || project.name || "Untitled Project";

const getRelationshipManager = (project?: BuilderProject | null) => {
  if (project?.relationshipManagerId) {
    return typeof project.relationshipManagerId === "string"
      ? null
      : project.relationshipManagerId;
  }
  if (project?.relationshipManager?.userId) {
    return typeof project.relationshipManager.userId === "string"
      ? null
      : project.relationshipManager.userId;
  }
  return null;
};

const formatShortDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const formatCallDateTime = (date?: string, timeSlot?: string) => {
  const shortDate = formatShortDate(date);
  return timeSlot ? `${shortDate} • ${timeSlot}` : shortDate;
};

const toLabelCase = (value?: string) => {
  if (!value) return "-";
  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const page = () => {
  const queryClient = useQueryClient();
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isRequestCallOpen, setIsRequestCallOpen] = useState(false);
  const [selectedDisplayProjectId, setSelectedDisplayProjectId] = useState("");
  const [ticketCategoryOpen, setTicketCategoryOpen] = useState(false);
  const [ticketPriorityOpen, setTicketPriorityOpen] = useState(false);
  const [selectedTicketCategory, setSelectedTicketCategory] = useState<
    (typeof TICKET_CATEGORIES)[number]
  >("Verification");
  const [selectedTicketPriority, setSelectedTicketPriority] = useState<
    (typeof TICKET_PRIORITIES)[number]
  >("Medium");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketAttachmentName, setTicketAttachmentName] = useState("");
  const [selectedTime, setSelectedTime] = useState("12:00 PM");
  const [selectedCategory, setSelectedCategory] = useState<
    (typeof REQUEST_CATEGORIES)[number]
  >("Verification");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [subject, setSubject] = useState("");

  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: me,
  });

  const requesterId = userQuery.data?.user?.id || userQuery.data?.user?._id;

  const projectsQuery = useQuery({
    queryKey: ["highlight-projects-builder"],
    queryFn: async () => {
      const [regularProjects, primeProjects] = await Promise.all([
        getHighlightProjectBuilders(),
        getFeaturedProjectsDashboard(),
      ]);

      return {
        regularProjects,
        primeProjects,
      };
    },
  });

  const ticketsQuery = useQuery({
    queryKey: [
      "relationship-manager-tickets",
      requesterId,
      selectedDisplayProjectId,
    ],
    queryFn: () =>
      getTickets({
        requesterId,
        module: "relationship_manager",
        relatedProjectId: selectedDisplayProjectId || undefined,
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    enabled: Boolean(requesterId && selectedDisplayProjectId),
  });

  const projects = useMemo<BuilderProject[]>(() => {
    const data = projectsQuery.data;
    const regularProjects = Array.isArray(data?.regularProjects)
      ? data.regularProjects
      : Array.isArray(data?.regularProjects?.data)
        ? data.regularProjects.data
        : [];

    const primeProjects = Array.isArray(data?.primeProjects)
      ? data.primeProjects
      : Array.isArray(data?.primeProjects?.data)
        ? data.primeProjects.data
        : [];

    const uniqueProjects = new Map<string, BuilderProject>();

    [...primeProjects, ...regularProjects].forEach((project) => {
      const projectId = getProjectId(project);
      if (projectId) {
        uniqueProjects.set(projectId, project);
      }
    });

    return Array.from(uniqueProjects.values());
  }, [projectsQuery.data]);

  const hasProjects = projects.length > 0;

  useEffect(() => {
    if (!selectedDisplayProjectId && projects.length) {
      setSelectedDisplayProjectId(getProjectId(projects[0]));
    }
  }, [projects, selectedDisplayProjectId]);

  const activeProject = useMemo(
    () =>
      projects.find((project) => getProjectId(project) === selectedDisplayProjectId) ||
      projects[0] ||
      null,
    [projects, selectedDisplayProjectId],
  );

  const activeRelationshipManager = useMemo(
    () => getRelationshipManager(activeProject),
    [activeProject],
  );

  const hasAssignedManager = Boolean(activeRelationshipManager);

  const managerName = activeRelationshipManager?.name || DEFAULT_MANAGER_NAME;
  const managerRole =
    activeProject?.relationshipManager?.designation || DEFAULT_MANAGER_ROLE;
  const managerAvailability =
    activeProject?.relationshipManager?.availability ||
    DEFAULT_MANAGER_AVAILABILITY;
  const managerResponseTime =
    activeProject?.relationshipManager?.responseTime || DEFAULT_MANAGER_RESPONSE;
  const managerImage =
    activeRelationshipManager?.profileImage ||
    activeRelationshipManager?.avatar ||
    "/images/UserPlaceholder.webp";

  const ticketRows = useMemo<TicketRow[]>(() => {
    const data = ticketsQuery.data?.data;
    return Array.isArray(data) ? data : [];
  }, [ticketsQuery.data]);

  const supportTickets = useMemo(
    () =>
      ticketRows.filter((ticket) => ticket.category !== "request_call"),
    [ticketRows],
  );

  const callRequests = useMemo(
    () => ticketRows.filter((ticket) => ticket.category === "request_call"),
    [ticketRows],
  );

  const requestCallMutation = useMutation({
    mutationFn: createRequestCallTicket,
    onSuccess: () => {
      toast.success("Call request submitted successfully");
      queryClient.invalidateQueries({
        queryKey: [
          "relationship-manager-tickets",
          requesterId,
          selectedDisplayProjectId,
        ],
      });
      setIsRequestCallOpen(false);
      setSelectedTime("12:00 PM");
      setSelectedCategory("Verification");
      setCategoryOpen(false);
      setSelectedDate("");
      setSubject("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to submit call request",
      );
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      toast.success("Ticket submitted successfully");
      queryClient.invalidateQueries({
        queryKey: [
          "relationship-manager-tickets",
          requesterId,
          selectedDisplayProjectId,
        ],
      });
      setIsTicketOpen(false);
      setTicketCategoryOpen(false);
      setTicketPriorityOpen(false);
      setSelectedTicketCategory("Verification");
      setSelectedTicketPriority("Medium");
      setTicketSubject("");
      setTicketDescription("");
      setTicketAttachmentName("");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to submit ticket",
      );
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      toast.success("Ticket deleted successfully");
      queryClient.invalidateQueries({
        queryKey: [
          "relationship-manager-tickets",
          requesterId,
          selectedDisplayProjectId,
        ],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete ticket",
      );
    },
  });

  const handleSubmitRequestCall = () => {
    const requester = userQuery.data?.user;

    if (!requester?.name) {
      toast.error("User details not found. Please login again.");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (!selectedTime) {
      toast.error("Please select a time slot");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    requestCallMutation.mutate({
      requester: {
        userId: requester.id || requester._id || undefined,
        name: requester.name,
        email: requester.email || undefined,
        phone: requester.phone || undefined,
      },
      date: new Date(selectedDate).toISOString(),
      timeSlot: selectedTime,
      category: selectedCategory,
      subject: subject.trim(),
      relationshipManagerName: managerName,
      relationshipManagerId:
        activeRelationshipManager?._id || activeRelationshipManager?.id,
      relatedProjectId: selectedDisplayProjectId || undefined,
      relatedProjectName: activeProject
        ? getProjectName(activeProject)
        : undefined,
      notes: activeProject
        ? `Related project: ${getProjectName(activeProject)}`
        : "General support ticket",
      source: "web",
    });
  };

  const handleSubmitTicket = () => {
    const requester = userQuery.data?.user;

    if (!requester?.name) {
      toast.error("User details not found. Please login again.");
      return;
    }

    if (!ticketSubject.trim()) {
      toast.error("Please enter ticket subject");
      return;
    }

    if (!ticketDescription.trim()) {
      toast.error("Please enter ticket description");
      return;
    }

    createTicketMutation.mutate({
      title: ticketSubject.trim(),
      description: ticketDescription.trim(),
      requester: {
        userId: requester.id || requester._id || undefined,
        name: requester.name,
        email: requester.email || undefined,
        phone: requester.phone || undefined,
      },
      assignedTo:
        activeRelationshipManager?._id || activeRelationshipManager?.id
          ? {
              userId:
                activeRelationshipManager?._id ||
                activeRelationshipManager?.id,
              name: managerName,
              email: activeRelationshipManager?.email || undefined,
              role: "relationship_manager",
            }
          : undefined,
      category: selectedTicketCategory,
      propertyId: selectedDisplayProjectId || undefined,
      priority: selectedTicketPriority.toLowerCase() as
        | "low"
        | "medium"
        | "high"
        | "urgent",
      source: "web",
      metadata: {
        module: "relationship_manager",
        requestType: "support_ticket",
        relatedProjectId: selectedDisplayProjectId || undefined,
        relatedProjectName: activeProject ? getProjectName(activeProject) : undefined,
        selectedManagerName: managerName,
        selectedManagerId:
          activeRelationshipManager?._id || activeRelationshipManager?.id,
        attachmentName: ticketAttachmentName || undefined,
      },
    });
  };

  return (
    <>
      {!hasProjects && !projectsQuery.isLoading ? (
        <div className="rounded-2xl border border-emerald-100 bg-[#f4fffb] p-8 text-center shadow-sm">
          <div className="mx-auto max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Dedicated Support
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
              Relationship Manager
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">
              No projects are available right now, so relationship manager
              details cannot be shown yet.
            </p>
          </div>
        </div>
      ) : (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-600">
              Dedicated Support
            </p>
            <h1 className="mt-1.5 text-[30px] font-semibold tracking-tight text-gray-900">
              Relationship Manager
            </h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-gray-500 sm:text-base">
              Connect with your dedicated Relationship Manager for onboarding,
              personalized assistance, call scheduling, and issue resolution.
            </p>
          </div>

          <div className="w-full lg:max-w-[320px] lg:self-start">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Select Project
              </span>
              <div className="relative mt-2">
                <select
                  value={selectedDisplayProjectId}
                  onChange={(event) =>
                    setSelectedDisplayProjectId(event.target.value)
                  }
                  className="h-11 w-full appearance-none rounded-lg border border-emerald-100 bg-white px-3.5 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-[#22c06f]"
                >
                  {projects.map((project) => (
                    <option
                      key={getProjectId(project)}
                      value={getProjectId(project)}
                    >
                      {getProjectName(project)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>
            </label>
          </div>
        </div>

        <section className="rounded-md bg-[#f4fffb] p-4 sm:p-5">
          {hasAssignedManager ? (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-[180px] w-full max-w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-[#dff7ee] to-[#bfead7]">
                  <Image
                    src={managerImage}
                    alt="Relationship manager placeholder"
                    width={180}
                    height={180}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight text-gray-900 sm:text-[28px]">
                      {managerName}
                    </h2>
                    <p className="mt-1 text-base text-gray-700 sm:text-[17px]">
                      {managerRole}
                    </p>

                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#d9f7e8] px-3 py-2 text-sm font-medium text-[#1ea764]">
                      <FiShield className="h-4 w-4" />
                      Your Dedicated Manager
                    </div>
                  </div>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-[15px]">
                    Your assigned relationship manager will help you with onboarding, answer questions, and coordinate support for this selected project.
                  </p>
                </div>
              </div>

              <div className="flex w-full shrink-0 lg:max-w-[320px] flex-col gap-4 lg:items-end">
                <div className="space-y-3 text-left lg:text-right">
                  <div>
                    <p className="flex items-start gap-2 text-sm text-gray-500 lg:justify-end">
                      <FiClock className="h-4 w-4 text-[#1ea764]" />
                      <span>Available Timings:</span>
                      <span className="whitespace-nowrap font-semibold text-gray-900">
                        {managerAvailability}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="flex items-start gap-2 text-sm text-gray-500 lg:justify-end">
                      <FiCalendar className="h-4 w-4 text-[#1ea764]" />
                      <span>Response time:</span>
                      <span className="whitespace-nowrap font-semibold text-gray-900">
                        {managerResponseTime}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col items-start gap-2.5 lg:items-end">
                  <button
                    type="button"
                    onClick={() => setIsTicketOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-[#22c06f] bg-white px-10.5 py-2.5 text-sm font-medium text-[#22c06f] transition hover:bg-[#f3fff8]"
                  >
                    <FiFileText className="h-4 w-4" />
                    Raise a ticket
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRequestCallOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#22c06f] px-10 py-2.5 text-sm font-medium text-white transition hover:bg-[#1cad63]"
                  >
                    <FiCalendar className="h-4 w-4" />
                    Request a Call
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-100 bg-white/70 p-8 text-center">
              <div className="mx-auto max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  Dedicated Support
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
                  No Relationship Manager Assigned
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-500 sm:text-base">
                  The selected project does not have a relationship manager assigned yet. Once a manager is mapped to this project, their support details will appear here.
                </p>
              </div>
            </div>
          )}
        </section>

        {hasAssignedManager ? (
        <section className="space-y-10">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-semibold tracking-tight text-gray-900">
                  Ticket Request
                </h2>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Your Submitted issues are listed below
                </p>
              </div>
              {supportTickets.length > 0 ? (
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-[#22b36a] transition hover:text-[#1cad63]"
                >
                  View All
                </button>
              ) : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-md border border-[#e8efea] bg-white">
              <div className="grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_0.9fr] gap-4 bg-[#eefbf4] px-4 py-3 text-sm font-semibold text-gray-900">
                <span>Subject</span>
                <span>Category</span>
                <span>Raised On</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {ticketsQuery.isLoading ? (
                <div className="border-t border-[#edf1ee] px-4 py-6 text-sm text-gray-500">
                  Loading ticket requests...
                </div>
              ) : supportTickets.length ? (
                supportTickets.map((row) => {
                  const muted = ["resolved", "closed"].includes(
                    String(row.status || "").toLowerCase(),
                  );

                  return (
                    <div
                      key={row._id}
                      className={`grid grid-cols-[2.2fr_1.2fr_1.2fr_1.2fr_0.9fr] gap-4 border-t border-[#edf1ee] px-4 py-3 text-sm sm:text-[15px] ${
                        muted ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span>{row.title || "-"}</span>
                      <span>{toLabelCase(row.category)}</span>
                      <span>{formatShortDate(row.createdAt)}</span>
                      <span>{toLabelCase(row.status)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`transition ${
                            muted
                              ? "text-gray-300"
                              : "text-gray-800 hover:text-[#22b36a]"
                          }`}
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!row._id || deleteTicketMutation.isPending}
                          onClick={() =>
                            row._id && deleteTicketMutation.mutate(row._id)
                          }
                          className={`transition ${
                            muted
                              ? "text-gray-300"
                              : "text-gray-800 hover:text-[#22b36a]"
                          } disabled:opacity-50`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border-t border-[#edf1ee] px-4 py-6 text-sm text-gray-500">
                  No ticket requests found.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-semibold tracking-tight text-gray-900">
                  Call Requests
                </h2>
                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                  Your Submitted Call requests are listed Below
                </p>
              </div>
              {callRequests.length > 0 ? (
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-[#22b36a] transition hover:text-[#1cad63]"
                >
                  View All
                </button>
              ) : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-md border border-[#e8efea] bg-white">
              <div className="grid grid-cols-[2fr_1.2fr_1.5fr_1.1fr_0.7fr] gap-4 bg-[#eefbf4] px-4 py-3 text-sm font-semibold text-gray-900">
                <span>Subject</span>
                <span>Category</span>
                <span>Date & Time</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {ticketsQuery.isLoading ? (
                <div className="border-t border-[#edf1ee] px-4 py-6 text-sm text-gray-500">
                  Loading call requests...
                </div>
              ) : callRequests.length ? (
                callRequests.map((row) => {
                  const muted = ["resolved", "closed", "completed"].includes(
                    String(row.status || "").toLowerCase(),
                  );
                  const scheduledDate = row.metadata?.scheduledDate as
                    | string
                    | undefined;
                  const timeSlot = row.metadata?.timeSlot as string | undefined;
                  const requestCategory =
                    (row.metadata?.requestCategory as string | undefined) ||
                    row.category;

                  return (
                    <div
                      key={row._id}
                      className={`grid grid-cols-[2fr_1.2fr_1.5fr_1.1fr_0.7fr] gap-4 border-t border-[#edf1ee] px-4 py-3 text-sm sm:text-[15px] ${
                        muted ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <span>{row.metadata?.subject || row.title || "-"}</span>
                      <span>{toLabelCase(requestCategory)}</span>
                      <span>{formatCallDateTime(scheduledDate, timeSlot)}</span>
                      <span>{toLabelCase(row.status)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={!row._id || deleteTicketMutation.isPending}
                          onClick={() =>
                            row._id && deleteTicketMutation.mutate(row._id)
                          }
                          className={`transition ${
                            muted
                              ? "text-gray-300"
                              : "text-gray-800 hover:text-[#22b36a]"
                          } disabled:opacity-50`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border-t border-[#edf1ee] px-4 py-6 text-sm text-gray-500">
                  No call requests found.
                </div>
              )}
            </div>
          </div>
        </section>
        ) : null}
      </div>
      )}

      {isTicketOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-3 py-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsTicketOpen(false);
            setTicketCategoryOpen(false);
            setTicketPriorityOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-[980px] rounded-xl bg-[#f4fffb] p-3 shadow-2xl sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close raise ticket dialog"
              onClick={() => setIsTicketOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-800"
            >
              <FiX className="h-4 w-4" />
            </button>

            <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl bg-linear-to-b from-[#d9f8e7] to-[#eff8f3] p-4">
                <h2 className="text-[20px] font-semibold text-[#22b36a]">
                  Raise a Ticket
                </h2>
                <p className="mt-2.5 max-w-[220px] text-sm leading-6 text-gray-700">
                  Facing an issue? Share the details and our support team will
                  review your request and get back to you as soon as possible.
                </p>

                <div className="mt-5 flex justify-start pl-1">
                  <div className="w-full max-w-[210px]">
                    <RequestCallSvg />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4">
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <span className="text-sm font-medium text-gray-800">
                        Category
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTicketCategoryOpen((prev) => !prev)
                        }
                        className="mt-2 flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 px-3.5 text-left text-gray-700"
                      >
                        <span className="text-sm">{selectedTicketCategory}</span>
                        <FiChevronDown
                          className={`h-4 w-4 text-gray-500 transition ${
                            ticketCategoryOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {ticketCategoryOpen ? (
                        <div className="absolute left-0 top-full z-20 mt-1.5 w-full rounded-lg border border-gray-100 bg-white p-2.5 shadow-lg">
                          <div className="space-y-1">
                            {TICKET_CATEGORIES.map((category) => (
                              <button
                                key={category}
                                type="button"
                                onClick={() => {
                                  setSelectedTicketCategory(category);
                                  setTicketCategoryOpen(false);
                                }}
                                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                                  selectedTicketCategory === category
                                    ? "bg-[#d9f8e7] text-[#1b8b50]"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {category}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="relative">
                      <span className="text-sm font-medium text-gray-800">
                        Priority
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setTicketPriorityOpen((prev) => !prev)
                        }
                        className="mt-2 flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 px-3.5 text-left text-gray-700"
                      >
                        <span className="text-sm">{selectedTicketPriority}</span>
                        <FiChevronDown
                          className={`h-4 w-4 text-gray-500 transition ${
                            ticketPriorityOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {ticketPriorityOpen ? (
                        <div className="absolute left-0 top-full z-20 mt-1.5 w-full rounded-lg border border-gray-100 bg-white p-2.5 shadow-lg">
                          <div className="space-y-1">
                            {TICKET_PRIORITIES.map((priority) => (
                              <button
                                key={priority}
                                type="button"
                                onClick={() => {
                                  setSelectedTicketPriority(priority);
                                  setTicketPriorityOpen(false);
                                }}
                                className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                                  selectedTicketPriority === priority
                                    ? "bg-[#d9f8e7] text-[#1b8b50]"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {priority}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-800">
                      Subject
                    </span>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={(event) => setTicketSubject(event.target.value)}
                      placeholder="Briefly describe your issue"
                      className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#22c06f]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-800">
                      Description
                    </span>
                    <textarea
                      value={ticketDescription}
                      onChange={(event) =>
                        setTicketDescription(event.target.value)
                      }
                      placeholder="Describe your issue in detail"
                      rows={4}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3.5 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#22c06f]"
                    />
                  </label>

                  <div className="block">
                    <span className="text-sm font-medium text-gray-800">
                      Add Attachment
                    </span>
                    <label className="mt-2 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-[#d9f8e7] px-3.5 text-sm text-gray-600 transition hover:bg-[#ccf3dd]">
                      <FiPaperclip className="h-4 w-4" />
                      <span className="truncate">
                        {ticketAttachmentName || "Add Screenshots or png, jpg"}
                      </span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(event) =>
                          setTicketAttachmentName(
                            event.target.files?.[0]?.name || "",
                          )
                        }
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsTicketOpen(false)}
                      className="rounded-lg border border-[#22c06f] bg-[#d9f8e7] px-5 py-2 text-sm font-medium text-[#22b36a] transition hover:bg-[#ccf3dd]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitTicket}
                      disabled={createTicketMutation.isPending}
                      className="rounded-lg bg-[#22c06f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1cad63] disabled:opacity-60"
                    >
                      {createTicketMutation.isPending
                        ? "Submitting..."
                        : "Submit Ticket"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isRequestCallOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-3 py-4"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setIsRequestCallOpen(false);
            setCategoryOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-[980px] rounded-xl bg-[#f4fffb] p-3 shadow-2xl sm:p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close request call dialog"
              onClick={() => setIsRequestCallOpen(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-800"
            >
              <FiX className="h-4 w-4" />
            </button>

            <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div className="overflow-hidden rounded-xl bg-linear-to-b from-[#d9f8e7] to-[#eff8f3] p-4">
                <h2 className="text-[20px] font-semibold text-[#22b36a]">
                  Request a Call
                </h2>
                <p className="mt-2.5 max-w-[240px] text-sm leading-6 text-gray-700">
                  Need to Speak with your Relationship Manager? Schedule a call
                  at your Preferred time, and we&apos;ll connect with you.
                </p>

                <div className="mt-5 flex justify-start pl-1">
                  <div className="w-full max-w-[210px]">
                    <RequestCallSvg />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4">
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[15px] font-semibold text-[#0f172a]">
                      Select Date
                    </span>
                    <div className="relative mt-2">
                      <FiCalendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                      <input
                        type="date"
                        value={selectedDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        className="h-[50px] w-full rounded-[14px] border border-[#d8e1ea] bg-white pl-11 pr-12 text-[15px] font-medium text-[#0f172a] outline-none transition focus:border-[#22c06f] focus:ring-4 focus:ring-[#22c06f]/10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                      />
                      <FiCalendar className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f172a]" />
                    </div>
                  </label>

                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Select Time Slot
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`rounded-md border px-3.5 py-2 text-sm transition ${
                            selectedTime === slot
                              ? "border-[#22c06f] bg-[#22c06f] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-[#22c06f]/40"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="text-sm font-medium text-gray-800">
                      Category
                    </span>
                    <button
                      type="button"
                      onClick={() => setCategoryOpen((prev) => !prev)}
                      className="mt-2 flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 px-3.5 text-left text-gray-700"
                    >
                      <span className="text-sm">{selectedCategory}</span>
                      <FiChevronDown
                        className={`h-4 w-4 text-gray-500 transition ${
                          categoryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {categoryOpen ? (
                      <div className="absolute left-0 top-full z-20 mt-1.5 w-full rounded-lg border border-gray-100 bg-white p-2.5 shadow-lg">
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Select Category
                        </p>
                        <div className="space-y-1">
                          {REQUEST_CATEGORIES.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(category);
                                setCategoryOpen(false);
                              }}
                              className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                                selectedCategory === category
                                  ? "bg-[#d9f8e7] text-[#1b8b50]"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-800">
                      Related project
                    </span>
                    <div className="mt-2 flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700">
                      <span className="truncate">
                        {activeProject
                          ? getProjectName(activeProject)
                          : GENERAL_SUPPORT_NAME}
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-gray-800">
                      Subject
                    </span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Briefly tell us what you’d like to discuss"
                      className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#22c06f]"
                    />
                  </label>

                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setIsRequestCallOpen(false)}
                      className="rounded-lg border border-[#22c06f] bg-[#d9f8e7] px-5 py-2 text-sm font-medium text-[#22b36a] transition hover:bg-[#ccf3dd]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitRequestCall}
                      disabled={requestCallMutation.isPending}
                      className="rounded-lg bg-[#22c06f] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1cad63] disabled:opacity-60"
                    >
                      {requestCallMutation.isPending
                        ? "Submitting..."
                        : "Request a Call"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default page;
