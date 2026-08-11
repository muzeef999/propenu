const heroStats = Array.from({ length: 4 });
const overviewItems = Array.from({ length: 6 });
const floorCards = Array.from({ length: 3 });
const amenityItems = Array.from({ length: 8 });
const specItems = Array.from({ length: 6 });
const galleryItems = Array.from({ length: 4 });
const videoItems = Array.from({ length: 2 });

function Card({
  titleWidth = "w-40",
  children,
}: {
  titleWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className={`mb-5 h-7 rounded bg-slate-200 ${titleWidth}`} />
      {children}
    </section>
  );
}

export default function ProjectLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <section className="overflow-hidden border-b border-emerald-100 bg-white">
        <div className="animate-pulse">
          <div className="h-[280px] w-full bg-gradient-to-br from-emerald-100 via-slate-100 to-emerald-50 sm:h-[420px]">
            <div className="mx-0 flex h-full flex-col justify-end sm:mx-4 lg:mx-5 xl:mx-28 2xl:mx-34">
              <div className="px-4 pb-6 sm:px-0 sm:pb-8">
                <div className="mb-3 h-4 w-28 rounded bg-emerald-200/90" />
                <div className="h-11 w-3/4 max-w-[720px] rounded bg-white/80" />
                <div className="mt-3 h-5 w-1/2 max-w-[380px] rounded bg-white/70" />

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-[760px] lg:grid-cols-4">
                  {heroStats.map((_, index) => (
                    <div
                      key={`hero-stat-${index}`}
                      className="rounded-2xl border border-white/50 bg-white/75 p-4 backdrop-blur-sm"
                    >
                      <div className="h-3 w-16 rounded bg-slate-200" />
                      <div className="mt-3 h-6 w-24 rounded bg-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald-50/60 py-5">
        <div className="mx-0 flex min-w-0 flex-col gap-5 sm:mx-4 lg:mx-5 lg:flex-row lg:items-start xl:mx-28 2xl:mx-34">
          <div className="w-full min-w-0 flex-1 space-y-4">
            <Card titleWidth="w-36">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {overviewItems.map((_, index) => (
                  <div key={`overview-${index}`} className="space-y-2">
                    <div className="h-4 w-24 rounded bg-slate-200" />
                    <div className="h-5 w-32 rounded bg-slate-300" />
                  </div>
                ))}
              </div>
            </Card>

            <Card titleWidth="w-44">
              <div className="grid gap-4 lg:grid-cols-3">
                {floorCards.map((_, index) => (
                  <div
                    key={`floor-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <div className="h-36 bg-slate-200" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-28 rounded bg-slate-300" />
                      <div className="h-4 w-20 rounded bg-slate-200" />
                      <div className="h-9 w-full rounded-xl bg-emerald-100" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card titleWidth="w-32">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {amenityItems.map((_, index) => (
                  <div
                    key={`amenity-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-200" />
                    <div className="h-4 w-20 rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            </Card>

            <Card titleWidth="w-40">
              <div className="h-[280px] rounded-2xl bg-slate-200" />
            </Card>

            <Card titleWidth="w-36">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {specItems.map((_, index) => (
                  <div key={`spec-${index}`} className="space-y-2">
                    <div className="h-4 w-28 rounded bg-slate-200" />
                    <div className="h-5 w-36 rounded bg-slate-300" />
                  </div>
                ))}
              </div>
            </Card>

            <Card titleWidth="w-44">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {galleryItems.map((_, index) => (
                  <div
                    key={`gallery-${index}`}
                    className="h-40 rounded-2xl bg-slate-200 sm:h-44"
                  />
                ))}
              </div>
            </Card>

            <Card titleWidth="w-36">
              <div className="grid gap-4 lg:grid-cols-2">
                {videoItems.map((_, index) => (
                  <div
                    key={`video-${index}`}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <div className="h-44 bg-slate-200" />
                    <div className="space-y-2 p-4">
                      <div className="h-5 w-2/3 rounded bg-slate-300" />
                      <div className="h-4 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card titleWidth="w-40">
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-11/12 rounded bg-slate-200" />
                <div className="h-4 w-4/5 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
              </div>
            </Card>

            <Card titleWidth="w-44">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="h-36 w-full rounded-2xl bg-slate-200 sm:w-40" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-40 rounded bg-slate-300" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-200" />
                  <div className="h-10 w-44 rounded-xl bg-emerald-100" />
                </div>
              </div>
            </Card>
          </div>

          <div className="w-full shrink-0 lg:sticky lg:top-20 lg:w-80 xl:w-[340px]">
            <div className="animate-pulse rounded-md border border-slate-200 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.08)] lg:p-5">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="h-14 w-14 rounded-md bg-slate-200 sm:h-18 sm:w-18" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-slate-300" />
                  <div className="h-3 w-16 rounded bg-slate-200" />
                </div>
              </div>

              <div className="mt-4 h-5 w-40 rounded bg-slate-200" />

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-md bg-emerald-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-md bg-emerald-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-md bg-emerald-100" />
                </div>
                <div className="h-10 w-full rounded-md bg-slate-200" />
                <div className="h-10 w-full rounded-md bg-emerald-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
