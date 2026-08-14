const detailSkeletonItems = Array.from({ length: 6 });
const moreDetailSkeletonItems = Array.from({ length: 8 });
const amenitySkeletonItems = Array.from({ length: 6 });

export default function PropertyDetailsLoading() {
  return (
    <div className="min-h-screen overflow-hidden py-6">
      <div className="container">
        <div className="w-full">
          <header className="flex flex-col justify-between gap-2 p-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-8 w-32 animate-pulse rounded bg-emerald-100" />
              <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
            </div>
          </header>

          <div className="flex min-w-0 flex-col gap-8 lg:flex-row lg:items-stretch">
            <main className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-stretch">
                <div className="min-w-0 w-full lg:w-[58%]">
                  <div className="h-[260px] w-full animate-pulse rounded-2xl bg-gray-200 sm:h-[360px]" />
                </div>

                <div className="flex min-w-0 min-h-0 flex-1 self-stretch">
                  <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-8 p-4 sm:p-2">
                    <div className="grid grid-cols-2 gap-8 pl-1">
                      {detailSkeletonItems.map((_, index) => (
                        <div key={`detail-skeleton-${index}`} className="flex flex-col gap-2">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                          <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 overflow-hidden rounded-md border border-gray-200 shadow-sm">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`stat-skeleton-${index}`}
                          className={`flex flex-col items-center justify-center gap-2 py-4 ${
                            index === 1 ? "border-x border-gray-200" : ""
                          }`}
                        >
                          <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
                          <div className="h-5 w-8 animate-pulse rounded bg-gray-200" />
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <br />

              <div className="min-w-0 w-full">
                <div className="grid gap-4">
                  <section className="min-w-0 space-y-4">
                    <section className="rounded-lg bg-[#f7f9fa] p-6 shadow-sm">
                      <div className="mb-6 h-7 w-40 animate-pulse rounded bg-gray-200" />

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {moreDetailSkeletonItems.map((_, index) => (
                          <div
                            key={`more-detail-skeleton-${index}`}
                            className="grid grid-cols-[32px_1fr] grid-rows-2 gap-x-3 items-center"
                          >
                            <div className="row-span-2 flex items-center justify-center">
                              <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                            </div>
                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-gray-200" />
                      </div>

                      <div className="mt-6">
                        <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-full animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-gray-200" />
                      </div>

                      <div className="mt-8 h-11 w-full animate-pulse rounded-lg bg-emerald-200" />
                    </section>

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <div className="mb-3 h-7 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {amenitySkeletonItems.map((_, index) => (
                          <div
                            key={`amenity-skeleton-${index}`}
                            className="flex items-center gap-2 rounded-md border border-gray-100 px-2 py-2"
                          >
                            <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <div className="mb-3 h-7 w-52 animate-pulse rounded bg-gray-200" />
                      <div className="h-[260px] w-full animate-pulse rounded-xl bg-gray-200" />
                    </section>

                    <section className="rounded-lg bg-[#f7f9fa] p-4 shadow-sm">
                      <div className="mb-2 h-7 w-60 animate-pulse rounded bg-gray-200" />
                      <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={`related-skeleton-${index}`}
                            className="w-[260px] shrink-0 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <div className="h-36 w-full animate-pulse rounded-xl bg-gray-200" />
                            <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                            <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                          </div>
                        ))}
                      </div>
                    </section>
                  </section>
                </div>
              </div>
            </main>

            <aside className="sticky top-20 self-start w-full shrink-0 lg:w-[260px]">
              <section className="overflow-hidden rounded-2xl bg-white shadow-md">
                <div className="relative h-40 w-full overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
                  <div className="h-full w-full animate-pulse bg-gray-200" />
                  <div className="absolute left-2 top-2 h-7 w-24 animate-pulse rounded-md bg-black/20" />
                  <div className="absolute bottom-2 right-2 h-9 w-9 animate-pulse rounded-full bg-white/90 shadow-md" />
                </div>

                <div className="flex flex-col gap-2 p-3">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-emerald-200" />
                    <div className="h-4 w-4 animate-pulse rounded bg-emerald-200" />
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
