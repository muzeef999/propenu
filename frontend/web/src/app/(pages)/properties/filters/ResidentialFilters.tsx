"use client";
import { useDispatch } from "react-redux";
import { setBhk, setBedrooms } from "@/Redux/slice/filterSlice";

const ResidentialFilters = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex gap-4">
      <select
        onChange={(e) => dispatch(setBhk(Number(e.target.value)))}
        className="border p-2 rounded"
      >
        <option value="">BHK</option>
        <option value="1">1 BHK</option>
        <option value="2">2 BHK</option>
        <option value="3">3 BHK</option>
      </select>

      <select
        onChange={(e) => dispatch(setBedrooms(Number(e.target.value)))}
        className="border p-2 rounded"
      >
        <option value="">Bedrooms</option>
        <option value="1">1</option>
        <option value="2">2</option>
      </select>
    </div>
  );
};

export default ResidentialFilters;
