export function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <p className="text-gray-500 shrink-0">{label}</p>
      <p className="font-medium text-gray-800 text-right">{value}</p>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 min-w-[130px] shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}

export function StatBox({
  label,
  value,
  bgColor,
  textColor,
}: {
  label: string;
  value: number | string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div
      className={`${bgColor} rounded-xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-default`}
    >
      <span className={`text-md font-medium ${textColor}`}>{value}</span>
      <span className="text-xs font-normal text-gray-400 leading-tight mt-1">
        {label.split(" ").join("\n")}
      </span>
    </div>
  );
}