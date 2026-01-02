"use client";

import { Plan } from "@/types";

function normalizePlans(plans: Plan[]) {
  return {
    free: plans.find(p => p.tier === "free") ?? null,
    tier1: plans.find(p => p.tier === "tier1") ?? null,
    tier2: plans.find(p => p.tier === "tier2") ?? null,
    tier3: plans.find(p => p.tier === "tier3") ?? null,
  };
}



type FeatureRow = {
  label: string;
  render: (plan: any) => string;
};

type Props = {
  plans: any[];
  features: FeatureRow[];
};

export default function PricingComparisonTable({
  plans,
  features,
}: Props) {
  const t = normalizePlans(plans);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left">Feature</th>
            <th className="border p-3">FREE (Basic)</th>
            <th className="border p-3">TIER 1</th>
            <th className="border p-3">TIER 2</th>
            <th className="border p-3">TIER 3</th>
          </tr>
        </thead>

        <tbody>
          {features.map(row => (
            <tr key={row.label}>
              <td className="border p-3 font-medium">{row.label}</td>
              <td className="border p-3 text-center">
                {t.free ? row.render(t.free) : "—"}
              </td>
              <td className="border p-3 text-center">
                {t.tier1 ? row.render(t.tier1) : "—"}
              </td>
              <td className="border p-3 text-center">
                {t.tier2 ? row.render(t.tier2) : "—"}
              </td>
              <td className="border p-3 text-center">
                {t.tier3 ? row.render(t.tier3) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
