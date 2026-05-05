# Floor Plan + Device Networking System Design

## Overview

The Floor Plan + Device Networking System is a hierarchical building management platform that enables secure device deployment and monitoring through 2D visualization. The system supports two primary user roles: Super Admins who define organizational structures and Organization Admins who manage device deployments. All devices connect through a centralized Ethernet network to Safe Edge controllers, ensuring secure communication to cloud dashboards.

## Architecture

The system follows a layered architecture with clear separation of concerns:

**Presentation Layer:**
- Super Admin Portal (React/Next.js)
- Organization Admin Portal (React/Next.js) 
- 2D Floor Plan Visualization (Canvas/SVG)
- Cloud Dashboard (React/Next.js)

**Business Logic Layer:**
- Organization Management Service
- Floor Plan Management Service
- Device Registration Service
- Network Topology Service
- Validation Service

**Data Layer:**
- Firebase Firestore (primary database)
- Real-time synchronization
- Hierarchical data structure

**Integration Layer:**
- Safe Edge API integration
- Ethernet network monitoring
- Real-time status updates

## Components and Interfaces

### Core Components

**OrganizationService**
```typescript
interface OrganizationService {
  createOrganization(data: OrganizationData): Promise<Organization>
  getOrganization(id: string): Promise<Organization>
  updateOrganization(id: string, data: Partial<OrganizationData>): Promise<Organization>
  deleteOrganization(id: string): Promise<void>
}
```

**FloorPlanService**
```typescript
interface FloorPlanService {
  createFloorPlan(orgId: string, data: FloorPlanData): Promise<FloorPlan>
  updateFloorPlan(planId: string, data: Partial<FloorPlanData>): Promise<FloorPlan>
  generateFloorPlan2D(planId: string): Promise<FloorPlan2D>
  validateFloorPlan(data: FloorPlanData): ValidationResult
}
```

**DeviceService**
```typescript
interface DeviceService {
  registerDevice(data: DeviceRegistrationData): Promise<Device>
  assignDeviceToRoom(deviceId: string, roomId: string): Promise<Device>
  getDevicesByRoom(roomId: string): Promise<Device[]>
  updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<Device>
  removeDevice(deviceId: string): Promise<void>
}
```

**NetworkService**
```typescript
interface NetworkService {
  establishEthernetConnection(deviceId: string): Promise<NetworkConnection>
  validateNetworkTopology(orgId: string): Promise<NetworkValidationResult>
  getSafeEdgeStatus(orgId: string): Promise<SafeEdgeStatus>
  getConnectivityHealth(): Promise<ConnectivityHealth>
}
```

## Data Models

### Organization
```typescript
interface Organization {
  id: string
  name: string
  createdBy: string // Super Admin ID
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'inactive'
  floorPlan?: FloorPlan
}
```

### FloorPlan
```typescript
interface FloorPlan {
  id: string
  organizationId: string
  totalFloors: number
  floors: Floor[]
  approved: boolean
  approvedBy?: string
  approvedAt?: Date
  version: number
}

interface Floor {
  id: string
  floorNumber: number
  totalRooms: number
  rooms: Room[]
}

interface Room {
  id: string
  floorId: string
  name: string
  identifier: string
  size?: RoomSize
  position: Position2D
  devices: Device[]
}

interface RoomSize {
  width?: number
  height?: number
  area?: number
  unit: 'sqft' | 'sqm' | 'custom'
}

interface Position2D {
  x: number
  y: number
  width: number
  height: number
}
```

### Device
```typescript
interface Device {
  id: string
  name: string
  identifier: string
  roomId: string
  organizationId: string
  status: DeviceStatus
  networkConnection: NetworkConnection
  registeredAt: Date
  lastSeen?: Date
  position: Position2D
}

interface DeviceStatus {
  online: boolean
  lastHeartbeat?: Date
  errorCount: number
  warnings: string[]
}

interface NetworkConnection {
  ethernetBoxId: string
  safeEdgeId: string
  ipAddress?: string
  macAddress?: string
  connectionHealth: 'healthy' | 'degraded' | 'failed'
}
```

### Network Infrastructure
```typescript
interface EthernetInternetBox {
  id: string
  organizationId: string
  safeEdgeId: string
  connectedDevices: string[] // Device IDs
  status: 'active' | 'inactive' | 'maintenance'
  maxCapacity: number
}

interface SafeEdge {
  id: string
  organizationId: string
  status: 'online' | 'offline' | 'maintenance'
  connectedBoxes: string[] // EthernetInternetBox IDs
  cloudEndpoint: string
  lastSync?: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">floor-plan-device-networking

**Property Reflection:**

After reviewing all identified properties, several can be consolidated to eliminate redundancy:

- Properties 1.1, 2.1, and 2.2 all relate to uniqueness constraints and can be combined into a comprehensive uniqueness property
- Properties 3.1, 3.2, and 3.3 all relate to 2D model generation and updates, which can be unified
- Properties 4.1, 4.2, and 7.1 all relate to hierarchical structure display and can be consolidated
- Properties 6.1, 6.2, and 9.1 all relate to centralized network topology and can be combined
- Properties 8.1, 8.4, and 8.5 all relate to update consistency and can be unified

**Property 1: Organization and identifier uniqueness**
*For any* organization creation or floor/room identifier assignment, all identifiers should be unique within their respective scopes (organizations globally, floors within organizations, rooms within floors)
**Validates: Requirements 1.1, 2.1, 2.2**

**Property 2: Mandatory field validation**
*For any* structure creation or device registration, all mandatory fields must be provided and non-empty, otherwise the operation should be rejected with validation errors
**Validates: Requirements 1.2, 1.3, 5.1**

**Property 3: Hierarchical structure preservation**
*For any* organization data, the hierarchical relationship Organization → Floor → Room should be maintained with proper parent-child references
**Validates: Requirements 1.5**

**Property 4: Optional data storage consistency**
*For any* room with provided size data, the dimensional information should be stored and retrievable in the same format
**Validates: Requirements 1.4**

**Property 5: 2D model generation and updates**
*For any* approved floor plan data, a 2D model should be generated containing all floors, rooms with labels and identifiers, and should automatically update when structure changes occur
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 6: Access control for approved configurations**
*For any* floor plan access attempt, only approved configurations should be accessible for 2D viewing and organization portal display
**Validates: Requirements 3.4, 4.5**

**Property 7: Device visualization in 2D layouts**
*For any* registered device, it should appear positioned within its assigned room boundaries in the 2D layout
**Validates: Requirements 3.5, 5.4**

**Property 8: Hierarchical structure display completeness**
*For any* organization portal or cloud dashboard access, the complete building hierarchy with floors, rooms, and device distribution should be displayed
**Validates: Requirements 4.1, 4.2, 4.3, 7.1**

**Property 9: Device-room relationship constraints**
*For any* device in the system, it should belong to exactly one room, while rooms can contain multiple devices
**Validates: Requirements 5.2, 5.3**

**Property 10: Centralized network topology**
*For any* organization's network configuration, all devices should connect through a single Ethernet Internet Box to Safe Edge, maintaining centralized architecture
**Validates: Requirements 6.1, 6.2, 6.3, 9.1, 9.2**

**Property 11: Safe Edge communication routing**
*For any* device communication, all data should route through Safe Edge before cloud forwarding, with no bypass paths
**Validates: Requirements 6.4, 9.3, 9.5**

**Property 12: System status and monitoring display**
*For any* dashboard or portal view, current device status, connectivity health, and system alerts should be accurately displayed
**Validates: Requirements 4.4, 7.2, 7.3, 7.4**

**Property 13: Real-time update consistency**
*For any* system update, changes should be reflected consistently across 2D layouts, cloud dashboard, and all relevant interfaces
**Validates: Requirements 7.5, 8.5**

**Property 14: Update preservation and cleanup**
*For any* floor plan modification, existing device mappings should be preserved, while device removal should properly clean up network mappings and visualizations
**Validates: Requirements 8.1, 8.4**

**Property 15: Security and access control**
*For any* unauthorized modification attempt, the system should block the action and log security events
**Validates: Requirements 8.2**

**Property 16: Device reassignment validation**
*For any* device reassignment operation, devices should only be assignable to valid existing rooms
**Validates: Requirements 8.3**

**Property 17: Network topology validation**
*For any* network topology change, the system should validate that centralized architecture is maintained
**Validates: Requirements 9.4**

## Error Handling

The system implements comprehensive error handling across all layers:

**Validation Errors:**
- Input validation failures return structured error responses with field-specific messages
- Business rule violations (e.g., duplicate identifiers) return descriptive error codes
- Edge cases (zero counts, empty names) trigger immediate validation failures

**Network Errors:**
- Safe Edge connectivity issues trigger automatic retry mechanisms
- Device communication failures are logged and displayed in dashboards
- Network topology violations prevent system operation with clear error messages

**Data Consistency Errors:**
- Hierarchical structure violations are prevented through database constraints
- Orphaned device detection triggers system-wide error states
- Real-time synchronization failures are handled with conflict resolution

**Security Errors:**
- Unauthorized access attempts are blocked and logged
- Invalid authentication tokens result in immediate session termination
- Privilege escalation attempts trigger security alerts

## Testing Strategy

The system employs a dual testing approach combining unit tests and property-based tests using **fast-check** for TypeScript property-based testing.

**Unit Testing:**
- Component-level tests for React UI components
- Service-level tests for business logic validation
- Integration tests for Firebase operations
- API endpoint tests for request/response validation

**Property-Based Testing:**
- Each correctness property implemented as a property-based test
- Minimum 100 iterations per property test
- Smart generators for complex data structures (organizations, floor plans, devices)
- Edge case coverage through generator constraints

**Property-Based Test Requirements:**
- Each property test tagged with format: **Feature: floor-plan-device-networking, Property {number}: {property_text}**
- Tests validate universal properties across all valid inputs
- Generators create realistic test data within business constraints
- Property tests complement unit tests by covering broader input spaces

**Testing Framework Configuration:**
- Jest for unit testing
- fast-check for property-based testing
- React Testing Library for component testing
- Firebase emulator for integration testing