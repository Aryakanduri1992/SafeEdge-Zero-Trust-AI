export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';
export type DeviceStatus = 'online' | 'offline' | 'alerting';
export type DeviceType = 'Sensor' | 'Gateway' | 'Actuator' | 'Camera';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AdminStatus = 'active' | 'inactive';

export interface BaseUser {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
}

export interface AdminUser extends BaseUser {
  role: 'admin';
  building: string;
  floor: string;
  createdAt: string; // ISO String
  devices: number;
  plan: Plan;
  superAdminId: string; // UID of the superadmin who created this admin
  status: AdminStatus;
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
    type: DeviceType;
    description?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  adminId: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string; // ISO String
  details?: string;
}


export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = Required<Pick<LoginCredentials, 'email' | 'password'>> & { name: string, building: string, floor: string };

export type UpdateAdminData = {
  plan: Plan;
  devices: number;
};
