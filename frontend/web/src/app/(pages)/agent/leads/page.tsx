"use client";
import { getMyProperties } from "@/data/ClientData";
import { useQuery } from "@tanstack/react-query";

const page = () => {
    const { data, isLoading } = useQuery<any>({
    queryKey: ["myProperties"],
    queryFn: getMyProperties,
  });
  console.log(data);
    return (
        <div>Leads pages</div>
    )
}
export default page;