import { FeaturedProject } from "@/types";

type AboutProjectProps = {
  project: FeaturedProject;
};

function stripHtml(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function AboutProject({ project }: AboutProjectProps) {
  const about = project.aboutSummary?.[0];
  const imageUrl = about?.url || project.heroImage || project.gallerySummary?.[0]?.url;
  const description =
    stripHtml(about?.aboutDescription) ||
    stripHtml(about?.rightContent) ||
    project.heroDescription ||
    project.metaDescription;

  if (!description && !imageUrl) {
    return null;
  }

  return (
    <section id="about-project" className="scroll-mt-20">
      <div className="container mx-auto px-1 sm:px-4 lg:px-3">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <h2 className="border-b border-slate-200 px-4 py-4 text-lg font-medium text-slate-950 sm:px-5 sm:py-5 sm:text-xl">
            About Project
          </h2>

          <div
            className={`grid gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5 ${
              imageUrl ? "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]" : ""
            }`}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={`${project.title} overview`}
                className="h-40 w-full rounded-md object-cover sm:h-44 md:h-[200px]"
              />
            )}

            <div className="space-y-4 text-sm leading-6 text-slate-500 sm:text-base">
              {description ? (
                <p className="line-clamp-8 sm:line-clamp-6">{description}</p>
              ) : (
                <p>Project details coming soon.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
