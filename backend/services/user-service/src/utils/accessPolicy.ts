const ADMIN_DASHBOARD_ROLES = new Set([
  "admin",
  "super_admin",
  "sales_manager",
  "sales_agent",
  "accounts",
  "customer_care",
]);
const PHONE_OTP_ONLY_LOGIN_ROLES = new Set(["agent", "builder", "user"]);
const EMAIL_OTP_ONLY_LOGIN_ROLES = new Set([
  "admin",
  "sales_manager",
  "sales_agent",
  "super_admin",
  "accounts",
  "customer_care",
]);

export function canAccessAdminDashboard(roleName?: string) {
  return !!roleName && ADMIN_DASHBOARD_ROLES.has(roleName);
}

export function requiresPhoneOtpOnlyLogin(roleName?: string) {
  return !!roleName && PHONE_OTP_ONLY_LOGIN_ROLES.has(roleName);
}

export function requiresKycForLogin(roleName?: string) {
  return !!roleName && PHONE_OTP_ONLY_LOGIN_ROLES.has(roleName);
}

export function requiresEmailOtpOnlyLogin(roleName?: string) {
  return !!roleName && EMAIL_OTP_ONLY_LOGIN_ROLES.has(roleName);
}

export function getOtpLoginRestrictionMessage(params: {
  roleName: string | undefined;
  email: string | undefined;
  phone: string | undefined;
}) {
  const { roleName, email, phone } = params;

  if (email && requiresPhoneOtpOnlyLogin(roleName)) {
    return "You don't have access to the Dashboard.";
  }

  if (phone && requiresEmailOtpOnlyLogin(roleName)) {
    return "Email + OTP login only is allowed for this account.";
  }

  return null;
}
