"use client";
import { useDispatch } from "react-redux";
import {
  setCommercialType,
  setMinArea,
  setParking,
} from "@/Redux/slice/filterSlice";

const CommercialFilters = () => {
  const dispatch = useDispatch();

  return (
    <div className="flex gap-4 flex-wrap">
      {/* Commercial Type */}
      <select
        onChange={(e) => dispatch(setCommercialType(e.target.value))}
        className="border p-2 rounded"
      >
        <option value="">Commercial Type</option>
        <option value="office">Office</option>
        <option value="shop">Shop</option>
        <option value="warehouse">Warehouse</option>
        <option value="showroom">Showroom</option>
      </select>

      {/* Min Area */}
      <input
        type="number"
        placeholder="Min Area (sqft)"
        onChange={(e) => dispatch(setMinArea(Number(e.target.value)))}
        className="border p-2 rounded"
      />

      {/* Parking */}
      <select
        onChange={(e) => dispatch(setParking(e.target.value))}
        className="border p-2 rounded"
      >
        <option value="">Parking</option>
        <option value="covered">Covered</option>
        <option value="open">Open</option>
      </select>
    </div>
  );
};

export default CommercialFilters;
