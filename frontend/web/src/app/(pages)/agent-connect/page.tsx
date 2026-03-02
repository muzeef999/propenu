"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdLocationOn } from "react-icons/md";
import { HiOutlineLocationMarker, HiOutlineOfficeBuilding } from "react-icons/hi";
import { IoMdShareAlt } from "react-icons/io";

import { AgentConnect } from "@/types";
import { getAgentConnect } from "@/data/ClientData";
import { useCity } from "@/hooks/useCity";

export default function Page() {
  const { selectedCity } = useCity(); // ✅ hook at top level
  const [agents, setAgents] = useState<AgentConnect[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCity?.city) return;

    setLoading(true);

    getAgentConnect({ city: selectedCity.city })
      .then((res) => {
        setAgents(res?.items || []);
      })
      .catch((err) => {
        console.error("Failed to fetch agents:", err);
        setAgents([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCity?.city]);


  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 leading-snug">
          Agents in{" "}
          <span className="text-[#26ad5f] wrap-break-word">
            {selectedCity?.city || "Loading..."}
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto sm:mx-0">
          Connect with trusted real estate agents in your area
        </p>
      </div>

      <div className="w-full lg:w-[80%] space-y-6">
        {agents.map((agent: AgentConnect) => (
          <Link key={agent._id} href={`/agent-connect/${agent.slug}`}>
            <div className="card bg-base-100 p-4 lg:p-2 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-4 rounded-xl">

              {/* Agent Info */}
              <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">

                {/* Image */}
                <div className="shrink-0 relative w-full sm:w-auto">
                  <div className="relative w-full sm:w-40 md:w-52 lg:w-64 h-44 lg:h-42 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={agent.avatar?.url || "/placeholder.jpg"}
                      alt={agent.name || "Agent"}
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>

                  <div className="absolute top-2 right-2 flex gap-2">
                    <button className="bg-white/90 p-2 rounded-full shadow-sm hover:text-blue-500 transition-colors text-gray-400">
                      <IoMdShareAlt size={16} />
                    </button>
                  </div>
                </div>

                {/* Agent Details */}
                <div className="w-full flex flex-col justify-between lg:h-35">

                  <div className="flex flex-col gap-3 font-sans">

                    {/* Name / Exp / RERA */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-6">
                      <h2 className="text-lg font-medium text-slate-900">
                        {agent.name}
                      </h2>

                      <p className="text-sm sm:text-md text-slate-800">
                        Exp. {agent.experienceYears}+ years
                      </p>

                      {agent.rera?.reraAgentId && (
                        <span className="text-sm sm:text-md font-medium text-[#2DB473]">
                          RERA ID : {agent.rera.reraAgentId}
                        </span>
                      )}
                    </div>

                    {/* Agency + Location */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1 text-sm text-slate-500">

                      <div className="flex items-center gap-2 text-gray-600 truncate">
                        <HiOutlineOfficeBuilding className="text-gray-400" size={18} />
                        <span className="text-sm truncate">
                          {agent.agencyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <MdLocationOn className="text-slate-400" size={20} />
                        <span className="text-sm sm:text-base">
                          {agent.city || "Kokapet, Hyderabad"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 lg:mt-2 border-t pt-4 lg:pt-2 border-gray-200 text-sm">
                    <div className="text-center">
                      <p className="text-green-600 font-semibold">
                        {agent.stats?.totalProperties || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        Properties For Sale
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-green-600 font-semibold">
                        {agent.stats?.publishedCount || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        Properties For Rent
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-green-600 font-semibold">
                        {agent.dealsClosed || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        Deals Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE BUTTONS */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-41 bg-[#27AE60]/10 p-4 lg:p-3 rounded-xl h-auto lg:h-[170px] justify-center">
                <button className="bg-green-600 text-white py-2 rounded-lg shadow w-full text-sm font-medium">
                  Contact Agent
                </button>

                <button className="border border-green-600 text-green-600 py-2 rounded-lg w-full text-sm font-medium">
                  View Details
                </button>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
