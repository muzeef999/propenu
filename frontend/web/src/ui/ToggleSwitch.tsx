const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`${
        enabled ? "bg-green-500" : "bg-gray-200"
      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
    >
      <span
        className={`${
          enabled ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
};

export default Toggle;