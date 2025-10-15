export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';
export type DeviceStatus = 'online' | 'offline' | 'alerting';

export interface BaseUser {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  organization: string;
  createdAt: string; // ISO String
  devices: number;
  plan: Plan;
  superAdminId: string; // UID of the superadmin who created this admin
}

export interface SuperAdminUser extends BaseUser {
  role: 'superadmin';
}

export interface Device {
    id: string;
    name: string;
    location: string;
    status: DeviceStatus;
    lastSeen: string; // ISO String
    adminId: string;
    sensorData: {
        temperature: number;
        humidity: number;
        motion: boolean;
        gas: number;
    }
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<Pick<LoginCredentials, 'email' | 'password'>> & { name: string, organization: string };

export type UpdateAdminData = {
  plan: Plan;
  devices: number;
};
