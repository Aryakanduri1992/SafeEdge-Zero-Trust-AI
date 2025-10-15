export type UserRole = 'admin' | 'superadmin';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User extends BaseUser {
  password?: string;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
}

export interface SuperAdminUser extends BaseUser {
  role: 'superadmin';
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<LoginCredentials> & { name: string };
