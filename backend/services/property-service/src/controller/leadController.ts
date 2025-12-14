// import { Request, Response } from 'express';
// import { assignLead, createLead, getLeadById, getLeads, updateLeadStatus } from '../services/leadService';

// /**
//  * CREATE LEAD
//  */
// export const createLeadController = async (req: Request, res: Response) => {
//   try {
//     const lead = await createLead(req.body, req.user?.id);
//     res.status(201).json({ success: true, data: lead });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * ASSIGN LEAD
//  */
// export const assignLeadController = async (req: Request, res: Response) => {
//   try {
//     const lead = await assignLead(req.params.id, req.body.assignedTo);
//     res.json({ success: true, data: lead });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * UPDATE LEAD STATUS
//  */
// export const updateLeadStatusController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const lead = await updateLeadStatus(
//       req.params.id,
//       req.body.status,
//       req.user
//     );
//     res.json({ success: true, data: lead });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * GET ALL LEADS
//  */
// export const getLeadsController = async (req: Request, res: Response) => {
//   try {
//     const leads = await getLeads(req.query, req.user);
//     res.json({ success: true, data: leads });
//   } catch (error: any) {
//     res.status(400).json({ success: false, message: error.message });
//   }
// };

// /**
//  * GET SINGLE LEAD
//  */
// export const getLeadByIdController = async (req: Request, res: Response) => {
//   try {
//     const lead = await getLeadById(req.params.id);
//     res.json({ success: true, data: lead });
//   } catch (error: any) {
//     res.status(404).json({ success: false, message: error.message });
//   }
// };
