# Blackshield-X System Requirements - 2D Implementation

## 1. System Roles

### 1.1 Super Admin
- Creates organization profiles
- Defines structural building layout in 2D
- Configures floors, rooms, and room properties
- Approves and updates floor plan definitions
- Manages organization accounts and departments

### 1.2 Organization Admin
- Views approved 2D floor plan
- Adds devices to defined rooms
- Links devices through Ethernet to Safe Edge
- Updates device assignments
- Views system connectivity status and data flow
- Manages device positioning within rooms (2D coordinates)

## 2. Floor Plan Definition Process

### 2.1 Super Admin Floor Inputs
**Mandatory input parameters:**
- Total number of floors
- For each floor:
  - Total number of rooms
  - Room name per room
  - Room size per room (width x height in units)
  - Room identifier (unique within floor)
  - Room position on floor (x, y coordinates)

### 2.2 Data Handling
- Store floor and room metadata in SQLite database
- Maintain hierarchical structure: Organization → Floor → Room
- Ensure uniqueness:
  - Floor identifiers unique within organization
  - Room identifiers unique within floor
- Support room positioning with 2D coordinates

## 3. Floor Plan Conversion to 2D Visualization

### 3.1 Rendering Requirements
- Convert floor and room data into 2D layout visualization
- Represent each floor as a 2D grid/canvas
- Represent each room with:
  - Room boundary rectangle
  - Room label and identifier
  - Room dimensions display
  - Device icons positioned within room

### 3.2 Display Conditions
- 2D model must be accessible only after configuration approval
- Model must update automatically when structure configuration changes
- Model must allow device visualization inside rooms
- Interactive room selection and highlighting
- Zoom and pan controls for large floor plans

## 4. Organization Portal Functionality

### 4.1 Organization View
System must display:
- List of floors with navigation
- List of rooms inside each floor
- 2D visualization of entire building layout
- Interactive room identification
- Device distribution visualization within rooms
- Room occupancy and capacity indicators

### 4.2 Interactive Features
- Click on rooms to view details
- Drag and drop device positioning
- Room selection for device assignment
- Visual feedback for device status
- Hover tooltips for room and device information

## 5. Device Management

### 5.1 Device Registration Input Fields
**Mandatory:**
- Floor selection (dropdown populated from organization's floor plan)
- Room selection (dropdown filtered by selected floor)
- Device name (with uniqueness validation within organization)
- Device identifier (auto-generated UUID or manual input with validation)
- Device type selection (Sensor, Gateway, Actuator, Camera, PIR, LDR, DHT22, etc.)
- 2D position within room (x, y coordinates with interactive placement)

**Optional:**
- Device description
- Device model/manufacturer
- Network configuration preferences
- Device orientation (for directional devices)
- Installation notes

### 5.2 Device Allocation Rules
- Each device must belong to a specific room (mandatory assignment)
- A room may contain multiple devices (no hard limit, but capacity-based warnings)
- Devices must be positioned in 2D layout inside corresponding room boundaries
- Device positions must not overlap (minimum spacing requirements)
- Device positions must be within room boundaries with proper clearance
- Visual collision detection for device placement
- Room capacity recommendations based on room size and device types
- Network accessibility validation from device positions

### 5.3 Device Positioning System
- Interactive 2D canvas for device placement within rooms
- Drag-and-drop functionality for device positioning
- Snap-to-grid system for precise alignment
- Visual feedback for valid/invalid positions
- Device icon representation based on device type
- Real-time position validation and error display
- Bulk device positioning with auto-arrangement options

### 5.4 Device Management Interface
- Device list view with filtering by floor/room/type/status
- Device details panel with full configuration options
- Bulk operations (select multiple devices for mass actions)
- Device search and filtering capabilities
- Device status monitoring with real-time updates
- Device reassignment between rooms with position updates

## 6. Networking Architecture Implementation

### 6.1 Connectivity Rules
- All registered devices must connect through Ethernet network
- Ethernet lines must logically map from devices to centralized Ethernet Internet Box
- Ethernet Internet Box must be connected to Safe Edge (LumeEdge)
- Visual representation of network topology in 2D

### 6.2 Safe Edge Integration
- Safe Edge acts as central secure edge controller
- All Ethernet inputs terminate into Safe Edge
- Safe Edge forwards processed communication to cloud
- Real-time status monitoring and visualization

## 7. Cloud Communication Layer

### 7.1 Cloud Dashboard Requirements
Cloud dashboard must display:
- Organization building structure (2D view)
- Floors with room layouts
- Rooms with device positioning
- Device status indicators
- Connectivity status visualization
- Communication health metrics
- Alerts and warnings panel

## 8. Update Handling

### 8.1 Floor Plan Update
- Any modifications to floor count or room distribution must regenerate 2D model
- Existing device mappings must remain intact unless rooms are removed
- Device positions must be preserved during room updates
- Unauthorized modification must be blocked
- Version control for floor plan changes

### 8.2 Device Update
- Device reassignment allowed only to valid rooms
- Device position updates within room boundaries
- Device removal must disconnect network mapping
- Updates must reflect in 2D visualization and cloud dashboard
- Real-time synchronization across all views

## 9. 2D Visualization Features

### 9.1 Floor Plan Canvas
- Scalable 2D canvas for floor representation
- Grid system for precise positioning
- Room boundary visualization with labels
- Device icons with status indicators
- Connection lines showing network topology

### 9.2 Interactive Controls
- Zoom in/out functionality
- Pan across large floor plans
- Room selection and highlighting
- Device drag-and-drop positioning
- Context menus for quick actions

### 9.3 Visual Elements
- Color-coded device status (online/offline/error)
- Room occupancy indicators
- Network connection visualization
- Alert indicators for issues
- Responsive design for different screen sizes

## 10. Validation Rules

### 10.1 Floor Plan Validation
- Floor count cannot be zero
- Room count cannot be zero per defined floor
- Room names cannot be empty
- Room positions must not overlap
- Room dimensions must be positive values

### 10.2 Device Validation
- Device must not exist without assigned room
- Device position must be within room boundaries
- Device identifiers must be unique within organization
- Network connections must be valid

### 10.3 Network Validation
- Safe Edge cannot be disconnected while devices exist
- Ethernet box must remain single centralized logical hub
- Device network assignments must be valid
- Connection capacity limits must be enforced

## 11. User Interface Requirements

### 11.1 Super Admin Interface
- Organization management dashboard
- Floor plan creation wizard
- Room editor with 2D positioning
- Approval workflow interface
- System monitoring dashboard

### 11.2 Organization Admin Interface
- 2D floor plan viewer
- Device management interface
- Network topology view
- Status monitoring dashboard
- Device assignment tools

### 11.3 Responsive Design
- Mobile-friendly interface
- Tablet optimization
- Desktop full-feature experience
- Touch-friendly controls
- Adaptive layouts

## 12. Performance Requirements

### 12.1 Rendering Performance
- 2D canvas rendering < 100ms for typical floor plans
- Smooth zoom and pan operations
- Efficient device position updates
- Optimized for 100+ devices per floor

### 12.2 Data Synchronization
- Real-time updates < 1 second latency
- Offline capability with sync on reconnect
- Conflict resolution for concurrent edits
- Efficient data transfer protocols

## 13. Security Requirements

### 13.1 Access Control
- Role-based permissions (Super Admin, Organization Admin)
- Organization data isolation
- Secure API endpoints
- Session management

### 13.2 Data Protection
- SQLite database security
- Input validation and sanitization
- Audit trail for all changes
- Backup and recovery procedures