"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type PieItem = {
  name: string;
  value: number;
};

type Props = {
  data: PieItem[];
};

const COLORS = ["#10B981", "#6366F1", "#F59E0B", "#EF4444"];

const PieChartcard: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              fontSize: 12,
            }}
          />

          {/* Legend */}
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            wrapperStyle={{ fontSize: 12 }}
          />

          {/* Pie */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            outerRadius={90}
            innerRadius={55}   // 🔥 donut style
            paddingAngle={4}
            label
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartcard;
