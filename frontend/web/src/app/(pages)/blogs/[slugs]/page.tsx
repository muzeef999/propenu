import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiEye,
  FiTag,
  FiUser,
} from "react-icons/fi";
import { BlogDetail, getBlogBySlug } from "@/data/serverData";

type PageProps = {
  params: { slugs: string } | Promise<{ slugs: string }>;
};

const fallbackImage = "/images/placeholder.svg";

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function ContentBlock({ content }: { content?: string }) {
  if (!content) return null;

  if (hasHtml(content)) {
    return (
      <div
        className="text-base leading-8 text-gray-700 [&_a]:text-[#26ad5f] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-gray-950 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-950 [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_strong]:text-gray-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return <p className="whitespace-pre-line text-base leading-8 text-gray-700">{content}</p>;
}

function InfoItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-white/85">
      {icon}
      {label}
    </span>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slugs } = await params;
  const blog = await getBlogBySlug({ slug: slugs });

  if (!blog) {
    return {
      title: "Blog Not Found",
      description: "Blog not found",
    };
  }

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    keywords: blog.metaKeywords,
    alternates: blog.canonicalUrl
      ? {
          canonical: blog.canonicalUrl,
        }
      : undefined,
  };
}

export default async function Page({ params }: PageProps) {
  const { slugs } = await params;
  let blog: BlogDetail | null = null;

  try {
    blog = await getBlogBySlug({ slug: slugs });
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  if (!blog) {
    notFound();
  }

  const publishedDate = formatDate(blog.publishedAt ?? blog.createdAt);

  return (
    <main className="min-h-screen bg-[#FBFFFD]">
      <section className="relative min-h-[420px] overflow-hidden bg-gray-950">
        <Image
          src={blog.featuredImage || fallbackImage}
          alt={blog.imageAlt || blog.title}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-65"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/20" />

        <div className="container relative z-10 flex min-h-[420px] flex-col justify-end pb-8 pt-24">
          <Link
            href="/"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            <FiArrowLeft size={16} />
            Back to home
          </Link>

          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#26ad5f] px-4 py-2 text-sm font-medium text-white">
              <FiTag size={15} />
              {blog.category}
            </span>

            <h1 className="mt-5 text-3xl font-bold leading-tight text-white sm:text-5xl">
              {blog.title}
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-white/82 sm:text-lg">
              {blog.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              {publishedDate && (
                <InfoItem icon={<FiCalendar size={16} />} label={publishedDate} />
              )}
              <InfoItem
                icon={<FiClock size={16} />}
                label={`${blog.readTime ?? 5} min read`}
              />
              <InfoItem
                icon={<FiEye size={16} />}
                label={`${blog.views ?? 0} views`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
            <ContentBlock content={blog.content} />

            {blog.articleSections?.map((section) => (
              <section key={`${section.heading}-${section.content}`} className="mt-8">
                {section.heading && (
                  <h2 className="mb-3 text-2xl font-semibold text-gray-950">
                    {section.heading}
                  </h2>
                )}
                <ContentBlock content={section.content} />
              </section>
            ))}

            {blog.faqs && blog.faqs.length > 0 && (
              <section className="mt-10 border-t border-gray-100 pt-8">
                <h2 className="text-2xl font-semibold text-gray-950">FAQs</h2>
                <div className="mt-4 space-y-3">
                  {blog.faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="group rounded-lg border border-gray-100 bg-[#FBFFFD] p-4"
                    >
                      <summary className="cursor-pointer text-base font-medium text-gray-950">
                        {faq.question}
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-20">
            {blog.author && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-50 text-[#26ad5f]">
                    {blog.author.profileImage ? (
                      <Image
                        src={blog.author.profileImage}
                        alt={blog.author.name || "Author"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <FiUser size={24} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-gray-950">
                      {blog.author.name || "Propenu Editorial"}
                    </h2>
                    {blog.author.designation && (
                      <p className="truncate text-sm text-gray-500">
                        {blog.author.designation}
                      </p>
                    )}
                  </div>
                </div>
                {blog.author.description && (
                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {blog.author.description}
                  </p>
                )}
              </div>
            )}

            {blog.tags && blog.tags.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-950">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-[#26ad5f]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-green-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-950">
                Explore properties
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Compare verified projects and owner-listed homes after reading.
              </p>
              <Link
                href="/properties"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#26ad5f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#219653]"
              >
                Browse properties
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
