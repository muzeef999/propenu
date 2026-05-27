import mongoose from "mongoose";

const { Schema } = mongoose;

/* ---------------- FAQ Schema ---------------- */

const faqSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

/* ---------------- Author Schema ---------------- */

const authorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    designation: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    socialLinks: {
      linkedin: String,
      twitter: String,
      website: String,
    },
  },
  { _id: false },
);

/* ---------------- Main Blog Schema ---------------- */

const blogSchema = new Schema(
  {
    /* BASIC */

    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    /* FEATURE IMAGE */

    featuredImage: {
      type: String,
      required: true,
    },

    imageAlt: {
      type: String,
      default: "",
    },

    /* BLOG CONTENT */

    content: {
      type: String,
      required: true,
    },

    /* ARTICLE CONTENT SECTIONS */

    articleSections: [
      {
        heading: String,
        content: String,
      },
    ],

    /* AUTHOR */

    author: {
      type: authorSchema,
      required: true,
    },

    /* CATEGORY + TAGS */

    category: {
      type: String,
      trim: true,
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    /* FAQ */

    faqs: {
      type: [faqSchema],
      default: [],
    },

    /* SEO */

    metaTitle: {
      type: String,
      trim: true,
      required: true,
    },

    metaDescription: {
      type: String,
      trim: true,
      required: true,
    },

    metaKeywords: {
      type: [String],
      default: [],
    },

    canonicalUrl: {
      type: String,
      default: "",
    },

    /* BLOG STATUS */

    published: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    /* EXTRA FEATURES */

    readTime: {
      type: Number,
      default: 5,
    },

    views: {
      type: Number,
      default: 0,
    },

    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/* ---------------- SLUG GENERATION ---------------- */

blogSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  next();
});

/* ---------------- MODEL ---------------- */

let Blog;

try {
  Blog = mongoose.model("blog");
} catch {
  Blog = mongoose.model("blog", blogSchema);
}

export default Blog;
