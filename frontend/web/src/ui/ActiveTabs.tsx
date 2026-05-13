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
      <div className="flex gap-4 sm:gap-8 min-w-max px-1">
        {tabs.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`pb-2 text-sm sm:text-base font-medium whitespace-nowrap transition-all relative cursor-pointer ${
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
