import mongoose, { Model } from "mongoose";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import s3 from "../config/s3";
import Agent from "../models/agentModel";
import { CreateAgentDTO, UpdateAgentDTO } from "../zod/validation";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import { getFromDate } from "../utils/dateRange";
import { IResidential } from "../types/residentialTypes";
import { ICommercial } from "../types/commercialTypes";
import { ILand } from "../types/landTypes";
import { IAgricultural } from "../types/agriculturalTypes";

dotenv.config({ quiet: true });

type MulterFiles =
  | { avatar?: Express.Multer.File[]; coverImage?: Express.Multer.File[] }
  | undefined;

async function uploadBufferToS3Local(opts: {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  agentId: string;
  folder?: string;
}) {
  const { buffer, originalname, mimetype, agentId, folder = "agents" } = opts;

  const bucket = process.env.AWS_S3_BUCKET!;
  const region = process.env.AWS_REGION!;

  const ext = originalname.includes(".") ? originalname.split(".").pop() : "";
  const uniqueName = `${Date.now()}-${randomUUID()}${ext ? "." + ext : ""}`;

  const safeFolder = folder.replace(/^\/+|\/+$/g, "");
  const key = `${safeFolder}/${agentId}/${uniqueName}`;

  await s3
    .upload({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
    .promise();

  return {
    key,
    url: `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(
      key
    )}`,
  };
}

async function deleteS3ObjectIfExists(key?: string) {
  if (!key) return;

  const bucket = process.env.AWS_S3_BUCKET!;
  try {
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
  } catch (e) {
    console.error("S3 delete failed:", key, e);
  }
}

const AgentService = {
  async createAgent(payload: CreateAgentDTO, files?: MulterFiles) {
    // one agent per user
    const exists = await Agent.findOne({ user: payload.user });
    if (exists) throw new Error("Agent already exists for this user");

    // slug creation
    const slugBase = payload.slug || payload.name;
    let slug = slugBase
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const slugExists = await Agent.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    // preliminary ID for S3 folder
    const preliminary = new Agent({ ...payload, slug });
    const agentId = preliminary._id.toString();

    const toCreate: any = { ...payload, slug };

    // AVATAR upload
    const avatarFile = files?.avatar?.[0];
    if (avatarFile) {
      const up = await uploadBufferToS3Local({
        buffer: avatarFile.buffer,
        originalname: avatarFile.originalname,
        mimetype: avatarFile.mimetype,
        agentId,
        folder: "agents/avatar",
      });
      toCreate.avatar = { url: up.url, key: up.key };
    }

    // COVER IMAGE upload
    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
      const up = await uploadBufferToS3Local({
        buffer: coverFile.buffer,
        originalname: coverFile.originalname,
        mimetype: coverFile.mimetype,
        agentId,
        folder: "agents/cover",
      });
      toCreate.coverImage = { url: up.url, key: up.key };
    }

    const created = await Agent.create(toCreate);
    return created.toObject();
  },

  async getAgentBySlugWithProperties(slug: string) {
    if (!slug) throw new Error("Invalid slug");

    const agent = await Agent.findOne({ slug })
      .populate("user", "name email phone")
      .lean();

    if (!agent) throw new Error("Agent not found");

    const userId = typeof agent.user === "string" ? agent.user : agent.user._id;

    const [residential, commercial, land, agricultural] = await Promise.all([
      Residential.find({ createdBy: userId, status: "active" }).lean(),
      Commercial.find({ createdBy: userId, status: "active" }).lean(),
      LandPlot.find({ createdBy: userId, status: "active" }).lean(),
      Agricultural.find({ createdBy: userId, status: "active" }).lean(),
    ]);

    return {
      agent,
      properties: {
        residential,
        commercial,
        land,
        agricultural,
        total:
          residential.length +
          commercial.length +
          land.length +
          agricultural.length,
      },
    };
  },



async  getAgentsByLocationService(
  location: { city?: string; state?: string },
  page = 1,
  limit = 20
) {

    const filter: any = {}; // ❌ removed status

  if (location.city)
    filter.city = new RegExp(`^${location.city}$`, "i");

  if (location.state)
    filter.state = new RegExp(`^${location.state}$`, "i");

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Agent.find(filter)
      .select(
        "name slug avatar coverImage agencyName bio areasServed stats dealsClosed city state"
      )
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),

    Agent.countDocuments(filter),
  ]);

  return {
    total,
    page,
    limit,
    items,
  };
},


  

  async editAgent(id: string, payload: UpdateAgentDTO, files?: MulterFiles) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");

    const existing = await Agent.findById(id);
    if (!existing) throw new Error("Agent not found");

    // update slug
    if (payload.slug && payload.slug !== existing.slug) {
      const newSlug = payload.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

      const conflict = await Agent.findOne({ slug: newSlug });
      if (conflict && conflict._id.toString() !== id)
        throw new Error("Slug already used");

      existing.slug = newSlug;
    }

    Object.assign(existing, payload);
    const agentId = existing._id.toString();

    // avatar update
    const avatarFile = files?.avatar?.[0];
    if (avatarFile) {
      await deleteS3ObjectIfExists(existing.avatar?.key);

      const up = await uploadBufferToS3Local({
        buffer: avatarFile.buffer,
        originalname: avatarFile.originalname,
        mimetype: avatarFile.mimetype,
        agentId,
        folder: "agents/avatar",
      });

      existing.avatar = { url: up.url, key: up.key };
    }

    // cover update
    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
      await deleteS3ObjectIfExists(existing.coverImage?.key);

      const up = await uploadBufferToS3Local({
        buffer: coverFile.buffer,
        originalname: coverFile.originalname,
        mimetype: coverFile.mimetype,
        agentId,
        folder: "agents/cover",
      });

      existing.coverImage = { url: up.url, key: up.key };
    }

    await existing.save();
    return existing.toObject();
  },

  async getAgentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");

    const agent = await Agent.findById(id).populate("user", "name email");
    if (!agent) throw new Error("Agent not found");
    return agent;
  },

  async listAgents({ page, limit, search }: any) {
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      const q = new RegExp(search, "i");
      filter.$or = [{ name: q }, { agencyName: q }, { bio: q }];
    }

    const [items, total] = await Promise.all([
      Agent.find(filter).populate("user", "name email").skip(skip).limit(limit),
      Agent.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  },

  async deleteAgent(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");

    const existing = await Agent.findById(id).lean();
    if (!existing) throw new Error("Agent not found");

    await deleteS3ObjectIfExists(existing.avatar?.key);
    await deleteS3ObjectIfExists(existing.coverImage?.key);

    await Agent.findByIdAndDelete(id);
    return true;
  },

  async getAgentDashboardAnalytics(
  userId: string,
  range: string
) {
  const agent = await Agent.findOne({ user: userId }).lean();

  if (!agent) {
    return {
      exists: false,
      message: "Agent profile not created",
    };
  }

  const fromDate = getFromDate(range);

  /* ✅ Normalize all models to one type */
  const models: Model<any>[] = [
    Residential as Model<IResidential>,
    Commercial as Model<ICommercial>,
    LandPlot as Model<ILand>,
    Agricultural as Model<IAgricultural>,
  ];

  /* ✅ Fetch all properties */
  const allProperties = (
    await Promise.all(
      models.map((m) =>
        m
          .find(
            { createdBy: userId, createdAt: { $gte: fromDate } },
            { title: 1, city: 1, gallery: 1, meta: 1, status: 1, createdAt: 1 }
          )
          .lean()
      )
    )
  ).flat();

  /* ------------------ KPI totals ------------------ */

  let totalViews = 0;
  let totalClicks = 0;
  let totalInquiries = 0;
  let active = 0;
  let pending = 0;

  for (const p of allProperties) {
    totalViews += p.meta?.views || 0;
    totalClicks += p.meta?.clicks || 0;
    totalInquiries += p.meta?.inquiries || 0;

    if (p.status === "active") active++;
    else pending++;
  }

  /* ------------------ City distribution ------------------ */

  const cityMap: Record<string, number> = {};
  allProperties.forEach((p) => {
    if (!p.city) return;
    cityMap[p.city] = (cityMap[p.city] || 0) + 1;
  });

  /* ------------------ Top properties ------------------ */

  const topProperties = [...allProperties]
    .sort((a, b) => (b.meta?.views || 0) - (a.meta?.views || 0))
    .slice(0, 5);

  /* ------------------ Final payload ------------------ */

  return {
    exists: true,
    agent,
    range,
    kpis: {
      totalProperties: allProperties.length,
      activeListings: active,
      pendingListings: pending,
      totalViews,
      totalClicks,
      totalInquiries,
      conversionRate:
        totalViews > 0
          ? Number(((totalInquiries / totalViews) * 100).toFixed(2))
          : 0,
    },
    charts: {
      byCity: Object.entries(cityMap).map(([city, count]) => ({
        city,
        count,
      })),
    },
    topProperties,
  };
}
};

export default AgentService;
