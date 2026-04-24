import { JwtPayload } from "jsonwebtoken";

export type UserRole = "admin" | "sales_manager" | "sales_agent" | "user" | "builder";

export interface JwtUserPayload extends JwtPayload {
  sub: string;    
  phone?: number;
  name: string;
  roleId?: string | undefined; 
  roleName?: string | undefined;
  permissions: string[];
}
