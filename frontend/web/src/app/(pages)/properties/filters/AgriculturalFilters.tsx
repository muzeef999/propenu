"use client";
import { useDispatch } from "react-redux";
import { setMinArea, setSoilType } from "@/Redux/slice/filterSlice";

const AgriculturalFilters = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex gap-4">
      <input
        type="number"
        placeholder="Min Area (Acres)"
        onChange={(e) => dispatch(setMinArea(Number(e.target.value)))}
        className="border p-2 rounded"
      />

      <select
        onChange={(e) => dispatch(setSoilType(e.target.value))}
        className="border p-2 rounded"
      >
        <option value="">Soil Type</option>
        <option value="red">Red</option>
        <option value="black">Black</option>
      </select>
    </div>
  );
};

export default AgriculturalFilters;
