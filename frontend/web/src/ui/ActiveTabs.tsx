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
<div className="overflow-x-auto sm:overflow-visible border-b border-gray-100">
        <div className="flex gap-4 sm:gap-8 min-w-max px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`pb-2 text-sm sm:text-base font-medium whitespace-nowrap transition-all relative ${
              activeTab === cat
                ? "text-emerald-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {cat}

            {/* Active underline */}
            {activeTab === cat && (
              <span className="absolute -bottom-px left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActiveTabs;