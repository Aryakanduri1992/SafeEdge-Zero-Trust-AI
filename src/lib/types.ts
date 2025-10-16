
export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';
export type DeviceStatus = 'online' | 'offline' | 'alerting';
export type DeviceType = 'Sensor' | 'Gateway' | 'Actuator' | 'Camera';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AdminStatus = 'active' | 'inactive';

export interface BaseUser {
  id: string; // Firebase Auth UID
  email: string;
  role: UserRole;
}

export interface Organization extends BaseUser {
    role: 'admin';
    organizationName: string;
    createdAt: string; // ISO String
    superAdminId: string;
}

export interface AdminUser {
  id: string; // Firestore Document ID
  departmentName: string;
  organizationName: string;
  email: string; // This will be the organization's email
  building: string;
  floor: string;
  location: string;
  role: 'admin';
  createdAt: string; // ISO String
  devices: number; // quota for this department
  plan: Plan;
  superAdminId: string;
  status: AdminStatus;
  organizationId: string; // Firebase Auth UID of the organization
}

export interface SuperAdminUser extends BaseUser {
  departmentName: string;
  role: 'superadmin';
}

export interface Device {
    id: string;
    name: string;
    location: string;
    status: DeviceStatus;
    lastSeen: string; // ISO String
    adminId: string; // This is the ID of the AdminUser (department) document
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
  createdAt: string; // ISO String;
  details?: string;
}


export interface LoginCredentials {
  email: string;
  password?: string;
}

export type NewAdminData = { 
  departmentName: string, 
  organizationName: string,
  email: string,
  password: string,
  building: string, 
  floor: string,
  location: string,
  organizationId?: string, // UID of parent organization, if adding a department
};

export type UpdateAdminData = {
  plan: Plan;
  devices: number;
};

    