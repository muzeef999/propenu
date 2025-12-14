import { Types } from 'mongoose';
import { Lead } from '../models/LeadModel';

/**
 * CREATE LEAD
 */
export const createLead = async (data: any, userId?: string) => {
  if (!data.propertyId || !data.propertyModel) {
    throw new Error('Property reference is required');
  }

  return Lead.create({
    ...data,
    createdBy: userId,
  });
};

/**
 * ASSIGN LEAD TO SALES
 */
export const assignLead = async (leadId: string, assignedTo: string) => {
  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error('Invalid lead ID');
  }

  if (!Types.ObjectId.isValid(assignedTo)) {
    throw new Error('Invalid user ID');
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    { assignedTo },
    { new: true }
  );

  if (!lead) throw new Error('Lead not found');

  return lead;
};

/**
 * UPDATE LEAD STATUS
 */
export const updateLeadStatus = async (
  leadId: string,
  status: string,
  user?: any
) => {
  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error('Invalid lead ID');
  }

  // Manager-only approval
  if (status === 'approved' && user?.role !== 'manager') {
    throw new Error('Only manager can approve leads');
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      status,
      approvedByManager: status === 'approved',
    },
    { new: true }
  );

  if (!lead) throw new Error('Lead not found');

  return lead;
};

/**
 * GET LEADS (ROLE BASED)
 */
export const getLeads = async (query: any, user?: any) => {
  const filter: any = {};

  if (query.status) filter.status = query.status;
  if (query.propertyType) filter.propertyType = query.propertyType;

  // SALES → only assigned leads
  if (user?.role === 'sales') {
    filter.assignedTo = user.id;
  }

  // OWNER → leads for own properties
  if (user?.role === 'owner') {
    filter.propertyOwner = user.id;
  }

  // ADMIN / MANAGER → see all

  return Lead.find(filter)
    .populate('assignedTo', 'name email')
    .populate('propertyId')
    .sort({ createdAt: -1 });
};

/**
 * GET SINGLE LEAD
 */
export const getLeadById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error('Invalid lead ID');
  }

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email')
    .populate('propertyId');

  if (!lead) throw new Error('Lead not found');

  return lead;
};
