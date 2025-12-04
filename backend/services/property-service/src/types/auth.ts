import { JwtPayload } from "jsonwebtoken";

export type UserRole = "admin" | "sales_manager" | "sales_agent" | "user";

export interface JwtUserPayload extends JwtPayload {
  sub: string;    
  email: string;
  name: string;
  roleId?: string | undefined; 
  roleName?: string | undefined;
  permissions: string[];
}
