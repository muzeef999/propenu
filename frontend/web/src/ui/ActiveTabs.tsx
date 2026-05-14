"use client";

import { useEffect, useMemo } from "react";

type ActiveTabsProps = {
  categories: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  visibleCategories?: string[];
  shouldShowCategory?: (category: string) => boolean;
};

const ActiveTabs = ({
  categories,
  activeTab,
  setActiveTab,
  visibleCategories,
  shouldShowCategory,
}: ActiveTabsProps) => {
  const tabs = useMemo(() => {
    if (visibleCategories) {
      return categories.filter((category) => visibleCategories.includes(category));
    }

    if (shouldShowCategory) {
      return categories.filter(shouldShowCategory);
    }

    return categories;
  }, [categories, shouldShowCategory, visibleCategories]);

  useEffect(() => {
    if (!tabs.length) return;

    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [activeTab, setActiveTab, tabs]);

  if (!tabs.length) {
    return null;
  }

  return (
    <div className="overflow-x-auto sm:overflow-visible border-b border-gray-100 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-3 sm:gap-6 min-w-max px-1">
        {tabs.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`group relative cursor-pointer whitespace-nowrap rounded-t-lg px-2.5 pb-2 pt-1 text-sm font-medium transition-all duration-300 ease-out sm:text-base ${
              activeTab === cat
                ? "text-emerald-600"
                : "text-gray-500 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            <span className="relative z-10">{cat}</span>

            {!activeTab || activeTab !== cat ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 origin-center scale-x-0 rounded-full bg-emerald-300 transition-transform duration-300 ease-out group-hover:scale-x-100" />
            ) : null}

            {/* Active underline */}
            {activeTab === cat && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActiveTabs;
