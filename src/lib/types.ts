

export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';
export type DeviceStatus = 'online' | 'offline' | 'alerting';
export type DeviceType = 'Sensor' | 'Gateway' | 'Actuator' | 'Camera';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DepartmentStatus = 'active' | 'inactive';

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

export interface Department {
  id: string; // Firestore Document ID
  departmentName: string;
  organizationName: string;
  email: string; // This will be the organization's login email
  building: string;
  floor: string;
  location: string;
  createdAt: string; // ISO String
  devices: number; // quota for this department
  plan: Plan;
  superAdminId: string;
  status: DepartmentStatus;
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
    departmentId: string; // This is the ID of the Department document
    type: DeviceType;
    description?: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  departmentId: string;
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

export type NewOrgData = { 
  organizationName: string;
  email: string;
  password: string;
  departmentName: string;
  location: string;
  building: string;
  floor: string;
  plan: Plan;
  devices: number;
};

export type UpdateDepartmentData = {
  plan: Plan;
  devices: number;
};
