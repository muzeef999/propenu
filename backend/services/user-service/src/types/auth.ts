import { JwtPayload } from "jsonwebtoken";

export type UserRole =
  | "admin"
  | "sales_manager"
  | "sales_agent"
  | "accounts"
  | "digital_marketing"
  | "customer_care"
  | "user"
  | "builder"
  | "builder_staff";

export interface JwtUserPayload extends JwtPayload {
  sub: string;    
  email?: string | undefined;
  phone?: number | undefined;
  name: string;
  roleId?: string | undefined; 
  roleName?: string | undefined;
  permissions: string[];
  builderAccess?: unknown;
  accountStatus?: string | undefined;
}
