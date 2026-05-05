# Floor Plan + Device Networking API Documentation

This document describes the API routes for the Floor Plan + Device Networking System.

## Authentication

All API routes require authentication via Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message or array of error messages"
}
```

## Floor Plan Management

### Create Floor Plan
**POST** `/api/floor-plans`

Creates a new floor plan (Super Admin only).

**Request Body:**
```json
{
  "organizationId": "string",
  "totalFloors": "number",
  "floors": [
    {
      "floorNumber": "number",
      "totalRooms": "number",
      "rooms": [
        {
          "name": "string",
          "identifier": "string",
          "size": {
            "width": "number (optional)",
            "height": "number (optional)",
            "area": "number (optional)",
            "unit": "sqft | sqm | custom"
          },
          "position": {
            "x": "number",
            "y": "number",
            "width": "number",
            "height": "number"
          }
        }
      ]
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "string",
    "organizationId": "string",
    "totalFloors": "number",
    "floors": [...],
    "approved": false,
    "version": 1,
    "createdAt": "Date",
    "updatedAt": "Date"
  },
  "message": "Floor plan created successfully"
}
```

### Get Floor Plan
**GET** `/api/floor-plans?organizationId=xxx&planId=xxx`

Gets floor plans for an organization. If `planId` is provided, returns specific floor plan; otherwise returns current floor plan.

**Query Parameters:**
- `organizationId` (required): Organization ID
- `planId` (optional): Specific floor plan ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "string",
    "organizationId": "string",
    "totalFloors": "number",
    "floors": [...],
    "approved": "boolean",
    "version": "number",
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

### Update Floor Plan
**PUT** `/api/floor-plans?planId=xxx&organizationId=xxx`

Updates an existing floor plan with device preservation (Super Admin only).

**Query Parameters:**
- `planId` (required): Floor plan ID
- `organizationId` (required): Organization ID

**Request Body:**
```json
{
  "updates": {
    "totalFloors": "number (optional)",
    "floors": "array (optional)"
  },
  "options": {
    "handleOrphanedDevices": "remove | reassign | preserve",
    "autoReassignDevices": "boolean"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "floorPlan": {...},
    "deviceMappingChanges": [...],
    "orphanedDevices": [...],
    "networkCleanupResults": [...],
    "reassignmentResults": [...]
  },
  "message": "Floor plan updated successfully"
}
```

### Approve Floor Plan
**POST** `/api/floor-plans/[id]/approve?organizationId=xxx`

Approves a floor plan (Super Admin only).

**Path Parameters:**
- `id`: Floor plan ID

**Query Parameters:**
- `organizationId` (required): Organization ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "string",
    "approved": true,
    "approvedBy": "string",
    "approvedAt": "Date",
    ...
  },
  "message": "Floor plan approved successfully"
}
```

## Room Management

### Get Rooms
**GET** `/api/floor-plans/[id]/rooms?organizationId=xxx&floorId=xxx`

Gets rooms for a specific floor plan and optionally a specific floor.

**Path Parameters:**
- `id`: Floor plan ID

**Query Parameters:**
- `organizationId` (required): Organization ID
- `floorId` (optional): Specific floor ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "rooms": [...],
    "floorPlanId": "string",
    "organizationId": "string",
    "floorId": "string | null",
    "totalRooms": "number"
  }
}
```

### Reassign Device to Room
**POST** `/api/floor-plans/[id]/rooms/reassign?organizationId=xxx`

Reassigns a device to a different room.

**Path Parameters:**
- `id`: Floor plan ID

**Query Parameters:**
- `organizationId` (required): Organization ID

**Request Body:**
```json
{
  "deviceId": "string",
  "newRoomId": "string"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "deviceId": "string",
    "newRoomId": "string",
    "floorPlan": {...}
  },
  "message": "Device reassigned successfully"
}
```

### Clean Up Orphaned Devices
**DELETE** `/api/floor-plans/[id]/rooms/cleanup?organizationId=xxx`

Removes orphaned devices and cleans up network mappings (Super Admin only).

**Path Parameters:**
- `id`: Floor plan ID

**Query Parameters:**
- `organizationId` (required): Organization ID

**Request Body:**
```json
{
  "deviceIds": ["string", "string", ...]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "removedDevices": [...],
    "networkCleanupResults": [...],
    "totalRemoved": "number",
    "totalFailed": "number"
  },
  "message": "Successfully removed X orphaned devices"
}
```

## Network Topology Management

### Validate Network Topology
**GET** `/api/network/topology?organizationId=xxx`

Validates network topology for an organization.

**Query Parameters:**
- `organizationId` (required): Organization ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "validation": {
      "isValid": "boolean",
      "errors": ["string", ...],
      "warnings": ["string", ...]
    },
    "health": {
      "overallStatus": "healthy | degraded | failed",
      "safeEdgeStatus": "online | offline | maintenance",
      "ethernetBoxStatus": "active | inactive | maintenance",
      "connectedDevices": "number",
      "totalDevices": "number",
      "lastHealthCheck": "Date",
      "issues": ["string", ...]
    },
    "organizationId": "string"
  }
}
```

### Establish Device Connection
**POST** `/api/network/topology/establish`

Establishes network connection for a device.

**Request Body:**
```json
{
  "deviceId": "string",
  "organizationId": "string"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "deviceId": "string",
    "networkConnection": {
      "ethernetBoxId": "string",
      "safeEdgeId": "string",
      "connectionHealth": "healthy | degraded | failed"
    },
    "organizationId": "string"
  },
  "message": "Network connection established successfully"
}
```

### Disconnect Device
**DELETE** `/api/network/topology/disconnect`

Disconnects a device from the network.

**Request Body:**
```json
{
  "deviceId": "string",
  "organizationId": "string"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "deviceId": "string",
    "organizationId": "string"
  },
  "message": "Device disconnected successfully"
}
```

## Safe Edge Management

### Get Safe Edge Status
**GET** `/api/network/safe-edge?organizationId=xxx`

Gets Safe Edge status for an organization.

**Query Parameters:**
- `organizationId` (required): Organization ID

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "safeEdge": {
      "id": "string",
      "organizationId": "string",
      "status": "online | offline | maintenance",
      "connectedBoxes": ["string", ...],
      "cloudEndpoint": "string",
      "lastSync": "Date"
    },
    "ethernetBox": {
      "id": "string",
      "organizationId": "string",
      "safeEdgeId": "string",
      "connectedDevices": ["string", ...],
      "status": "active | inactive | maintenance",
      "maxCapacity": "number"
    },
    "organizationId": "string"
  }
}
```

### Create Safe Edge
**POST** `/api/network/safe-edge/create`

Creates Safe Edge and Ethernet Internet Box for an organization (Super Admin only).

**Request Body:**
```json
{
  "organizationId": "string",
  "cloudEndpoint": "string (optional)",
  "maxCapacity": "number (optional, default: 50)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "safeEdge": {...},
    "ethernetBox": {...},
    "organizationId": "string"
  },
  "message": "Safe Edge controller and Ethernet Internet Box created successfully"
}
```

### Update Safe Edge Status
**PUT** `/api/network/safe-edge/status`

Updates Safe Edge status (Super Admin only).

**Request Body:**
```json
{
  "organizationId": "string",
  "status": "online | offline | maintenance"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "safeEdge": {...},
    "organizationId": "string"
  },
  "message": "Safe Edge status updated successfully"
}
```

## Error Codes

- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions for the requested operation
- `404 Not Found`: Requested resource not found
- `409 Conflict`: Resource already exists or conflict with current state
- `500 Internal Server Error`: Server-side error

## Authorization Levels

- **Super Admin**: Can create, modify, and approve floor plans; manage Safe Edge controllers
- **Organization Admin**: Can view approved floor plans, reassign devices within their organization
- **Public**: No access to these APIs (authentication required)

## Rate Limiting

API endpoints may be subject to rate limiting. Check response headers for rate limit information:
- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Validation

All request data is validated according to the business rules defined in the requirements. Common validation errors include:

- Missing required fields
- Invalid data types
- Empty or whitespace-only strings for required text fields
- Negative numbers for counts or dimensions
- Duplicate identifiers within the same scope
- Invalid enum values for status fields

## Security

- All endpoints require valid Firebase authentication
- Role-based access control enforced at the API level
- Security events logged for unauthorized access attempts
- Audit trail maintained for all floor plan and device modifications