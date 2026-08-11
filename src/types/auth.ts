export type UserRole = "employee" | "manager";

export interface SessionUser {
  name: string;
  role: UserRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Nhân viên",
  manager: "Manager",
};
