"use client";

type HomeSectionComingSoonProps = {
  title: string;
  description: string;
};

export default function HomeSectionComingSoon({
  title,
  description,
}: HomeSectionComingSoonProps) {
  return (
    <div className="mt-4 rounded-2xl border border-[#d8eadf] bg-gradient-to-r from-[#f4fbf7] to-[#eef8f2] px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <div className="rounded-full bg-[#26ad5f]/10 px-4 py-1 text-sm font-semibold text-[#1e8e4d]">
          Coming Soon
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 sm:text-base">{description}</p>
      </div>
    </div>
  );
}
