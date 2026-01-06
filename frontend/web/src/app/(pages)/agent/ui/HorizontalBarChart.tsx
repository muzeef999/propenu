"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartItem = {
  name: string;
  value: number;
};

type Props = {
  data: ChartItem[];
};

const HorizontalBarChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 2, bottom: 10 }}
        >
          {/* X Axis */}
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Y Axis */}
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={80}
            axisLine={false}
            tickLine={false}
          />

          {/* Tooltip (no background overlay) */}
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 8,
              fontSize: 12,
              border: "none",
            }}
          />

          {/* Bars */}
          <Bar
            dataKey="value"
            radius={[6, 6, 6, 6]}
            fill="#10B981"
            barSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HorizontalBarChart;
