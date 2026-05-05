# Implementation Plan

## Current Project Analysis

**✅ Already Implemented:**
- ✅ Project structure with Next.js 15, TypeScript, and Tailwind CSS
- ✅ Firebase configuration and Firestore setup (`src/firebase/`)
- ✅ UI component library with Radix UI (`src/components/ui/`)
- ✅ Authentication system with role-based access (`src/contexts/auth-context.tsx`)
- ✅ Existing type definitions for Organization, Department, Device (`src/lib/types.ts`)
- ✅ 3D visualization using Three.js/React Three Fiber (`src/components/HospitalFloorPlan3D.tsx`)
- ✅ Admin and Super Admin portal structure (`src/app/admin/`, `src/app/superadmin/`)
- ✅ Device management components (`src/components/admin/device-*.tsx`)
- ✅ Super Admin organization creation forms (`src/components/superadmin/create-organization-form.tsx`)
- ✅ Firebase real-time hooks (`src/firebase/firestore/use-collection.tsx`, `use-doc.tsx`)

**🔄 Needs Extension/Modification:**
- 🔄 Extend type definitions for floor plan hierarchical structure
- 🔄 Create services for floor plan and room management
- 🔄 Build 2D visualization component (currently only 3D exists)
- 🔄 Add network topology and Safe Edge integration
- 🔄 Extend device types to include room assignment
- ❌ Testing framework (Jest and fast-check) not yet configured

---

## Implementation Tasks

- [x] 1. Extend type definitions for floor plan system
  - Extend existing `src/lib/types.ts` with FloorPlan, Floor, Room interfaces
  - Add Position2D, RoomSize, NetworkConnection, EthernetInternetBox, SafeEdge types
  - Update Device interface to include roomId and position fields
  - Add validation types for floor plan data
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2_
  - _Status: Partially complete - Organization and Device types exist, need floor plan types_

- [ ]* 1.1 Write property test for organization and identifier uniqueness
  - **Property 1: Organization and identifier uniqueness**
  - **Validates: Requirements 1.1, 2.1, 2.2**

- [x] 2. Create floor plan management service





  - Create `src/lib/floor-plan-service.ts` with FloorPlanService class
  - Implement createFloorPlan, updateFloorPlan, getFloorPlan methods
  - Add floor and room identifier uniqueness validation
  - Implement approval workflow for floor plans
  - Create Firestore collection structure: `organizations/{orgId}/floorPlans/{planId}`
  - _Requirements: 1.2, 1.3, 1.5, 2.1, 2.2, 3.1_

- [ ]* 2.1 Write property test for mandatory field validation
  - **Property 2: Mandatory field validation**
  - **Validates: Requirements 1.2, 1.3, 5.1**

- [ ]* 2.2 Write property test for hierarchical structure preservation
  - **Property 3: Hierarchical structure preservation**
  - **Validates: Requirements 1.5**

- [ ]* 2.3 Write property test for optional data storage consistency
  - **Property 4: Optional data storage consistency**
  - **Validates: Requirements 1.4**




- [x] 3. Extend device service for room assignment


  - Update existing device management to include roomId field
  - Add device-to-room assignment functionality in device service
  - Implement device positioning logic for 2D layouts
  - Add validation to ensure devices belong to valid rooms
  - Update `src/components/admin/device-form.tsx` to include room selection
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 3.1 Write property test for device-room relationship constraints
  - **Property 9: Device-room relationship constraints**
  - **Validates: Requirements 5.2, 5.3**

- [x] 4. Build Super Admin floor plan definition interface


  - Create `src/app/superadmin/floor-plans/page.tsx` for floor plan management
  - Create `src/components/superadmin/create-floor-plan-form.tsx` component
  - Add floor input fields: total floors, rooms per floor, room names, room sizes
  - Implement validation for zero floor/room counts and empty names
  - Add approval workflow UI for floor plans
  - _Requirements: 1.1, 1.2, 1.3, 2.3, 2.4, 2.5_

- [x] 5. Create 2D floor plan visualization component





  - Create `src/components/admin/FloorPlan2D.tsx` using HTML5 Canvas or SVG
  - Implement room layout generation from floor plan data
  - Add room labels and identifier display
  - Implement device markers positioned within rooms
  - Add automatic layout updates when data changes
  - Include zoom and pan controls for navigation
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ]* 5.1 Write property test for 2D model generation and updates
  - **Property 5: 2D model generation and updates**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ]* 5.2 Write property test for device visualization in 2D layouts
  - **Property 7: Device visualization in 2D layouts**
  - **Validates: Requirements 3.5, 5.4**

- [ ]* 5.3 Write property test for access control for approved configurations
  - **Property 6: Access control for approved configurations**
  - **Validates: Requirements 3.4, 4.5**

- [x] 6. Build Organization Admin floor plan viewing interface


 
  - Create `src/app/admin/floor-plan/page.tsx` for viewing approved floor plans
  - Integrate FloorPlan2D component for visualization
  - Add floor and room list navigation
  - Display device distribution across rooms
  - Show connectivity status and data flow information
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 6.1 Write property test for hierarchical structure display completeness
  - **Property 8: Hierarchical structure display completeness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 7.1**

- [x] 7. Create network topology service





  - Create `src/lib/network-service.ts` with NetworkService class
  - Implement Ethernet Internet Box configuration
  - Add Safe Edge integration and connection management
  - Implement network validation ensuring centralized topology
  - Create methods to validate all devices connect through Safe Edge
  - Add connectivity health monitoring
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 7.1 Write property test for centralized network topology
  - **Property 10: Centralized network topology**
  - **Validates: Requirements 6.1, 6.2, 6.3, 9.1, 9.2**

- [ ]* 7.2 Write property test for Safe Edge communication routing
  - **Property 11: Safe Edge communication routing**
  - **Validates: Requirements 6.4, 9.3, 9.5**

- [ ]* 7.3 Write property test for network topology validation
  - **Property 17: Network topology validation**
  - **Validates: Requirements 9.4**

- [x] 8. Implement cloud dashboard with building hierarchy





  - Update `src/app/admin/dashboard/page.tsx` to include floor plan hierarchy
  - Add building structure visualization with floors and rooms
  - Display devices per room with current status
  - Show connectivity status and communication health
  - Implement alert and warning notification system
  - Add real-time updates using Firebase listeners
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for system status and monitoring display
  - **Property 12: System status and monitoring display**
  - **Validates: Requirements 4.4, 7.2, 7.3, 7.4**

- [ ]* 8.2 Write property test for real-time update consistency
  - **Property 13: Real-time update consistency**
  - **Validates: Requirements 7.5, 8.5**

- [x] 9. Add floor plan update handling with device preservation





  - Implement floor plan modification functionality
  - Add logic to preserve existing device mappings during updates
  - Implement device reassignment validation (only to valid rooms)
  - Add device removal with network mapping cleanup
  - Ensure updates reflect in both 2D layout and dashboard
  - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [ ]* 9.1 Write property test for update preservation and cleanup
  - **Property 14: Update preservation and cleanup**
  - **Validates: Requirements 8.1, 8.4**

- [ ]* 9.2 Write property test for device reassignment validation
  - **Property 16: Device reassignment validation**
  - **Validates: Requirements 8.3**

- [x] 10. Implement security and access control




  - Add authorization middleware for floor plan modifications
  - Implement role-based access: Super Admin (create/modify), Org Admin (view only)
  - Create security event logging for unauthorized attempts
  - Add validation to prevent Safe Edge disconnection while devices exist
  - Implement audit trail for all floor plan changes
  - _Requirements: 8.2, 6.5_

- [ ]* 10.1 Write property test for security and access control
  - **Property 15: Security and access control**
  - **Validates: Requirements 8.2**

- [x] 11. Create API routes for floor plan operations


  - Create `src/app/api/floor-plans/route.ts` for floor plan CRUD
  - Create `src/app/api/floor-plans/[id]/rooms/route.ts` for room management
  - Create `src/app/api/network/topology/route.ts` for network validation
  - Add request validation middleware
  - Implement error handling with structured responses
  - _Requirements: All requirements_

- [x] 12. Add comprehensive validation and error handling


  - Implement validation for zero floor/room counts
  - Add validation for empty room names
  - Create error handling for orphaned devices (no room assignment)
  - Add network topology validation errors
  - Implement user-friendly error messages for all validation failures
  - _Requirements: 2.3, 2.4, 2.5, 5.5, 6.5_

- [ ] 13. Configure testing framework
  - Install Jest and fast-check packages
  - Create `jest.config.js` for Next.js
  - Set up test utilities and helpers
  - Configure test scripts in package.json
  - Create example test files for reference
  - _Requirements: All requirements_

- [ ] 14. Final integration and testing
  - Test complete workflow: Super Admin creates floor plan → Org Admin views and adds devices
  - Validate network topology scenarios with multiple devices
  - Test floor plan updates with device preservation
  - Verify real-time synchronization across all interfaces
  - Test access control for both user roles
  - Validate all error handling scenarios
  - _Requirements: All requirements_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

**Existing Components to Leverage:**
- Use existing `src/components/superadmin/create-organization-form.tsx` as template for floor plan forms
- Extend existing `src/components/admin/device-form.tsx` to add room selection
- Leverage existing `src/firebase/firestore/use-collection.tsx` for real-time floor plan data
- Use existing authentication context for role-based access control

**Key Differences from 3D Implementation:**
- Replace Three.js 3D rendering with Canvas/SVG 2D rendering
- Simpler layout algorithm for 2D room positioning
- Focus on hierarchical list view alongside 2D visualization
- Network topology visualization in 2D (lines connecting devices to Ethernet box to Safe Edge)