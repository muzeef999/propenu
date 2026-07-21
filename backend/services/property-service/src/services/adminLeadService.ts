import { Types } from "mongoose";
import Lead from "../models/LeadModel";
import PublicLead from "../models/PublicLead";
import FeaturedProject from "../models/featurePropertiesModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";

const categoryModels = { featured: FeaturedProject, residential: Residential, commercial: Commercial, agricultural: Agricultural, land: LandPlot } as const;
type Category = keyof typeof categoryModels;
const leadCategory = (lead: any): Category => {
  if (lead.source === "site" || lead.source === "imported") return "featured";
  const value = String(lead.propertyType || lead.propertyModel || "").toLowerCase();
  if (value.includes("residential")) return "residential";
  if (value.includes("commercial")) return "commercial";
  if (value.includes("agricultural")) return "agricultural";
  if (value.includes("land")) return "land";
  return "featured";
};
const safeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export interface AdminLeadQuery { page?: string; limit?: string; search?: string; category?: string; projectId?: string; status?: string; source?: string; state?: string; city?: string; locality?: string; from?: string; to?: string; creatorIds?: string; }

export const getAdminLeadDashboard = async (query: AdminLeadQuery, exportAll = false) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const creatorIds = String(query.creatorIds || "").split(",").map((id) => id.trim()).filter((id) => Types.ObjectId.isValid(id));
  const creatorSet = new Set(creatorIds);
  const dateFilter: Record<string, Date> = {};
  if (query.from) dateFilter.$gte = new Date(query.from);
  if (query.to) { const end = new Date(query.to); end.setHours(23, 59, 59, 999); dateFilter.$lte = end; }
  const base: any = {};
  if (query.projectId) {
    const projectIds = query.projectId.split(",").map((id) => id.trim()).filter(Boolean);
    if (!projectIds.length || projectIds.some((id) => !Types.ObjectId.isValid(id))) throw new Error("Invalid projectId");
    base.projectId = projectIds.length === 1 ? projectIds[0] : { $in: projectIds };
  }
  if (query.status) base.status = query.status;
  if (Object.keys(dateFilter).length) base.createdAt = dateFilter;
  const includePublic = (!query.category || query.category === "all" || query.category === "featured") && (!query.source || ["all", "site", "imported"].includes(query.source));
  const includeDirect = (!query.source || ["all", "direct"].includes(query.source));
  const [publicRows, directRows] = await Promise.all([
    includePublic ? PublicLead.find({ ...base, ...(query.source && query.source !== "all" ? { source: query.source } : {}) }).lean() : [],
    includeDirect ? Lead.find(base).populate("createdBy", "name email phone").lean() : [],
  ]);
  const raw = [...publicRows.map((row: any) => ({ ...row, source: row.source || "site" })), ...directRows.map((row: any) => ({ ...row, source: "direct" }))];
  const idsByCategory = raw.reduce<Record<Category, Set<string>>>((map, row) => { map[leadCategory(row)].add(String(row.projectId)); return map; }, { featured: new Set(), residential: new Set(), commercial: new Set(), agricultural: new Set(), land: new Set() });
  const propertyEntries = await Promise.all((Object.keys(categoryModels) as Category[]).map(async (category) => {
    const ids = [...idsByCategory[category]];
    if (!ids.length) return [];
    const model: any = categoryModels[category];
    const docs = await model.find({ _id: { $in: ids } }).select("title projectName buildingName propertyCode state city locality createdBy").lean();
    return docs.map((doc: any) => [String(doc._id), { ...doc, category }] as const);
  }));
  const properties = new Map(propertyEntries.flat());
  const normalized = raw.map((row: any) => {
    const property: any = properties.get(String(row.projectId)) || {};
    return { _id: row._id, name: row.name, phone: row.phone, email: row.email || "", status: row.status || "new_lead", source: row.source, message: row.message || row.remarks || "", purchaseTimeline: row.purchaseTimeline || "", budgetRange: row.budgetRange || "", createdAt: row.createdAt, project: { _id: row.projectId, title: property.title || property.projectName || property.buildingName || "Untitled property", code: property.propertyCode || "", category: leadCategory(row), state: property.state || "", city: property.city || "", locality: property.locality || "", createdBy: property.createdBy ? String(property.createdBy) : "" }, customer: row.createdBy && typeof row.createdBy === "object" ? row.createdBy : null };
  });
  const search = query.search ? new RegExp(safeRegex(query.search), "i") : null;
  const matchText = (actual: unknown, expected?: string) => !expected || expected === "all" || String(actual || "").toLowerCase() === expected.toLowerCase();
  const filtered = normalized.filter((row) => {
    if (creatorSet.size && !creatorSet.has(row.project.createdBy)) return false;
    if (!matchText(row.project.category, query.category) || !matchText(row.project.state, query.state) || !matchText(row.project.city, query.city) || !matchText(row.project.locality, query.locality)) return false;
    return !search || [row.name, row.phone, row.email, row.project.title, row.project.code, row.project.state, row.project.city, row.project.locality].some((value) => search.test(String(value || "")));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const counts = filtered.reduce((acc: any, row) => {
    acc.byCategory[row.project.category] = (acc.byCategory[row.project.category] || 0) + 1;
    acc.byStatus[row.status] = (acc.byStatus[row.status] || 0) + 1;
    acc.bySource[row.source] = (acc.bySource[row.source] || 0) + 1;
    const createdAt = new Date(row.createdAt);
    if (!Number.isNaN(createdAt.getTime())) {
      const date = createdAt.toISOString().slice(0, 10);
      const daily = acc.dailyTrend[date] || { date, leads: 0, converted: 0 };
      daily.leads += 1;
      if (row.status === "sale") daily.converted += 1;
      acc.dailyTrend[date] = daily;
    }
    return acc;
  }, { byCategory: {}, byStatus: {}, bySource: {}, dailyTrend: {} });
  const dailyTrend = Object.values(counts.dailyTrend).sort((first: any, second: any) => first.date.localeCompare(second.date));
  delete counts.dailyTrend;
  const projects = [...new Map(normalized.map((row) => [String(row.project._id), row.project])).values()].sort((a, b) => a.title.localeCompare(b.title));
  const facets = { states: [...new Set(normalized.map((row) => row.project.state).filter(Boolean))].sort(), cities: [...new Set(normalized.filter((row) => !query.state || row.project.state === query.state).map((row) => row.project.city).filter(Boolean))].sort(), localities: [...new Set(normalized.filter((row) => (!query.state || row.project.state === query.state) && (!query.city || row.project.city === query.city)).map((row) => row.project.locality).filter(Boolean))].sort() };
  return { leads: exportAll ? filtered : filtered.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) }, summary: { total: filtered.length, ...counts, dailyTrend }, projects, facets };
};
