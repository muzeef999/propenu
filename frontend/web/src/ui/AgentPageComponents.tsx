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
      <span className="text-gray-400 min-w-[130px] shrink-0 text-sm">{label}</span>
      <span className="text-gray-700 font-medium text-sm">{value}</span>
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

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
}

export const Card = ({ title, children, className = "", onEdit }: CardProps) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-md">{title}</h3>
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-green-600 hover:text-green-700 transition"
          title="Edit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);