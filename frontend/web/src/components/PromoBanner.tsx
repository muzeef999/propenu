"use client";

export default function PromoBanner() {
  return (
    <section className="relative overflow-hidden bg-[#E8F5EE] rounded-xl px-6 py-4 md:py-3 flex flex-col md:flex-row justify-between items-center border border-[#D1E7DD] mb-6">
      <div className="z-10 space-y-3 max-w-lg text-center md:text-left">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 leading-snug">
          Unlock more owner contacts & more opportunities with subscriptions
        </h2>
        <button className="btn-primary text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm">
          Upgrade your Plan
        </button>
      </div>

      <div className="relative mt-4 md:mt-0 h-24 md:h-28">
        <img
          src="https://illustrations.popsy.co/emerald/customer-support.svg"
          alt="Promo"
          className="h-full w-auto object-contain"
        />
      </div>
    </section>
  );
}
