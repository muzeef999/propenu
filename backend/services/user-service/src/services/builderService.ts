import mongoose from "mongoose";
import Builder from "../models/builderModel";
import { CreateBuilderDTO, UpdateBuilderDTO } from "../zod/validation";


class NotFoundError extends Error { status = 404; }
class ConflictError extends Error { status = 409; }


export const BuilderService = {
     async createBuilder(payload: CreateBuilderDTO) {
      
        
        const exists = await Builder.findOne({user: payload.user});
        if(exists) throw new ConflictError("Builder alraed exists for this user");

        if(!payload.slug) {
            const base = payload.name.toLowerCase().replace(/\s+/g, "-").slice(0, 50);
            payload = { ...payload, slug:`${base}-${Date.now()}`} as CreateBuilderDTO
        }
        const  builder = await Builder.create(payload);
        return builder;
        
     },

     async listBuilder({ page = 1, limit = 20, search}: {page?:number; limit?:number; search?:string}){
        const skip = (page -1) * limit;
        const filter:any = {};
        if(search) {
            const q = new RegExp(search,"i");
            filter.$or = [{name:q}, {agencyName:q},{bio:q}]
        }
        
        const [items, total] = await Promise.all([
            Builder.find(filter).populate("user", "name email").skip(skip).limit(limit),
            Builder.countDocuments(filter),
        ])
          return {items, meta:{page, limit, total}};
     },
     
     async getBuilderById(id: string){
        if(!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError("Invalid id");
        const builder = await Builder.findById(id).populate("user", "name email");
        if(!builder) throw new NotFoundError("Builder not fund");
        return builder 
    },

     async editBuilder(id: string, payload: UpdateBuilderDTO){
        if(payload.user) {
             const conflict = await Builder.findOne({user: payload.user, _id:{$ne:id}});
             if(conflict) throw new  ConflictError("Another Builder exists for this user");
        }
        const updated = await Builder.findByIdAndUpdate(id, payload as any, { new: true }).populate("user", "name email");
           if (!updated) throw new NotFoundError("Agent not found");
            return updated;
     },
     
     async deleteAgent(id: string) {
    const deleted = await Builder.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError("Agent not found");
    return;
  },
}