"use client";
import { useDispatch } from "react-redux";
import {
  setMinArea,
  setFacing,
  setRoadFacing,
} from "@/Redux/slice/filterSlice";

const LandFilters = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Plot Area */}
      <input
        type="number"
        placeholder="Min Plot Area (sq yards)"
        onChange={(e) => dispatch(setMinArea(Number(e.target.value)))}
        className="border p-2 rounded"
      />

      {/* Facing */}
      <select
        onChange={(e) => dispatch(setFacing(e.target.value))}
        className="border p-2 rounded"
      >
        <option value="">Facing</option>
        <option value="east">East</option>
        <option value="west">West</option>
        <option value="north">North</option>
        <option value="south">South</option>
      </select>

      {/* Road Facing */}
      <select
        onChange={(e) => dispatch(setRoadFacing(e.target.value))}
        className="border p-2 rounded"
      >
        <option value="">Road Facing</option>
        <option value="20">20 ft</option>
        <option value="30">30 ft</option>
        <option value="40">40 ft</option>
      </select>
    </div>
  );
};

export default LandFilters;
