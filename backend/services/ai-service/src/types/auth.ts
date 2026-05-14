import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";

export type UserRole = "admin" | "sales_manager" | "sales_agent" | "user";

export interface JwtUserPayload extends JwtPayload {
    _id: Types.ObjectId;   // 👈 REQUIRED
  sub: string;    
  email: string;
  name: string;
  roleId?: string | undefined; 
  roleName?: string | undefined;
  permissions: string[];
}
