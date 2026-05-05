# Organization Creation Wizard - Complete Requirements

## 🔍 Current Status

### ❌ What's Currently Missing
The current SuperAdmin organization creation form is **very basic** and only includes:
- Organization Name
- Email
- Password
- Plan (Basic/Pro/Enterprise)
- Max Devices

### ✅ What SHOULD Be Included (According to README)
The README mentions an "Advanced Organization Wizard" with:
- Floor plan structure
- Department management
- Room configuration with 15+ templates
- Advanced room management
- Space utilization analysis
- Real-time capacity calculations

## 📋 Complete Organization Wizard Requirements

### Step 1: Basic Organization Information
```typescript
{
  // Basic Info
  organizationName: string;
  email: string;
  password: string;
  
  // Plan Details
  plan: 'basic' | 'pro' | 'enterprise';
  maxDevices: number;
  
  // Contact Information
  contactPerson: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
```

### Step 2: Department Structure
```typescript
{
  departments: [
    {
      id: string;
      name: string;
      description: string;
      headOfDepartment: string;
      email: string;
      phoneNumber: string;
      budget: number;
      maxDevices: number;
    }
  ]
}
```

### Step 3: Floor Plan Configuration
```typescript
{
  floors: [
    {
      floorNumber: number;
      floorName: string; // e.g., "Ground Floor", "First Floor"
      totalArea: number; // in square feet
      description: string;
      
      rooms: [
        {
          roomId: string; // e.g., "R101", "R102"
          roomName: string;
          roomType: RoomType;
          area: number; // in square feet
          capacity: number; // max occupancy
          departmentId: string; // link to department
          
          // Room Features
          hasCamera: boolean;
          hasSensors: boolean;
          hasAccessControl: boolean;
          
          // Position for 3D visualization
          position: {
            x: number;
            y: number;
            z: number;
          };
          
          // Dimensions for 3D rendering
          dimensions: {
            width: number;
            height: number;
            depth: number;
          };
        }
      ]
    }
  ]
}
```

### Step 4: Room Types & Templates

#### Available Room Types
```typescript
enum RoomType {
  OFFICE = 'Office',
  CONFERENCE_ROOM = 'Conference Room',
  LOBBY = 'Lobby',
  STORAGE = 'Storage',
  SERVER_ROOM = 'Server Room',
  KITCHEN = 'Kitchen',
  RESTROOM = 'Restroom',
  LABORATORY = 'Laboratory',
  MEDICAL_ROOM = 'Medical Room',
  OPERATING_ROOM = 'Operating Room',
  PATIENT_ROOM = 'Patient Room',
  EMERGENCY_ROOM = 'Emergency Room',
  WAREHOUSE = 'Warehouse',
  MANUFACTURING = 'Manufacturing',
  RETAIL_SPACE = 'Retail Space',
  OTHER = 'Other'
}
```

#### Room Templates (15+ Professional Templates)
```typescript
const roomTemplates = {
  // Office Templates
  smallOffice: {
    name: 'Small Office',
    type: 'Office',
    area: 150, // sq ft
    capacity: 2,
    recommendedDevices: ['Camera', 'Motion Sensor', 'Temperature Sensor']
  },
  
  mediumOffice: {
    name: 'Medium Office',
    type: 'Office',
    area: 300,
    capacity: 4,
    recommendedDevices: ['Camera', 'Motion Sensor', 'Temperature Sensor', 'Access Control']
  },
  
  largeOffice: {
    name: 'Large Office',
    type: 'Office',
    area: 600,
    capacity: 10,
    recommendedDevices: ['Multiple Cameras', 'Motion Sensors', 'Temperature Sensors', 'Access Control']
  },
  
  // Conference Room Templates
  smallConferenceRoom: {
    name: 'Small Conference Room',
    type: 'Conference Room',
    area: 250,
    capacity: 6,
    recommendedDevices: ['Camera', 'Microphone', 'Temperature Sensor', 'Occupancy Sensor']
  },
  
  largeConferenceRoom: {
    name: 'Large Conference Room',
    type: 'Conference Room',
    area: 500,
    capacity: 20,
    recommendedDevices: ['Multiple Cameras', 'Microphones', 'Temperature Sensors', 'Occupancy Sensors']
  },
  
  // Medical Templates
  patientRoom: {
    name: 'Patient Room',
    type: 'Patient Room',
    area: 200,
    capacity: 2,
    recommendedDevices: ['Camera', 'Vital Signs Monitor', 'Temperature Sensor', 'Emergency Button']
  },
  
  operatingRoom: {
    name: 'Operating Room',
    type: 'Operating Room',
    area: 400,
    capacity: 8,
    recommendedDevices: ['Multiple Cameras', 'Environmental Sensors', 'Access Control', 'Emergency Systems']
  },
  
  emergencyRoom: {
    name: 'Emergency Room',
    type: 'Emergency Room',
    area: 600,
    capacity: 15,
    recommendedDevices: ['Multiple Cameras', 'Vital Signs Monitors', 'Environmental Sensors', 'Emergency Systems']
  },
  
  // Common Area Templates
  lobby: {
    name: 'Lobby',
    type: 'Lobby',
    area: 800,
    capacity: 50,
    recommendedDevices: ['Multiple Cameras', 'Motion Sensors', 'Access Control', 'Environmental Sensors']
  },
  
  serverRoom: {
    name: 'Server Room',
    type: 'Server Room',
    area: 300,
    capacity: 5,
    recommendedDevices: ['Multiple Cameras', 'Temperature Sensors', 'Humidity Sensors', 'Access Control', 'Fire Detection']
  },
  
  storage: {
    name: 'Storage Room',
    type: 'Storage',
    area: 200,
    capacity: 3,
    recommendedDevices: ['Camera', 'Motion Sensor', 'Access Control']
  },
  
  kitchen: {
    name: 'Kitchen/Break Room',
    type: 'Kitchen',
    area: 250,
    capacity: 10,
    recommendedDevices: ['Camera', 'Temperature Sensor', 'Smoke Detector']
  },
  
  // Industrial Templates
  warehouse: {
    name: 'Warehouse',
    type: 'Warehouse',
    area: 2000,
    capacity: 20,
    recommendedDevices: ['Multiple Cameras', 'Motion Sensors', 'Environmental Sensors', 'Access Control']
  },
  
  manufacturing: {
    name: 'Manufacturing Floor',
    type: 'Manufacturing',
    area: 3000,
    capacity: 50,
    recommendedDevices: ['Multiple Cameras', 'Environmental Sensors', 'Safety Sensors', 'Access Control']
  },
  
  laboratory: {
    name: 'Laboratory',
    type: 'Laboratory',
    area: 400,
    capacity: 8,
    recommendedDevices: ['Multiple Cameras', 'Environmental Sensors', 'Access Control', 'Safety Systems']
  }
};
```

### Step 5: Device Pre-Configuration (Optional)
```typescript
{
  devices: [
    {
      deviceName: string;
      deviceType: 'Camera' | 'Sensor' | 'Access Control' | 'Other';
      roomId: string; // assign to specific room
      manufacturer: string;
      model: string;
      serialNumber: string;
    }
  ]
}
```

### Step 6: Review & Confirmation
```typescript
{
  // Summary of all entered data
  summary: {
    organizationName: string;
    totalFloors: number;
    totalRooms: number;
    totalArea: number;
    totalDepartments: number;
    totalDevices: number;
    estimatedCost: number;
  };
  
  // Confirmation
  termsAccepted: boolean;
  dataAccuracyConfirmed: boolean;
}
```

## 🎨 UI/UX Requirements

### Multi-Step Wizard Interface
```
Step 1: Organization Info     [=====>              ] 20%
Step 2: Departments           [=========>          ] 40%
Step 3: Floor Plans           [=============>      ] 60%
Step 4: Room Configuration    [================>   ] 80%
Step 5: Review & Confirm      [====================] 100%
```

### Features Needed
1. **Progress Indicator** - Show current step and completion percentage
2. **Navigation** - Back/Next buttons, ability to jump to any completed step
3. **Validation** - Real-time validation for each field
4. **Auto-Save** - Save progress automatically
5. **Templates** - Quick-select room templates
6. **Bulk Actions** - Add multiple rooms at once
7. **Visual Preview** - Show 3D floor plan preview as rooms are added
8. **Drag & Drop** - Arrange rooms visually on floor plan
9. **Import/Export** - Import floor plans from CSV/JSON
10. **Duplicate** - Copy floor structure to create similar floors

## 📊 Data Validation Rules

### Organization Level
- Name: 3-100 characters, unique
- Email: Valid email format, unique
- Password: Min 8 characters, 1 uppercase, 1 number
- Max Devices: Must match plan limits

### Department Level
- Name: 2-50 characters
- Email: Valid email format
- Budget: Positive number
- Max Devices: Cannot exceed organization limit

### Floor Level
- Floor Number: Positive integer, unique per organization
- Total Area: Positive number
- Must have at least 1 room

### Room Level
- Room ID: Unique per floor (e.g., R101, R102)
- Room Name: 2-50 characters
- Area: Positive number, cannot exceed floor area
- Capacity: Positive integer
- Total room area cannot exceed floor total area

## 🔧 API Endpoints Needed

### Create Organization with Complete Setup
```typescript
POST /api/superadmin/organizations/complete-setup

Request Body:
{
  organization: { /* Step 1 data */ },
  departments: [ /* Step 2 data */ ],
  floors: [ /* Step 3 data */ ],
  devices: [ /* Step 5 data */ ]
}

Response:
{
  success: boolean;
  organizationId: string;
  summary: {
    floorsCreated: number;
    roomsCreated: number;
    departmentsCreated: number;
    devicesCreated: number;
  };
  errors: string[];
}
```

### Get Room Templates
```typescript
GET /api/superadmin/room-templates

Response:
{
  templates: RoomTemplate[];
  categories: string[];
}
```

### Validate Floor Plan
```typescript
POST /api/superadmin/validate-floor-plan

Request Body:
{
  floors: Floor[];
}

Response:
{
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  statistics: {
    totalArea: number;
    totalRooms: number;
    utilizationRate: number;
  };
}
```

## 📁 Database Schema

### Organizations Table
```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL,
  max_devices INTEGER NOT NULL,
  contact_person TEXT,
  phone_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Departments Table
```sql
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  head_of_department TEXT,
  email TEXT,
  phone_number TEXT,
  budget REAL,
  max_devices INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### Floor Plans Table
```sql
CREATE TABLE floor_plans (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  floor_number INTEGER NOT NULL,
  floor_name TEXT NOT NULL,
  total_area REAL NOT NULL,
  description TEXT,
  floors JSON NOT NULL, -- Complete floor structure with rooms
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  UNIQUE(organization_id, floor_number)
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT DEFAULT 'active',
  last_seen DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

## 🎯 Implementation Priority

### Phase 1: Basic Wizard (High Priority)
- [ ] Multi-step wizard UI component
- [ ] Organization info form (Step 1)
- [ ] Department management (Step 2)
- [ ] Basic floor plan creation (Step 3)
- [ ] Review and submit (Step 6)

### Phase 2: Advanced Features (Medium Priority)
- [ ] Room templates system
- [ ] Bulk room creation
- [ ] Visual floor plan editor
- [ ] Device pre-configuration
- [ ] Import/Export functionality

### Phase 3: Enhanced UX (Low Priority)
- [ ] Drag & drop room arrangement
- [ ] Real-time 3D preview
- [ ] Auto-save functionality
- [ ] Duplicate floor feature
- [ ] Advanced validation

## 📝 Example: Complete Organization Setup

```json
{
  "organization": {
    "name": "TechCorp Industries",
    "email": "admin@techcorp.com",
    "password": "SecurePass123!",
    "plan": "enterprise",
    "maxDevices": 500,
    "contactPerson": "John Doe",
    "phoneNumber": "+1-555-0123",
    "address": "123 Tech Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  },
  
  "departments": [
    {
      "name": "IT Department",
      "description": "Information Technology",
      "headOfDepartment": "Jane Smith",
      "email": "it@techcorp.com",
      "phoneNumber": "+1-555-0124",
      "budget": 500000,
      "maxDevices": 150
    },
    {
      "name": "Operations",
      "description": "Operations Department",
      "headOfDepartment": "Bob Johnson",
      "email": "ops@techcorp.com",
      "phoneNumber": "+1-555-0125",
      "budget": 300000,
      "maxDevices": 100
    }
  ],
  
  "floors": [
    {
      "floorNumber": 1,
      "floorName": "Ground Floor",
      "totalArea": 5000,
      "description": "Main entrance and lobby",
      "rooms": [
        {
          "roomId": "R101",
          "roomName": "Main Lobby",
          "roomType": "Lobby",
          "area": 800,
          "capacity": 50,
          "departmentId": "dept_ops",
          "hasCamera": true,
          "hasSensors": true,
          "hasAccessControl": true
        },
        {
          "roomId": "R102",
          "roomName": "Reception",
          "roomType": "Office",
          "area": 200,
          "capacity": 3,
          "departmentId": "dept_ops",
          "hasCamera": true,
          "hasSensors": true,
          "hasAccessControl": false
        },
        {
          "roomId": "R103",
          "roomName": "Server Room",
          "roomType": "Server Room",
          "area": 300,
          "capacity": 5,
          "departmentId": "dept_it",
          "hasCamera": true,
          "hasSensors": true,
          "hasAccessControl": true
        }
      ]
    },
    {
      "floorNumber": 2,
      "floorName": "Second Floor",
      "totalArea": 4500,
      "description": "Office spaces",
      "rooms": [
        {
          "roomId": "R201",
          "roomName": "IT Office",
          "roomType": "Office",
          "area": 600,
          "capacity": 10,
          "departmentId": "dept_it",
          "hasCamera": true,
          "hasSensors": true,
          "hasAccessControl": true
        },
        {
          "roomId": "R202",
          "roomName": "Conference Room A",
          "roomType": "Conference Room",
          "area": 500,
          "capacity": 20,
          "departmentId": "dept_ops",
          "hasCamera": true,
          "hasSensors": true,
          "hasAccessControl": false
        }
      ]
    }
  ]
}
```

## ✅ Summary

**Current Status**: ❌ Advanced wizard NOT implemented
**What Exists**: Basic form with only name, email, password, plan, maxDevices
**What's Missing**: Everything else (departments, floors, rooms, templates, etc.)

**To implement the complete wizard, you need to**:
1. Create multi-step wizard UI component
2. Add department management step
3. Add floor plan configuration step
4. Add room template system
5. Create complete-setup API endpoint
6. Update database schema
7. Add validation logic
8. Create 3D preview component

This is a significant feature that requires substantial development work!
