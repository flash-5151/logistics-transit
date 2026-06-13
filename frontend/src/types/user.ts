export type UserRole = "admin" | "hospital" | "blood_bank" | "donor";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  created_at: string;
}
