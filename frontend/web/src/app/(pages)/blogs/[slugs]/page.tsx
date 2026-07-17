import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiEye,
  FiHeart,
  FiShare2,
} from "react-icons/fi";
import {
  BlogDetail,
  BlogPreview,
  getBlogArticleLists,
  getBlogBySlug,
} from "@/data/serverData";
import BlogActions from "./BlogActions";

type PageProps = {
  params: { slugs: string } | Promise<{ slugs: string }>;
};

const fallbackImage = "/images/placeholder.svg";

function formatShortDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function stripHtml(value?: string) {
  if (!value) return "";

  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getArticleSectionId(heading: string, index: number) {
  const slug = heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `article-section-${slug || index}-${index}`;
}

function getAuthorInitials(name?: string) {
  if (!name) return "P";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ContentBlock({ content }: { content?: string }) {
  if (!content) return null;

  if (hasHtml(content)) {
    return (
      <div
        className="text-[15px] leading-7 text-gray-700 sm:text-base sm:leading-8 [&_a]:text-[#26ad5f] [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-950 sm:[&_h2]:text-2xl [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-950 sm:[&_h3]:text-xl [&_li]:mb-2 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-5 [&_strong]:text-gray-950 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700 sm:text-base sm:leading-8">
      {content}
    </p>
  );
}

function InfoItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600">
      {icon}
      {label}
    </span>
  );
}

function PopularArticleCard({ article }: { article: BlogPreview }) {
  return (
    <Link
      href={`/blogs/${article.slug}`}
      className="group flex gap-3 rounded-lg border border-gray-100 p-3 transition hover:border-green-100 hover:bg-green-50/40 bg-white"
    >
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
        <Image
          src={article.featuredImage || fallbackImage}
          alt={article.imageAlt || article.title}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="min-w-0">
        {article.category && (
          <p className="truncate text-xs font-medium text-[#26ad5f]">
            {article.category}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-gray-950 transition group-hover:text-[#26ad5f]">
          {article.title}
        </h3>
        <p className="mt-1 text-xs text-gray-400">5 min read</p>
      </div>
    </Link>
  );
}

function RecentArticleCard({ article }: { article: BlogPreview }) {
  return (
    <Link
      href={`/blogs/${article.slug}`}
      className="group block overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:border-green-100 hover:shadow-sm"
    >
      <div className="relative aspect-video bg-gray-100">
        <Image
          src={article.featuredImage || fallbackImage}
          alt={article.imageAlt || article.title}
          fill
          sizes="(max-width: 768px) 100vw, 260px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="p-4">
        {article.category && (
          <p className="mb-2 text-xs font-medium text-[#26ad5f]">
            {article.category}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950 transition group-hover:text-[#26ad5f]">
          {article.title}
        </h3>
      </div>
    </Link>
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
  let recentArticles: BlogPreview[] = [];
  let popularArticles: BlogPreview[] = [];

  try {
    blog = await getBlogBySlug({ slug: slugs });
  } catch (error) {
    console.error("Error fetching blog:", error);
  }

  if (!blog) {
    notFound();
  }

  try {
    const articleLists = await getBlogArticleLists();

    recentArticles = articleLists.recentArticles.filter(
      (article) => article.slug !== slugs,
    );
    popularArticles = articleLists.popularArticles.filter(
      (article) => article.slug !== slugs,
    );
  } catch (error) {
    console.error("Error fetching blog article lists:", error);
  }

  const shortPublishedDate = formatShortDate(blog.publishedAt ?? blog.createdAt);
  const articleContext = (blog.articleSections ?? [])
    .map((section, index) =>
      section.heading
        ? {
          heading: section.heading,
          id: getArticleSectionId(section.heading, index),
        }
        : null,
    )
    .filter((item): item is { heading: string; id: string } => Boolean(item));

  return (
    <main className="min-h-screen bg-[#f6fbf8] py-6">
      <section className="container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,850px)_260px] lg:items-start lg:justify-center">
          <article className="min-w-0 max-w-[850px]">
            <h1 className="max-w-3xl text-[28px] font-semibold leading-9 text-gray-950 sm:text-4xl sm:leading-tight">
              {blog.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <InfoItem
                  icon={<FiClock size={14} />}
                  label={`${blog.readTime ?? 5} min read`}
                />
                {shortPublishedDate && (
                  <InfoItem
                    icon={<FiCalendar size={14} />}
                    label={shortPublishedDate}
                  />
                )}
              </div>

              <BlogActions
                blogId={blog._id}
                title={blog.title}
                initialLikes={blog.likes}
                initialShares={blog.shares}
              />
            </div>

            <div className="relative mt-5 aspect-[16/7.7] min-h-50 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={blog.featuredImage || fallbackImage}
                alt={blog.imageAlt || blog.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>

  

            <div className="mt-6">
              {blog.excerpt && (
                <div className="mb-6">
                  <ContentBlock content={blog.excerpt} />
                </div>
              )}

              <ContentBlock content={blog.content} />

              {blog.articleSections?.map((section, index) => (
                <section
                  key={`${section.heading}-${section.content}`}
                  id={
                    section.heading
                      ? getArticleSectionId(section.heading, index)
                      : undefined
                  }
                  tabIndex={section.heading ? -1 : undefined}
                  className="mt-8 scroll-mt-8 focus:outline-none"
                >
                  {section.heading && (
                    <h2 className="mb-3 text-xl font-semibold text-gray-950 sm:text-2xl">
                      {section.heading}
                    </h2>
                  )}
                  <ContentBlock content={section.content} />
                </section>
              ))}

              {blog.faqs && blog.faqs.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-semibold text-gray-950 sm:text-2xl">
                    Frequently Asked Questions
                  </h2>
                  <div className="mt-5">
                    {blog.faqs.map((faq) => (
                      <details
                        key={faq.question}
                        className="group py-4"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-normal text-gray-600 marker:hidden [&::-webkit-details-marker]:hidden">
                          <span>{stripHtml(faq.question)}</span>
                          <FiChevronDown
                            size={16}
                            className="shrink-0 text-gray-600 transition group-open:rotate-180"
                          />
                        </summary>
                        <div className="mt-3 pr-8">
                          <ContentBlock content={faq.answer} />
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {blog.author && (
                <section className="mt-12 rounded-lg border border-gray-200 bg-white p-5">
                  <p className="mb-3 text-xs font-semibold uppercase text-[#26ad5f]">
                    Written by
                  </p>

                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#27AE60] text-base font-semibold text-[#26ad5f] shadow-sm">
                      <span>{getAuthorInitials(blog.author.name)}</span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-gray-950">
                        {blog.author.name || "Propenu Editorial"}
                      </h2>
                      {blog.author.designation && (
                        <p className="mt-1 text-sm text-gray-500">
                          {blog.author.designation}
                        </p>
                      )}

                      {blog.author.description && (
                        <div className="mt-3 text-sm leading-6 text-gray-600">
                          <ContentBlock content={blog.author.description} />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {recentArticles.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-semibold text-gray-950 sm:text-2xl">
                    Recent Articles
                  </h2>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recentArticles.map((article) => (
                      <RecentArticleCard
                        key={article._id ?? article.slug}
                        article={article}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <div className="space-y-3 text-xs text-gray-500">
              <p className="flex items-center gap-2">
                <FiEye size={14} />
                <span>{blog.views ?? 0} Views</span>
              </p>

              <p className="flex items-center gap-2">
                <FiShare2 size={14} />
                <span>{blog.shares ?? 0} Shares</span>
              </p>

              <p className="flex items-center gap-2">
                <FiHeart size={14} />
                <span>{blog.likes ?? 0} Likes</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8F5EE] bg-white p-6 text-center">
              <h3 className="mb-2 text-lg font-medium leading-tight text-gray-800">
                Sell/Rent Your Property <br />
                with us for <span className="text-[#27A361]">Free</span>
              </h3>

              <p className="mb-5 text-xs text-gray-500">
                Find Buyers & Tenants easily
              </p>

              <Link
                href="/postproperty"
                className="btn-primary flex items-center justify-center"
              >
                Post Property
              </Link>
            </div>

            
            {articleContext.length > 0 && (
              <div className="mt-5 border-b border-gray-200 pb-5">
                <h2 className="text-lg font-semibold text-gray-950">
                  Article Context
                </h2>

                <ul className="mt-3 space-y-2">
                  {articleContext.map((item, index) => (
                    <li key={`${item.id}-${index}`}>
                      <a
                        href={`#${item.id}`}
                        className="group flex items-start gap-2 text-sm leading-6 text-gray-500 transition hover:text-[#26ad5f] focus:outline-none focus-visible:text-[#26ad5f]"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400 transition group-hover:bg-[#26ad5f]" />
                        <span>{item.heading}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {popularArticles.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <h2 className="text-sm font-semibold text-gray-950">
                  Popular Articles
                </h2>

                <div className="mt-4 space-y-3">
                  {popularArticles.map((article) => (
                    <PopularArticleCard
                      key={article._id ?? article.slug}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
