# Floor Plan Management Service

## Overview

The Floor Plan Management Service provides a comprehensive solution for managing building layouts, floor structures, and room configurations within organizations. This service is part of the Floor Plan + Device Networking System.

## Features

### Core Functionality

1. **Floor Plan Creation**
   - Create hierarchical building structures (Organization → Floor → Room)
   - Automatic ID generation for floors and rooms
   - Version control for floor plans
   - Approval workflow support

2. **Floor Plan Updates**
   - Modify existing floor plans
   - Preserve device mappings during updates
   - Automatic version incrementing
   - Reset approval status on modifications

3. **Floor Plan Retrieval**
   - Get floor plan by ID
   - Get current (latest version) floor plan for an organization
   - Support for multiple floor plan versions

4. **Approval Workflow**
   - Super Admin approval system
   - Track approval timestamp and approver
   - Prevent access to unapproved floor plans

5. **Comprehensive Validation**
   - Mandatory field validation
   - Zero floor/room count prevention
   - Empty name validation
   - Floor number uniqueness within organization
   - Room identifier uniqueness within each floor
   - Position coordinate validation

## Data Structure

### FloorPlan
```typescript
interface FloorPlan {
  id: string;
  organizationId: string;
  totalFloors: number;
  floors: Floor[];
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Floor
```typescript
interface Floor {
  id: string;
  floorNumber: number;
  totalRooms: number;
  rooms: Room[];
}
```

### Room
```typescript
interface Room {
  id: string;
  floorId: string;
  name: string;
  identifier: string;
  size?: RoomSize;
  position: Position2D;
  deviceIds: string[]; // Array of device IDs assigned to this room
}
```

## Firestore Structure

Floor plans are stored in a subcollection under organizations:

```
organizations/{organizationId}/floorPlans/{floorPlanId}
```

This structure ensures:
- Proper data isolation per organization
- Efficient querying of floor plans
- Support for multiple floor plan versions
- Easy integration with existing organization data

## Usage Examples

### Creating a Floor Plan

```typescript
import { floorPlanService } from '@/lib/floor-plan-service';

const floorPlanData = {
  organizationId: 'org-123',
  totalFloors: 2,
  floors: [
    {
      floorNumber: 1,
      totalRooms: 2,
      rooms: [
        {
          name: 'Reception',
          identifier: 'R001',
          position: { x: 0, y: 0, width: 100, height: 50 },
          size: { width: 100, height: 50, unit: 'sqft' },
          deviceIds: []
        },
        {
          name: 'Office 1',
          identifier: 'O001',
          position: { x: 100, y: 0, width: 80, height: 60 },
          deviceIds: []
        }
      ]
    },
    {
      floorNumber: 2,
      totalRooms: 1,
      rooms: [
        {
          name: 'Conference Room',
          identifier: 'C001',
          position: { x: 0, y: 0, width: 120, height: 80 },
          deviceIds: []
        }
      ]
    }
  ]
};

const floorPlan = await floorPlanService.createFloorPlan(floorPlanData);
```

### Updating a Floor Plan

```typescript
const updates = {
  totalFloors: 3,
  floors: [
    // ... updated floor data
  ]
};

const updatedFloorPlan = await floorPlanService.updateFloorPlan(
  'floor-plan-id',
  'org-123',
  updates
);
```

### Retrieving a Floor Plan

```typescript
// Get specific floor plan
const floorPlan = await floorPlanService.getFloorPlan('floor-plan-id', 'org-123');

// Get current (latest) floor plan
const currentFloorPlan = await floorPlanService.getCurrentFloorPlan('org-123');
```

### Approving a Floor Plan

```typescript
const approvedFloorPlan = await floorPlanService.approveFloorPlan(
  'floor-plan-id',
  'org-123',
  'super-admin-uid'
);
```

### Validating Floor Plan Data

```typescript
const validation = floorPlanService.validateFloorPlan(floorPlanData);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

## Validation Rules

### Mandatory Fields
- `totalFloors` must be greater than zero
- `floors` array must not be empty
- Each floor must have `floorNumber` and `totalRooms`
- Each room must have `name` and `identifier`

### Uniqueness Constraints
- Floor numbers must be unique within a floor plan
- Room identifiers must be unique within each floor

### Position Validation
- Position coordinates (x, y) must be non-negative
- Position dimensions (width, height) must be positive

### Business Rules
- Number of floors must match `totalFloors` value
- Number of rooms per floor must match `totalRooms` value
- Room names and identifiers cannot be empty strings

## Error Handling

The service throws descriptive errors for:
- Validation failures with specific field information
- Duplicate identifier violations
- Missing floor plans (returns null for get operations)
- Firebase operation failures

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **Requirement 1.2**: Mandatory total number of floors
- **Requirement 1.3**: Mandatory room count, names, and identifiers
- **Requirement 1.5**: Hierarchical structure maintenance
- **Requirement 2.1**: Floor identifier uniqueness
- **Requirement 2.2**: Room identifier uniqueness
- **Requirement 3.1**: 2D model generation support

## Future Enhancements

The following features will be added in subsequent tasks:
- Device assignment to rooms (Task 3)
- 2D visualization generation (Task 5)
- Network topology integration (Task 7)
- Real-time updates and synchronization (Task 8)
- Security and access control (Task 10)

## Testing

Comprehensive testing will be implemented in Task 13 when the testing framework (Jest and fast-check) is configured. The service has been verified to work correctly with:
- Valid floor plan data
- Invalid data rejection (zero floors/rooms)
- Duplicate identifier detection
- Proper method instantiation

## Notes

- The service uses Firebase Firestore for data persistence
- All timestamps use Firebase serverTimestamp() for consistency
- The service is exported as a singleton instance for easy use throughout the application
- Device assignments are preserved during floor plan updates