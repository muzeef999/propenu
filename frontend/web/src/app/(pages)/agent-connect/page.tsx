"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdLocationOn } from "react-icons/md";
import { HiOutlineLocationMarker, HiOutlineOfficeBuilding } from "react-icons/hi";
import { IoMdShareAlt } from "react-icons/io";
import { FiArrowLeft, FiArrowRight, FiSearch, FiX } from "react-icons/fi";
import { useEffect, useMemo, useRef, useState } from "react";

import { AgentConnect } from "@/types";
import { getAgentConnect } from "@/data/ClientData";
import { useCity } from "@/hooks/useCity";
import { minDelay } from "@/utilies/minDelay";
import SponsoreCard from "../properties/cards/SponsoreCard";

const agentSkeletonItems = Array.from({ length: 4 });

function getAgentLocality(agent: AgentConnect) {
  return agent.locality || agent.areasServed?.filter(Boolean).join(", ");
}

function AgentListSkeleton() {
  return (
    <div className="w-full space-y-6">
      {agentSkeletonItems.map((_, index) => (
        <div
          key={`agent-skeleton-${index}`}
          className="card bg-base-100 p-4 lg:p-2 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-4 rounded-xl"
        >
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <div className="shrink-0 relative w-full sm:w-auto">
              <div className="w-full sm:w-40 md:w-52 lg:w-64 h-44 lg:h-42 rounded-lg bg-gray-200 animate-pulse" />
            </div>

            <div className="w-full flex flex-col justify-between lg:h-35">
              <div className="flex flex-col gap-3 font-sans">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6">
                  <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-32 animate-pulse rounded bg-green-100" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 lg:mt-2 border-t pt-4 lg:pt-2 border-gray-200 text-sm">
                {Array.from({ length: 3 }).map((__, statIndex) => (
                  <div key={`agent-stat-skeleton-${statIndex}`} className="text-center space-y-2">
                    <div className="h-5 w-10 mx-auto animate-pulse rounded bg-green-100" />
                    <div className="h-3 w-20 mx-auto animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-41 bg-[#27AE60]/10 p-4 lg:p-3 rounded-xl h-auto lg:h-[170px] justify-center">
            <div className="h-10 w-full animate-pulse rounded-lg bg-[#27AE60]/25" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-[#27AE60]/15" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { selectedCity } = useCity();
  const [selectedLocality, setSelectedLocality] = useState("");
  const [searchText, setSearchText] = useState("");
  const localitiesRef = useRef<HTMLDivElement>(null);
  const [hasLocalityOverflow, setHasLocalityOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setSelectedLocality("");
    setSearchText("");
  }, [selectedCity?.city]);

  const filteredLocalities = useMemo(() => {
    const localities = Array.from(
      new Map(
        (selectedCity?.localities ?? [])
          .map((locality: any) => locality?.name?.trim())
          .filter((name): name is string => Boolean(name))
          .map((name) => [name.toLowerCase(), { name }] as const),
      ).values(),
    );

    const query = searchText.trim().toLowerCase();
    if (!query) return localities;

    const startsWith = localities.filter((locality) =>
      locality.name.toLowerCase().startsWith(query),
    );
    const includes = localities.filter((locality) => {
      const name = locality.name.toLowerCase();
      return !name.startsWith(query) && name.includes(query);
    });

    return [...startsWith, ...includes];
  }, [selectedCity?.localities, searchText]);

  const { data, isLoading } = useQuery<{ items?: AgentConnect[] }>({
    queryKey: ["agent-connect", selectedCity?.city],
    enabled: Boolean(selectedCity?.city),
    queryFn: async () => {
      const [response] = await Promise.all([
        getAgentConnect({ city: selectedCity!.city }),
        minDelay(1500),
      ]);

      return response;
    },
  });

  const agents = data?.items || [];
  const filteredAgents = useMemo(() => {
    const selected = selectedLocality.trim().toLowerCase();
    const query = searchText.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesLocality =
        !selected ||
        agent.locality?.trim().toLowerCase() === selected ||
        agent.areasServed?.some((area) => area.trim().toLowerCase() === selected);

      if (!matchesLocality) return false;
      if (!query) return true;

      const searchableText = [
        agent.name,
        agent.bio,
        agent.agencyName,
        agent.locality,
        agent.city,
        agent.experienceYears,
        agent.dealsClosed,
        agent.verificationStatus,
        agent.rera?.reraAgentId,
        agent.stats?.totalProperties,
        agent.stats?.publishedCount,
        agent.areasServed?.join(" "),
        agent.languages?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [agents, selectedLocality, searchText]);

  useEffect(() => {
    const el = localitiesRef.current;
    if (isLoading || !el) {
      setHasLocalityOverflow(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const maxScrollLeft = scrollWidth - clientWidth;
      const hasOverflow = maxScrollLeft > 1;

      setHasLocalityOverflow(hasOverflow);
      setCanScrollLeft(hasOverflow && scrollLeft > 1);
      setCanScrollRight(hasOverflow && scrollLeft < maxScrollLeft - 1);
    };

    el.scrollLeft = 0;

    const frameId = window.requestAnimationFrame(checkScroll);
    const resizeObserver = new ResizeObserver(checkScroll);

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    resizeObserver.observe(el);

    return () => {
      window.cancelAnimationFrame(frameId);
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver.disconnect();
    };
  }, [isLoading, selectedCity?.city, filteredLocalities.length]);

  const scrollLocalities = (direction: "left" | "right") => {
    if (!localitiesRef.current) return;

    localitiesRef.current.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  async function shareAgent(
    event: React.MouseEvent<HTMLButtonElement>,
    agent: AgentConnect,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const agentUrl = `${window.location.origin}/agent-connect/${agent.slug}`;
    const shareData = {
      title: agent.name || "Real estate agent",
      text: `Connect with ${agent.name || "this real estate agent"} on Propenu`,
      url: agentUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(agentUrl);
    } catch {
      // Share can be cancelled by the user; no UI needed here.
    }
  }

  function openAgentDetails(
    event: React.MouseEvent<HTMLButtonElement>,
    agent: AgentConnect,
  ) {
    event.preventDefault();
    event.stopPropagation();
    router.push(`/agent-connect/${agent.slug}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="w-full min-w-0 space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            {isLoading ? (
              <div className="h-9 w-56 animate-pulse rounded bg-gray-200 sm:w-72" />
            ) : (
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 leading-snug">
                Agents in{" "}
                <span className="text-[#26ad5f] wrap-break-word">
                  {selectedCity?.city || ""}
                </span>
              </h1>
            )}

            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto sm:mx-0">
              Connect with trusted real estate agents in your area
            </p>
          </div>

          {!isLoading && Boolean(selectedCity?.localities?.length) && (
            <div className="mb-3 space-y-3 sm:mb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(event.target.value);
                      setSelectedLocality("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && filteredLocalities[0]) {
                        setSelectedLocality(filteredLocalities[0].name);
                      }
                    }}
                    placeholder="Search agents, agency, locality"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  {searchText && (
                    <button
                      type="button"
                      onClick={() => setSearchText("")}
                      aria-label="Clear agent search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {selectedLocality && (
                  <button
                    type="button"
                    onClick={() => setSelectedLocality("")}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Show all localities
                  </button>
                )}
              </div>

              <div className="relative">
                {hasLocalityOverflow && canScrollLeft && (
                  <button
                    type="button"
                    onClick={() => scrollLocalities("left")}
                    className="hidden md:block absolute left-0 lg:-left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                    aria-label="Scroll localities left"
                  >
                    <FiArrowLeft size={16} />
                  </button>
                )}

                <div
                  ref={localitiesRef}
                  className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1 py-4 sm:py-5"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedLocality("")}
                    aria-pressed={!selectedLocality}
                    className={`group min-w-[150px] sm:min-w-40 rounded-xl border bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer text-left ${!selectedLocality
                        ? "border-emerald-500 ring-1 ring-emerald-200"
                        : "border-slate-200 hover:border-emerald-300"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${!selectedLocality
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                          }`}
                      >
                        <HiOutlineLocationMarker size={18} />
                      </div>
                      <h3 className="truncate text-sm font-medium text-slate-900">
                        All
                      </h3>
                    </div>
                  </button>

                  {filteredLocalities.map((locality, index: number) => (
                    <button
                      key={`${locality.name}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedLocality((prev) =>
                          prev === locality.name ? "" : locality.name,
                        )
                      }
                      aria-pressed={selectedLocality === locality.name}
                      className={`group min-w-[150px] sm:min-w-40 rounded-xl border bg-white p-3.5 sm:p-4 shadow-[10px_10px_10px_rgba(0,0,0,0.10)] transition cursor-pointer text-left ${selectedLocality === locality.name
                          ? "border-emerald-500 ring-1 ring-emerald-200"
                          : "border-slate-200 hover:border-emerald-300"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${selectedLocality === locality.name
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                            }`}
                        >
                          <HiOutlineLocationMarker size={18} />
                        </div>
                        <h3 className="truncate text-sm font-medium text-slate-900">
                          {locality.name}
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>

                {filteredLocalities.length === 0 && (
                  <p className="px-1 pb-3 text-sm text-slate-500">
                    No locality found for &quot;{searchText}&quot;.
                  </p>
                )}

                {hasLocalityOverflow && canScrollRight && (
                  <button
                    type="button"
                    onClick={() => scrollLocalities("right")}
                    className="hidden md:block absolute right-0 lg:-right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow hover:bg-slate-50"
                    aria-label="Scroll localities right"
                  >
                    <FiArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
          {isLoading ? (
            <AgentListSkeleton />
          ) : (
            <div className="w-full space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {filteredAgents.length} Agents in{" "}
                {selectedLocality
                  ? `${selectedLocality}, ${selectedCity?.city || ""}`
                  : selectedCity?.city || ""}
              </h2>


              {filteredAgents.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  No agents found for this search.
                </div>
              )}

              {filteredAgents.map((agent: AgentConnect) => (
                <Link key={agent._id} href={`/agent-connect/${agent.slug}`}>
                  <div className="card bg-base-100 p-3 sm:p-4 lg:p-2 flex flex-col lg:flex-row items-start lg:items-center gap-4 sm:gap-6 lg:gap-4 rounded-xl">

                    {/* Agent Info */}
                    <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">

                      {/* Image */}
                      <div className="shrink-0 relative w-full sm:w-auto">
                        <div className="relative w-full h-36 sm:w-40 sm:h-44 md:w-52 lg:w-64 lg:h-42 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={agent.avatar?.url || "/placeholder.jpg"}
                            alt={agent.name || "Agent"}
                            fill
                            className="object-cover rounded-xl"
                          />
                        </div>

                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => shareAgent(event, agent)}
                            className="bg-white/90 p-2 rounded-full shadow-sm hover:text-blue-500 transition-colors text-gray-400"
                            aria-label={`Share ${agent.name || "agent"}`}
                          >
                            <IoMdShareAlt size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Agent Details */}
                      <div className="w-full flex flex-col justify-between lg:h-35 min-w-0">

                        <div className="flex flex-col gap-2 sm:gap-3 font-sans min-w-0">

                          {/* Name / Exp / RERA */}
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center sm:gap-6 min-w-0">
                            <h2 className="truncate text-base sm:text-lg font-medium text-slate-900">
                              {agent.name}
                            </h2>

                            <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                              <p className="text-sm sm:text-md text-slate-800">
                                Exp. {agent.experienceYears}+ years
                              </p>

                              {agent.rera?.reraAgentId && (
                                <span className="text-sm sm:text-md font-medium text-[#2DB473]">
                                  RERA ID : {agent.rera.reraAgentId}
                                </span>
                              )}
                            </div>

                            {agent.rera?.reraAgentId && (
                              <span className="sm:hidden text-xs font-medium text-[#2DB473] truncate">
                                RERA ID : {agent.rera.reraAgentId}
                              </span>
                            )}
                          </div>

                          {/* Agency + Location */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-1 text-sm text-slate-500 min-w-0">

                            <div className="flex items-center gap-2 text-gray-600 min-w-0">
                              <HiOutlineOfficeBuilding className="shrink-0 text-gray-400" size={18} />
                              <span className="text-sm truncate">
                                {agent.agencyName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 min-w-0">
                              <MdLocationOn className="shrink-0 text-slate-400" size={20} />
                              <span className="truncate text-sm sm:text-base">
                                {[getAgentLocality(agent), agent.city]
                                  .filter(Boolean)
                                  .join(", ") || "Location unavailable"}
                              </span>
                            </div>

                            <p className="sm:hidden text-xs text-slate-700">
                              Exp. {agent.experienceYears}+ years
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:grid grid-cols-3 gap-4 mt-4 lg:mt-2 border-t pt-4 lg:pt-2 border-gray-200 text-sm">
                          <div className="text-center">
                            <p className="text-green-600 font-semibold">
                              {agent.stats?.totalProperties ? agent.stats.totalProperties : "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Properties For Sale
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-green-600 font-semibold">
                              {agent.stats?.publishedCount ? agent.stats.publishedCount : "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Properties For Rent
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-green-600 font-semibold">
                              {agent.dealsClosed ? agent.dealsClosed : "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Deals Closed
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE BUTTONS */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 w-full lg:w-41 bg-[#27AE60]/10 p-3 sm:p-4 lg:p-3 rounded-xl h-auto lg:h-[170px] justify-center">
                      <button
                        type="button"
                        onClick={(event) => openAgentDetails(event, agent)}
                        className="bg-green-600 text-white py-2 rounded-lg shadow w-full text-sm font-medium"
                      >
                        Contact Agent
                      </button>

                      <button
                        type="button"
                        onClick={(event) => openAgentDetails(event, agent)}
                        className="border border-green-600 text-green-600 py-2 rounded-lg w-full text-sm font-medium"
                      >
                        View Details
                      </button>
                    </div>

                  </div>
                </Link>

              ))}

            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-[260px] sticky top-20 self-start">
          <SponsoreCard />
        </aside>
      </div>
    </div>
  );
}
