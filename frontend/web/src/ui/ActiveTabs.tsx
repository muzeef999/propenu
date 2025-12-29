"use client";

type ActiveTabsProps = {
  categories: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const ActiveTabs = ({
  categories,
  activeTab,
  setActiveTab,
}: ActiveTabsProps) => {
  return (
    <div className="flex gap-8 border-b border-gray-100">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => setActiveTab(cat)}
          className={`pb-2 text-base font-medium transition-all relative ${
            activeTab === cat
              ? "text-emerald-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {cat}

          {/* Active underline */}
          {activeTab === cat && (
            <span className="absolute -bottom-[1px] left-0 w-full h-[2px] bg-emerald-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default ActiveTabs;
