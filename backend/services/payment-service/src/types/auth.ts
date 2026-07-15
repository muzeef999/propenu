import { JwtPayload } from "jsonwebtoken";

export type UserRole =
  | "admin"
  | "sales_manager"
  | "regional_manager"
  | "sales_agent"
  | "user";

export interface JwtUserPayload extends JwtPayload {
   _id: string;
  sub: string;    
  email: string;
  name: string;
  phone?: string;
  roleId?: string | undefined; 
  roleName:
    | "buyer"
    | "builder"
    | "agent"
    | "user"
    | "admin"
    | "super_admin"
    | "regional_manager";
  permissions: string[];
}
