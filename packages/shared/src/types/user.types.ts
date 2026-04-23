export type UserRole =
  | "guest"
  | "member"
  | "student_author"
  | "researcher"
  | "archivist"
  | "librarian"
  | "admin";

export type AccessTier = "public" | "member" | "staff" | "restricted";

export type MembershipStatus = "active" | "inactive" | "suspended";

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  bio?: string;
  avatar_url?: string;
  membership_status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenPayload {
  user_id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  department?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<User, "password_hash">;
}
