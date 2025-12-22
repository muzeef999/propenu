import { Types } from 'mongoose';

export type LeadPropertyType =
  | 'residential'
  | 'commercial'
  | 'agricultural'
  | 'land';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'approved'
  | 'rejected'
  | 'closed';

export interface ICreateLead {
  name: string;
  phone: string;
  email?: string;
  projectId: string; 
  propertyType: LeadPropertyType;
  remarks?: string;
}

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  projectId: Types.ObjectId;
  propertyType: LeadPropertyType;
  status: LeadStatus;
  assignedTo?: Types.ObjectId;
  approvedByManager: boolean;
  remarks?: string;

  createdAt: Date;
  updatedAt: Date;
}
