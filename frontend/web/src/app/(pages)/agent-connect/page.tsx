import Image from "next/image";
import {  MdLocationOn } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { BsBuildingCheck } from "react-icons/bs";
import { getAgentConnect } from "@/data/serverData";
import { AgentConnect } from "@/types";
import { IoMdShareAlt } from "react-icons/io";

export default async function Page() {
    const data = await getAgentConnect();

    // Normalize
    const agents = (data as any)?.items || [];


    return (
        <div className="container mx-auto px-4 py-8">
            <div className=" w-[80%] space-y-6">

                {agents.map((agent: AgentConnect) => (
                    <div
                        key={agent._id}
                        className="card bg-base-100 p-2 flex flex-row items-center gap-4"
                    >
                        {/* LEFT SIDE */}
                        <div className="flex gap-4 items-start flex-1">
                            <div className="shrink-0 relative">
                                <div className="relative w-full md:w-64 h-42 rounded-lg overflow-hidden bg-gray-100">
                                    <Image
                                        src={agent.avatar?.url || "/placeholder.jpg"}
                                        alt={agent.name || "Agent"}
                                        fill
                                        className="h-full w-full object-cover rounded-xl"
                                    />
                                </div>
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button className="bg-white/90 p-2 rounded-full shadow-sm hover:text-blue-500 transition-colors text-gray-400">
                                        <IoMdShareAlt  size={16} />
                                    </button>
                                    <button className="bg-white/90 p-2 rounded-full shadow-sm hover:text-red-500 transition-colors text-gray-400">
                                        <FaRegHeart size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="w-full flex flex-col justify-between h-[170px]">
                                <div className="flex justify-between items-center w-full">
                                    <h2 className="text-xl font-semibold">{agent.name}</h2>
                                    <p className="text-green-600 text-sm font-medium">
                                        RERA ID : <span className="underline">{agent.rera?.reraAgentId}</span>
                                    </p>

                                </div>

                                <p className="text-gray-500 text-sm">Exp. {agent.experienceYears} Years</p>

                                <div className="flex items-center gap-2 mt-1 text-gray-600 text-sm">
                                    <BsBuildingCheck />
                                    <span>{agent.agencyName}</span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600 text-sm">
                                    <MdLocationOn />
                                    <span>{agent.city}</span>
                                </div>

                                <div className="flex gap-10 mt-3">
                                    <div className="text-center">
                                        <p className="text-green-600 font-semibold">{agent.stats?.totalProperties || 0}</p>
                                        <p className="text-xs text-gray-500">Properties For Sale</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-green-600 font-semibold">{agent.stats?.publishedCount || 0}</p>
                                        <p className="text-xs text-gray-500">Properties For Rent</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-green-600 font-semibold">{agent.dealsClosed || 0}</p>
                                        <p className="text-xs text-gray-500">Deals Closed</p>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-green-600 font-semibold">—</p>
                                        <p className="text-xs text-gray-500">Team Members</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE BUTTONS */}
                        <div className="flex flex-col gap-3 w-[150px] bg-[#27AE60]/10 p-3 rounded-xl h-[170px] justify-center">
                            <button className="bg-green-600 text-white py-2 rounded-lg shadow w-full text-sm font-medium">
                                Contact Agent
                            </button>
                            <button className="border border-green-600 text-green-600 py-2 rounded-lg w-full text-sm font-medium">
                                View Details
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
