export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';

export interface BaseUser {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
}

// This is not stored directly, but represents the data shape in Firestore `admins` collection
export interface AdminUser extends BaseUser {
  role: 'admin';
  createdAt: string; // ISO String
  devices: number;
  plan: Plan;
  superAdminId: string; // UID of the superadmin who created this admin
}

// This is not stored directly, but represents the data shape in memory
export interface SuperAdminUser extends BaseUser {
  role: 'superadmin';
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<Pick<LoginCredentials, 'email' | 'password'>> & { name: string };

export type UpdateAdminData = {
  plan: Plan;
  devices: number;
};
