# Tasks: Advanced Organization Creation Wizard

## Phase 1: Foundation & Infrastructure (High Priority)

### 1.1 Firebase Firestore Schema Setup
- [x] 1.1.1 Create organizations collection structure with all required fields
- [x] 1.1.2 Create departments collection structure with organizationId reference
- [x] 1.1.3 Create floorPlans collection with nested rooms array structure
- [x] 1.1.4 Create devices collection with organizationId and roomId references
- [x] 1.1.5 Create roomTemplates collection (pre-populate with 15+ templates)
- [ ] 1.1.6 Create composite indexes (organizations.email, departments.organizationId, floorPlans.organizationId, devices.organizationId)
- [ ] 1.1.7 Implement Firestore security rules for all collections
- [x] 1.1.8 Test Firestore schema with sample data

### 1.2 API Endpoints
- [x] 1.2.1 Create POST /api/superadmin/organizations/complete-setup endpoint
  - [x] 1.2.1.1 Implement request validation using Zod
  - [x] 1.2.1.2 Implement organization creation logic with Firestore
  - [x] 1.2.1.3 Implement department creation logic with Firestore batch write
  - [x] 1.2.1.4 Implement floor plan creation logic with nested rooms
  - [x] 1.2.1.5 Implement device creation logic with Firestore batch write
  - [x] 1.2.1.6 Implement Firestore batch write handling (up to 500 operations)
  - [x] 1.2.1.7 Implement error handling and batch rollback
  - [x] 1.2.1.8 Add password hashing with bcrypt
  - [x] 1.2.1.9 Add audit logging to Firestore
  - [x] 1.2.1.10 Check for duplicate email using Firestore query
- [x] 1.2.2 Create GET /api/superadmin/room-templates endpoint
  - [x] 1.2.2.1 Return room templates from Firestore roomTemplates collection
  - [x] 1.2.2.2 Add category filtering
  - [x] 1.2.2.3 Add caching for performance
- [x] 1.2.3 Create POST /api/superadmin/validate-floor-plan endpoint
  - [x] 1.2.3.1 Implement floor number validation
  - [x] 1.2.3.2 Implement room identifier validation
  - [x] 1.2.3.3 Implement area constraint validation
  - [x] 1.2.3.4 Calculate utilization statistics
  - [x] 1.2.3.5 Return warnings for suboptimal configurations

### 1.3 Validation Schemas
- [x] 1.3.1 Create Zod schema for OrganizationFormData
- [x] 1.3.2 Create Zod schema for DepartmentFormData
- [x] 1.3.3 Create Zod schema for FloorFormData
- [x] 1.3.4 Create Zod schema for RoomFormData
- [x] 1.3.5 Create Zod schema for DeviceFormData
- [x] 1.3.6 Create Zod schema for CompleteOrganizationSetup
- [x] 1.3.7 Add custom validation rules (unique identifiers, area constraints, device allocation)

## Phase 2: Core Wizard Components (High Priority)

### 2.1 Wizard Container
- [x] 2.1.1 Create WizardContainer component
- [x] 2.1.2 Implement step state management (currentStep, completedSteps)
- [x] 2.1.3 Implement wizard data state (organization, departments, floors, devices)
- [x] 2.1.4 Implement navigation logic (next, back, jump to step)
- [x] 2.1.5 Implement progress indicator component
- [x] 2.1.6 Implement auto-save functionality (every 30 seconds)
- [x] 2.1.7 Implement local storage persistence
- [x] 2.1.8 Add wizard context provider
- [x] 2.1.9 Add loading and error states

### 2.2 Step 1: Organization Info
- [x] 2.2.1 Create OrganizationInfoStep component
- [x] 2.2.2 Implement form fields (name, email, password, plan, contact details)
- [x] 2.2.3 Implement plan selector with device limits
- [x] 2.2.4 Add real-time email uniqueness validation
- [x] 2.2.5 Add password strength indicator
- [x] 2.2.6 Implement form validation with React Hook Form
- [x] 2.2.7 Add error message display
- [x] 2.2.8 Style with Tailwind CSS

### 2.3 Step 2: Department Management
- [x] 2.3.1 Create DepartmentManagementStep component
- [x] 2.3.2 Create DepartmentCard component
- [x] 2.3.3 Create AddDepartmentModal component
- [x] 2.3.4 Implement add/edit/delete department functionality
- [x] 2.3.5 Implement device allocation tracking
- [x] 2.3.6 Add real-time validation (total devices ≤ org limit)
- [x] 2.3.7 Create department summary panel
- [ ] 2.3.8 Add bulk import from CSV (optional)
- [x] 2.3.9 Style with Tailwind CSS

### 2.4 Step 3: Floor Plan Builder
- [x] 2.4.1 Create FloorPlanBuilderStep component
- [x] 2.4.2 Create FloorCard component
- [x] 2.4.3 Create AddFloorModal component
- [x] 2.4.4 Implement add/edit/delete floor functionality
- [ ] 2.4.5 Implement floor reordering with drag-and-drop
- [ ] 2.4.6 Implement duplicate floor functionality
- [x] 2.4.7 Add floor number validation (sequential, unique)
- [x] 2.4.8 Create floor summary display
- [x] 2.4.9 Style with Tailwind CSS

### 2.5 Step 4: Room Management
- [x] 2.5.1 Create RoomManagementStep component
- [x] 2.5.2 Create RoomTemplateGallery component
- [x] 2.5.3 Create RoomCard component
- [x] 2.5.4 Create AddRoomModal component
- [ ] 2.5.5 Create FloorLayoutPreview component (2D visualization)
- [x] 2.5.6 Implement template selection and quick-add
- [x] 2.5.7 Implement custom room creation
- [x] 2.5.8 Implement room identifier auto-generation
- [x] 2.5.9 Implement room position calculation algorithm
- [x] 2.5.10 Add real-time area validation per floor
- [ ] 2.5.11 Implement bulk room creation
- [x] 2.5.12 Add room editing and deletion
- [x] 2.5.13 Implement floor selector for multi-floor management
- [x] 2.5.14 Style with Tailwind CSS

### 2.6 Step 5: Device Configuration
- [x] 2.6.1 Create DeviceConfigurationStep component
- [x] 2.6.2 Create DeviceTable component
- [x] 2.6.3 Create AddDeviceModal component
- [x] 2.6.4 Implement add/edit/delete device functionality
- [x] 2.6.5 Implement room selector (grouped by floor)
- [x] 2.6.6 Add device type selector
- [x] 2.6.7 Implement skip functionality
- [x] 2.6.8 Display device count per room
- [x] 2.6.9 Style with Tailwind CSS

### 2.7 Step 6: Review & Confirmation
- [x] 2.7.1 Create ReviewConfirmationStep component
- [x] 2.7.2 Create OrganizationSummaryCard component
- [x] 2.7.3 Create FloorBreakdownAccordion component
- [ ] 2.7.4 Create DepartmentAllocationChart component
- [ ] 2.7.5 Create DeviceDistributionChart component
- [x] 2.7.6 Implement summary data calculation
- [ ] 2.7.7 Implement edit buttons (jump to specific steps)
- [x] 2.7.8 Add terms acceptance checkbox
- [x] 2.7.9 Implement submit functionality
- [x] 2.7.10 Add loading state during submission
- [x] 2.7.11 Add success/error message display
- [x] 2.7.12 Style with Tailwind CSS

## Phase 3: Integration & Data Flow (High Priority)

### 3.1 SuperAdmin Dashboard Integration
- [x] 3.1.1 Add "Create Organization (Advanced)" button to SuperAdmin dashboard
- [x] 3.1.2 Create wizard dialog/modal or full-page route
- [x] 3.1.3 Implement wizard open/close handlers
- [x] 3.1.4 Refresh organization list after successful creation
- [x] 3.1.5 Add success toast notification

### 3.2 Data Transformation
- [x] 3.2.1 Create utility function to transform wizard data to API format
- [ ] 3.2.2 Create utility function to transform API response to 3D format
- [x] 3.2.3 Implement room position calculation algorithm
- [x] 3.2.4 Implement room identifier generation algorithm
- [x] 3.2.5 Add data validation before transformation

### 3.3 3D Floor Plan Integration
- [ ] 3.3.1 Verify wizard output format matches 3D component interface
- [ ] 3.3.2 Test 3D rendering with wizard-generated data
- [ ] 3.3.3 Add integration test: create org → login → view 3D
- [ ] 3.3.4 Fix any data format mismatches

## Phase 4: Validation & Error Handling (Medium Priority)

### 4.1 Client-Side Validation
- [ ] 4.1.1 Implement real-time field validation
- [ ] 4.1.2 Implement step-level validation
- [ ] 4.1.3 Add debounced validation for expensive checks
- [ ] 4.1.4 Display inline error messages
- [ ] 4.1.5 Prevent navigation with invalid data
- [ ] 4.1.6 Add validation error summary

### 4.2 Server-Side Validation
- [ ] 4.2.1 Validate all request data with Zod schemas
- [ ] 4.2.2 Check organization email uniqueness with Firestore query
- [ ] 4.2.3 Check organization name uniqueness with Firestore query
- [ ] 4.2.4 Validate device allocation constraints
- [ ] 4.2.5 Validate room area constraints
- [ ] 4.2.6 Validate referential integrity (devices → rooms)
- [ ] 4.2.7 Return detailed validation errors

### 4.3 Error Handling
- [ ] 4.3.1 Handle network errors gracefully
- [ ] 4.3.2 Handle API errors with user-friendly messages
- [ ] 4.3.3 Implement retry logic for failed submissions
- [ ] 4.3.4 Add error boundary for React component errors
- [ ] 4.3.5 Log errors for debugging
- [ ] 4.3.6 Display error toast notifications

## Phase 5: Testing (Medium Priority)

### 5.1 Unit Tests
- [ ] 5.1.1 Test WizardContainer navigation logic
- [ ] 5.1.2 Test each step component rendering
- [ ] 5.1.3 Test form validation logic
- [ ] 5.1.4 Test data transformation utilities
- [ ] 5.1.5 Test room position calculation algorithm
- [ ] 5.1.6 Test room identifier generation algorithm
- [ ] 5.1.7 Test device allocation validation
- [ ] 5.1.8 Test room area validation
- [ ] 5.1.9 Achieve 85% code coverage

### 5.2 Property-Based Tests
- [ ] 5.2.1 Test device allocation property (sum ≤ org limit)
- [ ] 5.2.2 Test room area property (sum ≤ floor area)
- [ ] 5.2.3 Test unique identifier property
- [ ] 5.2.4 Test 3D data compatibility property
- [ ] 5.2.5 Test password validation property

### 5.3 Integration Tests
- [ ] 5.3.1 Test complete wizard flow (all 6 steps)
- [ ] 5.3.2 Test API endpoint integration with Firebase
- [ ] 5.3.3 Test Firestore batch write handling
- [ ] 5.3.4 Test error scenarios (duplicate email, validation failures)
- [ ] 5.3.5 Test 3D floor plan rendering with wizard data
- [ ] 5.3.6 Test auto-save and recovery

### 5.4 End-to-End Tests
- [ ] 5.4.1 Test SuperAdmin creates organization via wizard
- [ ] 5.4.2 Test organization appears in dashboard
- [ ] 5.4.3 Test organization admin login
- [ ] 5.4.4 Test 3D floor plan loads correctly
- [ ] 5.4.5 Test all rooms and devices render in 3D
- [ ] 5.4.6 Test wizard with maximum data (20 floors, 100 rooms/floor)

## Phase 6: Performance Optimization (Low Priority)

### 6.1 Client-Side Performance
- [ ] 6.1.1 Implement lazy loading for step components
- [ ] 6.1.2 Add React.memo() for expensive components
- [ ] 6.1.3 Implement virtual scrolling for large lists
- [ ] 6.1.4 Debounce validation by 300ms
- [ ] 6.1.5 Optimize room position calculation
- [ ] 6.1.6 Add loading skeletons for async operations

### 6.2 Server-Side Performance
- [ ] 6.2.1 Implement Firestore batch writes (up to 500 operations per batch)
- [ ] 6.2.2 Use parallel writes for independent collections
- [ ] 6.2.3 Add caching for room templates
- [ ] 6.2.4 Optimize Firestore queries with composite indexes
- [ ] 6.2.5 Enable response compression

### 6.3 Performance Testing
- [ ] 6.3.1 Measure step transition time (target < 100ms)
- [ ] 6.3.2 Measure validation response time (target < 300ms)
- [ ] 6.3.3 Measure submission time (target < 3s)
- [ ] 6.3.4 Test with large organizations (20 floors, 100 rooms/floor)
- [ ] 6.3.5 Profile and optimize bottlenecks

## Phase 7: Security & Compliance (Medium Priority)

### 7.1 Authentication & Authorization
- [ ] 7.1.1 Verify SuperAdmin-only access to wizard
- [ ] 7.1.2 Validate SuperAdmin session on API calls
- [ ] 7.1.3 Implement CSRF protection
- [ ] 7.1.4 Add rate limiting (10 orgs/hour per SuperAdmin)

### 7.2 Data Security
- [ ] 7.2.1 Hash passwords with bcrypt (cost factor 12)
- [ ] 7.2.2 Sanitize all text inputs (XSS prevention)
- [ ] 7.2.3 Implement Firestore security rules for all collections
- [ ] 7.2.4 Encrypt sensitive PII at rest
- [ ] 7.2.5 Implement audit logging in Firestore

### 7.3 Security Testing
- [ ] 7.3.1 Test unauthorized access attempts
- [ ] 7.3.2 Test Firestore security rules enforcement
- [ ] 7.3.3 Test XSS attempts
- [ ] 7.3.4 Test CSRF attacks
- [ ] 7.3.5 Verify password hashing in Firestore

## Phase 8: UI/UX Polish (Low Priority)

### 8.1 Visual Design
- [ ] 8.1.1 Apply consistent Tailwind CSS styling
- [ ] 8.1.2 Add smooth transitions between steps
- [ ] 8.1.3 Add hover states and focus indicators
- [ ] 8.1.4 Implement responsive design (1280px+)
- [ ] 8.1.5 Add loading skeletons
- [ ] 8.1.6 Add empty states for lists

### 8.2 User Experience
- [ ] 8.2.1 Add contextual help text
- [ ] 8.2.2 Add tooltips for complex fields
- [ ] 8.2.3 Implement keyboard navigation
- [ ] 8.2.4 Add confirmation dialogs for destructive actions
- [ ] 8.2.5 Improve error message clarity
- [ ] 8.2.6 Add success animations

### 8.3 Accessibility
- [ ] 8.3.1 Add ARIA labels to all interactive elements
- [ ] 8.3.2 Ensure keyboard navigation works
- [ ] 8.3.3 Test with screen readers
- [ ] 8.3.4 Ensure color contrast meets WCAG AA
- [ ] 8.3.5 Add focus management for modals

## Phase 9: Documentation (Low Priority)

### 9.1 Code Documentation
- [ ] 9.1.1 Add JSDoc comments to all components
- [ ] 9.1.2 Add JSDoc comments to utility functions
- [ ] 9.1.3 Document API endpoints with OpenAPI/Swagger
- [ ] 9.1.4 Document Firestore collections schema
- [ ] 9.1.5 Create component storybook (optional)

### 9.2 User Documentation
- [ ] 9.2.1 Create SuperAdmin user guide for wizard
- [ ] 9.2.2 Create video tutorial (optional)
- [ ] 9.2.3 Add inline help text in wizard
- [ ] 9.2.4 Create FAQ document

### 9.3 Developer Documentation
- [ ] 9.3.1 Document wizard architecture
- [ ] 9.3.2 Document data flow
- [ ] 9.3.3 Document validation rules
- [ ] 9.3.4 Create contribution guide
- [ ] 9.3.5 Document testing strategy

## Phase 10: Future Enhancements (Optional)

### 10.1 Advanced Features
- [ ] 10.1.1 Import floor plans from CAD files (DXF, DWG)
- [ ] 10.1.2 Drag-and-drop room arrangement
- [ ] 10.1.3 Real-time 3D preview during wizard
- [ ] 10.1.4 AI-powered room layout optimization
- [ ] 10.1.5 Template creation and sharing
- [ ] 10.1.6 Bulk organization import from CSV/Excel
- [ ] 10.1.7 Organization cloning feature
- [ ] 10.1.8 Advanced device configuration with network topology
- [ ] 10.1.9 Cost estimation calculator
- [ ] 10.1.10 Integration with external building management systems

## Summary

**Total Tasks**: 200+
**Estimated Effort**: 6-8 weeks for 1 developer
**Priority Breakdown**:
- High Priority (Phases 1-3): 100+ tasks, 4-5 weeks
- Medium Priority (Phases 4-5, 7): 60+ tasks, 1-2 weeks
- Low Priority (Phases 6, 8-9): 40+ tasks, 1 week
- Optional (Phase 10): 10+ tasks, variable

**Critical Path**:
1. Database schema (1.1) → API endpoints (1.2) → Validation schemas (1.3)
2. Wizard container (2.1) → Step components (2.2-2.7)
3. Integration (3.1-3.3)
4. Testing (5.1-5.4)
5. Polish & documentation (8.1-9.3)
