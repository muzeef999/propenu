import {Request, Response} from "express"
import { CreateBuilderDTO, UpdateBuilderDTO } from "../zod/validation"
import { BuilderService } from "../services/builderService";
import { GetBuilderQuery } from "../types";


export const createBuilder = async(req:Request, res:Response) => {
   const payload  = req.body as CreateBuilderDTO;
   const created =  await BuilderService.createBuilder(payload);
   return res.status(201).json({ message: "Builder created", builder:created})
}


export const getInDetailBuilder = async(req:Request, res:Response) => {
  const id = req.params.id;
  if(!id) return  res.status(400).json({message:"Builder id is required"});
  const builder = await BuilderService.getBuilderById(id);
  return res.status(200).json({builder});
}


export const getAllBuilder = async(req:Request<{}, {}, {}, GetBuilderQuery>, res:Response) => {
 const page = req.query.page ? Number(req.query.page) : 1;
 const limit = req.query.limit ? Number(req.query.limit) : 20;
 const search = typeof req.query.search === "string" ? req.query.search : undefined;
 
 const params = {
   page,
   limit,
   ...(search !== undefined ? {search} : {}),
 };

 const result = await BuilderService.listBuilder(params);
 return res.status(200).json(result);
}


export const editBuilder = async(req:Request, res:Response) => {
  const {id} = req.params;
  const payload = req.body as UpdateBuilderDTO;
  if(!id) return res.status(400).json({message:"Builder is is required"})
 const updated = await BuilderService.editBuilder(id, payload);
 return res.status(200).json({message:"Builder updated", builder:updated}) 
}


export const delBuilder = async(req:Request, res:Response) => {
    const { id } = req.params;
    if(!id) return res.status(400).json({message:"Builder id is required"});
    await BuilderService.deleteAgent(id);
    return res.status(200).json({message:"Builder deleted"})
}