import { hexToRGBA } from "@/ui/hexToRGBA";

type Props = {
  label: string;
  status: "active" | "completed" | "pending";
  isLast?: boolean;
};

export default function StepItem({ label, status, isLast = false }: Props) {
  const bgPriceColor = hexToRGBA("#27AE60", 0.1);

  const isActive = status === "active";
  const isCompleted = status === "completed";

  // ✅ Line color logic
  const lineColor = isCompleted
    ? "#27AE60"
    : isActive
    ? hexToRGBA("#27AE60", 0.4)
    : "#D1D5DB";

  return (
    <div className="flex gap-4">
      {/* Circle + Line */}
      <div className="relative flex flex-col items-center">
        {/* Circle */}
        <div
          className="relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{
            backgroundColor: isActive
              ? bgPriceColor
              : isCompleted
              ? "#27AE60"
              : "#ffffff",
            borderColor: isActive || isCompleted ? "#27AE60" : "#D1D5DB",
          }}
        >
          {(isActive || isCompleted) && (
            <div className="w-2.5 h-2.5 rounded-full bg-[#27AE60]" />
          )}
        </div>

        {/* Line */}
        {!isLast && (
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 w-0.5 h-full"
            style={{ backgroundColor: lineColor }}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <p
          className={`text-sm font-regular ${
            isActive || isCompleted ? "text-green-600" : "text-gray-700"
          }`}
        >
          {label}
        </p>

        <span
          className={`text-xs px-2 py-0.5 rounded-full w-fit ${
            isCompleted
              ? "bg-green-600 text-white"
              : isActive
              ? "bg-green-100 text-green-700"
              : "bg-white text-gray-500 border"
          }`}
        >
          {isCompleted ? "Completed" : isActive ? "In progress" : "Pending"}
        </span>
      </div>
    </div>
  );
}
