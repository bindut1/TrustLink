export type UserRole = "candidate" | "recruiter" | "issuer" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  role: Exclude<UserRole, "admin">;
  phone?: string;
  // Issuer
  institutionName?: string;
  institutionType?: string;
  taxCode?: string;
  website?: string;
  // Recruiter
  companyName?: string;
  industry?: string;
  companySize?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};
