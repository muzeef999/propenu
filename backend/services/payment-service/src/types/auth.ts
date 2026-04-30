import { JwtPayload } from "jsonwebtoken";

export type UserRole = "admin" | "sales_manager" | "sales_agent" | "user";

export interface JwtUserPayload extends JwtPayload {
   _id: string;
  sub: string;    
  email: string;
  name: string;
  phone?: string;
  roleId?: string | undefined; 
  roleName: "buyer" | "builder" | "agent" | "user" | "admin" | "super_admin";
  permissions: string[];
}
