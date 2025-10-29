
export type UserRole = 'admin' | 'superadmin';
export type Plan = 'Free' | 'Pro' | 'Enterprise';
export type DepartmentStatus = 'active' | 'inactive';
export type DeviceType = "Sensor" | "Gateway" | "Actuator" | "Camera" | "PIR" | "LDR" | "DHT22_Temp" | "DHT22_Humidity";
export type DeviceStatus = "online" | "offline" | "alerting";
export type MetricType = "temperature" | "humidity" | "pressure" | "vibration";


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
    imageUrl?: string;
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

export type NewDepartmentData = {
  departmentName: string;
  organizationName: string;
  email: string;
  building: string;
  floor: string;
  location: string;
  devices: number;
  plan: Plan;
  organizationId: string;
};

export type UpdateDepartmentData = {
  plan: Plan;
  devices: number;
};

export interface Device {
  id: string;
  name: string;
  location: string;
  type: DeviceType;
  status: DeviceStatus;
  lastSeen: string; // ISO date string
  departmentId: string; // The ID of the department it belongs to
  organizationId: string;
  description?: string;
  dbPath: string; // Path to Realtime DB
  value?: number;
  timestamp?: string; // ISO date string
}

export type NewDeviceData = Omit<Device, 'id' | 'lastSeen' | 'status' | 'value' | 'timestamp'>;
export type UpdateDeviceData = Partial<Omit<Device, 'id' | 'organizationId'>>;

export type UpdateDeviceStatusData = {
  value?: number;
  timestamp?: string; // ISO date string
  status: 'online' | 'offline';
  lastSeen?: string;
};

export interface SensorReading {
  id: string;
  deviceId: string;
  organizationId: string;
  timestamp: string; // ISO date string
  value: number;
  metricType: MetricType;
}
