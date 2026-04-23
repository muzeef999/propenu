"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IoCallOutline,
  IoLocationOutline,
  IoPersonOutline,
} from "react-icons/io5";

import { getBuilderFeaturedShortlists } from "@/data/ClientData";
import NopropertiesSvg from "@/svg/NopropertiesSvg";
import formatINR from "@/utilies/PriceFormat";

interface ProjectDetails {
  _id: string;
  title?: string;
  slug?: string;
  heroImage?: string;
  gallerySummary?: { url?: string }[];
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  priceFrom?: number;
  priceTo?: number;
}

interface ShortlistedByDetails {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  locality?: string;
  userCode?: string;
  role?: string;
}

interface BuilderFeaturedShortlistItem {
  _id: string;
  createdAt: string;
  propertyType: "FeaturedProject";
  project: ProjectDetails;
  shortlistedBy?: ShortlistedByDetails;
}

interface ProjectGroup {
  projectId: string;
  title: string;
  slug?: string;
  image: string;
  location: string;
  priceLabel: string;
  shortlistCount: number;
  entries: BuilderFeaturedShortlistItem[];
}

const formatPriceRange = (priceFrom?: number, priceTo?: number) => {
  if (priceFrom && priceTo && priceFrom !== priceTo) {
    return `${formatINR(priceFrom)} - ${formatINR(priceTo)}`;
  }

  if (priceFrom) return `${formatINR(priceFrom)} onwards`;
  if (priceTo) return formatINR(priceTo);

  return "Price on request";
};

const formatDate = (value?: string) => {
  if (!value) return "Recently";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRoleLabel = (role?: string) => {
  const normalized = role?.toLowerCase().trim();

  if (normalized === "sales_agent" || normalized === "agent") return "Agent";
  if (normalized === "user") return "User";

  return role || "User";
};

const Page = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const {
    data: shortlists = [],
    isLoading,
    isError,
    error,
  } = useQuery<
    { data: BuilderFeaturedShortlistItem[] },
    Error,
    BuilderFeaturedShortlistItem[]
  >({
    queryKey: ["builder-featured-shortlists"],
    queryFn: getBuilderFeaturedShortlists,
    select: (data) => data?.data ?? [],
  });

  const projectGroups = useMemo<ProjectGroup[]>(() => {
    const grouped = new Map<string, ProjectGroup>();

    shortlists.forEach((item) => {
      const projectId = item.project?._id;
      if (!projectId) return;

      const location =
        item.project?.address ||
        [item.project?.locality, item.project?.city, item.project?.state]
          .filter(Boolean)
          .join(", ") ||
        "Location not specified";

      const existing = grouped.get(projectId);

      if (existing) {
        existing.shortlistCount += 1;
        existing.entries.push(item);
        return;
      }

      grouped.set(projectId, {
        projectId,
        title: item.project?.title || "Untitled Project",
        slug: item.project?.slug,
        image:
          item.project?.heroImage ||
          item.project?.gallerySummary?.[0]?.url ||
          "/images/placeholder.svg",
        location,
        priceLabel: formatPriceRange(item.project?.priceFrom, item.project?.priceTo),
        shortlistCount: 1,
        entries: [item],
      });
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.shortlistCount - a.shortlistCount,
    );
  }, [shortlists]);

  useEffect(() => {
    if (!projectGroups.length) {
      setSelectedProjectId("");
      return;
    }

    const hasSelectedProject = projectGroups.some(
      (project) => project.projectId === selectedProjectId,
    );

    if (!hasSelectedProject) {
      setSelectedProjectId("");
    }
  }, [projectGroups, selectedProjectId]);

  const selectedProject = useMemo(
    () =>
      projectGroups.find((project) => project.projectId === selectedProjectId) ||
      null,
    [projectGroups, selectedProjectId],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500">
        Loading project shortlists...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-center text-red-600">
        Error: {error.message}
      </div>
    );
  }

  if (!projectGroups.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            User Shortlists
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
            Review user interest project-wise and inspect shortlist details in a
            single table view.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4ECE7] bg-white py-14 text-center text-gray-500">
          <div className="flex justify-center">
            <NopropertiesSvg />
          </div>
          <p className="mt-4 text-base font-medium text-gray-700">
            No shortlisted featured projects found yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-green-100 bg-linear-to-r from-green-50 via-white to-emerald-50 px-5 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          User Shortlists
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600 md:text-base">
          Select a project from the left panel to view everyone who shortlisted
          it in a structured table.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(260px,20%)_minmax(0,80%)]">
        <aside className="rounded-2xl border border-gray-100 bg-white shadow-sm xl:sticky xl:top-6 xl:h-fit">
          <div className="border-b border-gray-100 px-4 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <p className="mt-1 text-sm text-gray-500">
              {projectGroups.length} project{projectGroups.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
            {projectGroups.map((project) => {
              const isActive = selectedProjectId === project.projectId;

              return (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => setSelectedProjectId(project.projectId)}
                  className={`w-full rounded-2xl border text-left transition ${
                    isActive
                      ? "border-[#26ad5f] bg-[#F3FBF6] shadow-sm"
                      : "border-gray-100 bg-white hover:border-[#CFE7D8] hover:bg-[#FAFCFB]"
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                          {project.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-[#E9F7EF] px-2 py-1 text-xs font-semibold text-[#21884B]">
                          {project.shortlistCount}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                        {project.location}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[#21884B]">
                        {project.priceLabel}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
          {selectedProject ? (
            <>
              <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <img
                    src={selectedProject.image}
                    alt={selectedProject.title}
                    className="h-20 w-24 rounded-2xl object-cover"
                  />

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-gray-900">
                      {selectedProject.title}
                    </h2>
                    <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
                      <IoLocationOutline className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span>{selectedProject.location}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#21884B]">
                      {selectedProject.priceLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl bg-[#F6FBF8] px-4 py-3 text-sm">
                    <p className="text-gray-500">Total shortlists</p>
                    <p className="font-semibold text-gray-900">
                      {selectedProject.entries.length}
                    </p>
                  </div>

                  {selectedProject.slug ? (
                    <Link
                      href={`/prime/${selectedProject.slug}`}
                      className="rounded-xl bg-[#26ad5f] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#229853]"
                    >
                      View Project
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead className="bg-[#F8FBF9]">
                    <tr className="text-sm text-gray-500">
                      <th className="w-[42%] px-5 py-4 font-medium">
                        Shortlisted By
                      </th>
                      <th className="w-[16%] px-5 py-4 font-medium">Role</th>
                      <th className="w-[24%] px-5 py-4 font-medium">Phone</th>
                      <th className="w-[18%] px-5 py-4 font-medium">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {selectedProject.entries.map((entry) => {
                      return (
                        <tr
                          key={entry._id}
                          className="align-top transition hover:bg-[#FCFDFD]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9F7EF] text-[#21884B]">
                                <IoPersonOutline className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="wrap-break-word font-semibold text-gray-900">
                                  {entry.shortlistedBy?.name || "Unknown user"}
                                </p>
                                <p className="mt-1 break-all text-xs text-gray-500">
                                  {entry.shortlistedBy?.userCode || "No code"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#F3FBF6] px-3 py-1 text-xs font-semibold text-[#21884B]">
                              {getRoleLabel(entry.shortlistedBy?.role)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">
                            <a
                              href={
                                entry.shortlistedBy?.phone
                                  ? `tel:${entry.shortlistedBy.phone}`
                                  : undefined
                              }
                              className="inline-flex max-w-full items-center gap-2 break-all hover:text-[#26ad5f]"
                            >
                              <IoCallOutline className="h-4 w-4 shrink-0 text-green-500" />
                              <span>
                                {entry.shortlistedBy?.phone || "Not available"}
                              </span>
                            </a>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">
                            {formatDate(entry.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center text-gray-500">
              <div className="flex justify-center">
                <NopropertiesSvg />
              </div>
              <p className="mt-5 text-lg font-medium text-gray-800">
                Select a project from the left panel
              </p>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Once you choose a project, its shortlisted users and agents will
                appear here in table format.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Page;
