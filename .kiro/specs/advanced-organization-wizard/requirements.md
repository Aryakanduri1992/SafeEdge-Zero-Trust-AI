# Requirements Document: Advanced Organization Creation Wizard

## 1. Functional Requirements

### 1.1 Multi-Step Wizard Navigation

**FR-1.1.1**: The system SHALL provide a 6-step wizard interface for organization creation.

**FR-1.1.2**: The system SHALL display a progress indicator showing current step and completion percentage.

**FR-1.1.3**: The system SHALL allow navigation to previous steps at any time.

**FR-1.1.4**: The system SHALL prevent navigation to next step until current step validation passes.

**FR-1.1.5**: The system SHALL allow direct navigation to any previously completed step.

**FR-1.1.6**: The system SHALL persist wizard state across browser sessions (auto-save).

### 1.2 Organization Information (Step 1)

**FR-1.2.1**: The system SHALL collect organization name (3-100 characters, unique).

**FR-1.2.2**: The system SHALL collect organization email (valid format, unique).

**FR-1.2.3**: The system SHALL collect organization password (min 8 chars, 1 uppercase, 1 number, 1 special char).

**FR-1.2.4**: The system SHALL provide plan selection (Basic/Pro/Enterprise) with device limits.

**FR-1.2.5**: The system SHALL collect contact information (person, phone, address, city, state, zip, country).

**FR-1.2.6**: The system SHALL validate email uniqueness in real-time.

**FR-1.2.7**: The system SHALL display password strength indicator.

### 1.3 Department Management (Step 2)

**FR-1.3.1**: The system SHALL allow creation of multiple departments.

**FR-1.3.2**: The system SHALL collect department details (name, description, head, email, phone, budget, max devices).

**FR-1.3.3**: The system SHALL validate that sum of department max devices does not exceed organization limit.

**FR-1.3.4**: The system SHALL display real-time device allocation summary.

**FR-1.3.5**: The system SHALL allow editing and deletion of departments.

**FR-1.3.6**: The system SHALL ensure unique department names within organization.

**FR-1.3.7**: The system SHALL support bulk import of departments from CSV (optional).

### 1.4 Floor Plan Configuration (Step 3)

**FR-1.4.1**: The system SHALL allow creation of multiple floors.

**FR-1.4.2**: The system SHALL collect floor details (number, name, total area, description).

**FR-1.4.3**: The system SHALL enforce sequential floor numbering starting from 1.

**FR-1.4.4**: The system SHALL allow reordering of floors via drag-and-drop.

**FR-1.4.5**: The system SHALL provide "Duplicate Floor" functionality.

**FR-1.4.6**: The system SHALL validate floor numbers are unique.

**FR-1.4.7**: The system SHALL support up to 20 floors per organization.

### 1.5 Room Management (Step 4)

**FR-1.5.1**: The system SHALL provide 15+ pre-defined room templates across 5 categories.

**FR-1.5.2**: The system SHALL display room template gallery with filtering by category.

**FR-1.5.3**: The system SHALL allow quick-add rooms from templates.

**FR-1.5.4**: The system SHALL allow custom room creation with manual dimensions.

**FR-1.5.5**: The system SHALL auto-generate room identifiers in format R{floor}{number} (e.g., R101, R102).

**FR-1.5.6**: The system SHALL allow manual override of room identifiers.

**FR-1.5.7**: The system SHALL validate room identifiers are unique per floor.

**FR-1.5.8**: The system SHALL validate total room area does not exceed floor area.

**FR-1.5.9**: The system SHALL display real-time area utilization per floor.

**FR-1.5.10**: The system SHALL auto-calculate room positions on floor using grid layout.

**FR-1.5.11**: The system SHALL provide visual 2D floor layout preview.

**FR-1.5.12**: The system SHALL allow assignment of rooms to departments.

**FR-1.5.13**: The system SHALL support bulk room creation.

**FR-1.5.14**: The system SHALL support up to 100 rooms per floor.

### 1.6 Device Pre-Configuration (Step 5)

**FR-1.6.1**: The system SHALL allow optional pre-configuration of devices.

**FR-1.6.2**: The system SHALL collect device details (name, type, room assignment, manufacturer, model, serial number).

**FR-1.6.3**: The system SHALL provide room selector grouped by floor.

**FR-1.6.4**: The system SHALL validate device room assignments reference existing rooms.

**FR-1.6.5**: The system SHALL display device count per room.

**FR-1.6.6**: The system SHALL allow skipping device configuration.

**FR-1.6.7**: The system SHALL support device types: Camera, Sensor, Access Control, Other.

### 1.7 Review and Confirmation (Step 6)

**FR-1.7.1**: The system SHALL display comprehensive summary of all entered data.

**FR-1.7.2**: The system SHALL show organization summary (name, plan, total floors, rooms, departments, devices).

**FR-1.7.3**: The system SHALL show floor-by-floor breakdown with room counts.

**FR-1.7.4**: The system SHALL show department allocation summary.

**FR-1.7.5**: The system SHALL show device distribution by type and room.

**FR-1.7.6**: The system SHALL provide "Edit" buttons to jump back to specific steps.

**FR-1.7.7**: The system SHALL require terms acceptance checkbox before submission.

**FR-1.7.8**: The system SHALL submit complete data to API endpoint.

**FR-1.7.9**: The system SHALL display success message with organization ID upon completion.

**FR-1.7.10**: The system SHALL handle submission errors gracefully with retry option.

### 1.8 Data Persistence and API

**FR-1.8.1**: The system SHALL provide API endpoint POST /api/superadmin/organizations/complete-setup.

**FR-1.8.2**: The system SHALL provide API endpoint GET /api/superadmin/room-templates.

**FR-1.8.3**: The system SHALL provide API endpoint POST /api/superadmin/validate-floor-plan.

**FR-1.8.4**: The system SHALL create organization document in Firebase Firestore.

**FR-1.8.5**: The system SHALL create department documents linked to organization.

**FR-1.8.6**: The system SHALL create floor plan documents with complete room structure.

**FR-1.8.7**: The system SHALL create device documents linked to rooms.

**FR-1.8.8**: The system SHALL use Firestore batch writes to ensure atomicity (up to 500 operations).

**FR-1.8.9**: The system SHALL handle batch write failures gracefully.

**FR-1.8.10**: The system SHALL hash organization passwords using bcrypt before storage.

### 1.9 3D Floor Plan Integration

**FR-1.9.1**: The system SHALL generate data compatible with existing Simple3DFloorPlan component.

**FR-1.9.2**: The system SHALL ensure all rooms have position data (x, y, width, height).

**FR-1.9.3**: The system SHALL link devices to rooms via deviceIds array.

**FR-1.9.4**: The system SHALL support room types recognized by 3D component (Office, Conference Room, Lobby, Storage, Server Room, Kitchen, Other).

**FR-1.9.5**: The system SHALL enable immediate 3D visualization after organization creation.

## 2. Non-Functional Requirements

### 2.1 Performance

**NFR-2.1.1**: Step transitions SHALL complete in < 100ms.

**NFR-2.1.2**: Real-time validation SHALL respond in < 300ms.

**NFR-2.1.3**: Room template loading SHALL complete in < 500ms.

**NFR-2.1.4**: Complete organization submission SHALL complete in < 3 seconds for typical organization (3 floors, 15 rooms, 30 devices).

**NFR-2.1.5**: 3D floor plan SHALL load in < 2 seconds after organization creation.

**NFR-2.1.6**: The system SHALL support concurrent creation of up to 10 organizations.

### 2.2 Usability

**NFR-2.2.1**: SuperAdmin SHALL be able to create complete organization in 5-10 minutes.

**NFR-2.2.2**: The system SHALL provide inline error messages for validation failures.

**NFR-2.2.3**: The system SHALL provide contextual help text for complex fields.

**NFR-2.2.4**: The system SHALL use consistent UI patterns across all steps.

**NFR-2.2.5**: The system SHALL be responsive and work on desktop screens (1280px+).

**NFR-2.2.6**: The system SHALL provide keyboard navigation support.

### 2.3 Reliability

**NFR-2.3.1**: The system SHALL have 99.9% uptime.

**NFR-2.3.2**: The system SHALL auto-save wizard state every 30 seconds.

**NFR-2.3.3**: The system SHALL recover from browser crashes without data loss.

**NFR-2.3.4**: The system SHALL validate data on both client and server.

**NFR-2.3.5**: The system SHALL log all organization creation events for audit.

### 2.4 Security

**NFR-2.4.1**: The system SHALL be accessible only to authenticated SuperAdmin users.

**NFR-2.4.2**: The system SHALL validate SuperAdmin session on every API call.

**NFR-2.4.3**: The system SHALL implement CSRF protection for form submission.

**NFR-2.4.4**: The system SHALL rate-limit organization creation to 10 per hour per SuperAdmin.

**NFR-2.4.5**: The system SHALL sanitize all text inputs to prevent XSS attacks.

**NFR-2.4.6**: The system SHALL implement Firestore security rules to prevent unauthorized data access.

**NFR-2.4.7**: The system SHALL hash passwords using bcrypt with cost factor 12.

**NFR-2.4.8**: The system SHALL encrypt sensitive PII (phone numbers, addresses) at rest.

### 2.5 Maintainability

**NFR-2.5.1**: The system SHALL have 85% code coverage for wizard components.

**NFR-2.5.2**: The system SHALL use TypeScript for type safety.

**NFR-2.5.3**: The system SHALL follow React best practices and hooks patterns.

**NFR-2.5.4**: The system SHALL have comprehensive JSDoc comments for complex functions.

**NFR-2.5.5**: The system SHALL use Zod schemas for validation logic reuse.

### 2.6 Scalability

**NFR-2.6.1**: The system SHALL support organizations with up to 20 floors.

**NFR-2.6.2**: The system SHALL support up to 100 rooms per floor.

**NFR-2.6.3**: The system SHALL support up to 500 devices per organization (Enterprise plan).

**NFR-2.6.4**: The system SHALL handle wizard state up to 5MB in size.

## 3. Data Requirements

### 3.1 Firestore Collections Schema

**DR-3.1.1**: The system SHALL create organizations collection with fields (id, name, email, password, plan, maxDevices, contactPerson, phoneNumber, address, city, state, zipCode, country, createdAt, createdBy, updatedAt, status).

**DR-3.1.2**: The system SHALL create departments collection with fields (id, organizationId, name, description, headOfDepartment, email, phoneNumber, budget, maxDevices, createdAt, updatedAt).

**DR-3.1.3**: The system SHALL create floorPlans collection with fields (id, organizationId, floorNumber, floorName, totalArea, description, rooms[], createdAt, updatedAt).

**DR-3.1.4**: The system SHALL create devices collection with fields (id, organizationId, name, type, roomId, floorId, manufacturer, model, serialNumber, status, createdAt, updatedAt).

**DR-3.1.5**: The system SHALL create roomTemplates collection (pre-populated with 15+ templates).

**DR-3.1.6**: The system SHALL create composite indexes on frequently queried fields (organizations.email, departments.organizationId, floorPlans.organizationId, devices.organizationId).

### 3.2 Data Validation

**DV-3.2.1**: Organization name: 3-100 characters, unique, alphanumeric with spaces.

**DV-3.2.2**: Email: Valid RFC 5322 format, unique across organizations.

**DV-3.2.3**: Password: Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.

**DV-3.2.4**: Phone number: Valid international format (E.164).

**DV-3.2.5**: Floor number: Positive integer, sequential, unique per organization.

**DV-3.2.6**: Room identifier: Format R{floor}{number}, unique per floor.

**DV-3.2.7**: Room dimensions: Width and height between 5-100 feet.

**DV-3.2.8**: Floor area: Positive number, sum of room areas ≤ floor area.

**DV-3.2.9**: Device allocation: Sum of department max devices ≤ organization max devices.

### 3.3 Data Integrity

**DI-3.3.1**: The system SHALL use Firestore batch writes for multi-collection inserts.

**DI-3.3.2**: The system SHALL handle batch write failures gracefully.

**DI-3.3.3**: The system SHALL validate referential integrity (devices reference valid rooms).

**DI-3.3.4**: The system SHALL implement Firestore security rules to prevent unauthorized access.

**DI-3.3.5**: The system SHALL maintain audit trail of all organization creations in Firestore.

## 4. Interface Requirements

### 4.1 User Interface

**UI-4.1.1**: The system SHALL use Radix UI components for accessibility.

**UI-4.1.2**: The system SHALL follow Tailwind CSS design system.

**UI-4.1.3**: The system SHALL use Lucide React icons consistently.

**UI-4.1.4**: The system SHALL provide loading states for async operations.

**UI-4.1.5**: The system SHALL use toast notifications for success/error messages.

**UI-4.1.6**: The system SHALL display validation errors inline near relevant fields.

**UI-4.1.7**: The system SHALL use color coding for room types matching 3D component.

### 4.2 API Interface

**API-4.2.1**: POST /api/superadmin/organizations/complete-setup
- Request: CompleteOrganizationSetup JSON
- Response: { success: boolean, organizationId: string, summary: object }
- Status: 201 Created, 400 Bad Request, 409 Conflict, 500 Internal Server Error

**API-4.2.2**: GET /api/superadmin/room-templates
- Request: None
- Response: { templates: RoomTemplate[], categories: string[] }
- Status: 200 OK, 500 Internal Server Error

**API-4.2.3**: POST /api/superadmin/validate-floor-plan
- Request: { floors: Floor[] }
- Response: FloorPlanValidationResult
- Status: 200 OK, 400 Bad Request, 500 Internal Server Error

### 4.3 Component Interface

**CI-4.3.1**: WizardContainer SHALL accept props: onComplete, onCancel.

**CI-4.3.2**: Each step component SHALL accept props: data, onChange, onNext, onBack, errors.

**CI-4.3.3**: RoomManagementStep SHALL accept additional prop: templates.

**CI-4.3.4**: ReviewConfirmationStep SHALL accept additional prop: isSubmitting.

## 5. Constraints

### 5.1 Technical Constraints

**TC-5.1.1**: The system SHALL use Next.js 15 framework.

**TC-5.1.2**: The system SHALL use React 18 for UI components.

**TC-5.1.3**: The system SHALL use TypeScript 5 for type safety.

**TC-5.1.4**: The system SHALL use Firebase Firestore for data storage.

**TC-5.1.5**: The system SHALL integrate with existing Simple3DFloorPlan component.

**TC-5.1.6**: The system SHALL use existing room templates library.

### 5.2 Business Constraints

**BC-5.2.1**: The system SHALL enforce plan-based device limits (Basic: 50, Pro: 150, Enterprise: 500).

**BC-5.2.2**: The system SHALL be accessible only to SuperAdmin role.

**BC-5.2.3**: The system SHALL create organizations in inactive state until first login.

**BC-5.2.4**: The system SHALL not allow modification of organization after creation (use separate edit feature).

### 5.3 Regulatory Constraints

**RC-5.3.1**: The system SHALL comply with GDPR for PII handling.

**RC-5.3.2**: The system SHALL provide data export functionality for organizations.

**RC-5.3.3**: The system SHALL support data deletion requests (right to be forgotten).

**RC-5.3.4**: The system SHALL log all data access for compliance auditing.

## 6. Acceptance Criteria

### 6.1 Functional Acceptance

**AC-6.1.1**: SuperAdmin can navigate through all 6 wizard steps.

**AC-6.1.2**: SuperAdmin can create organization with 3 floors, 15 rooms, 2 departments, 10 devices.

**AC-6.1.3**: All validation rules are enforced and display appropriate error messages.

**AC-6.1.4**: Created organization appears in SuperAdmin dashboard.

**AC-6.1.5**: Organization admin can log in with created credentials.

**AC-6.1.6**: 3D floor plan renders correctly with all floors, rooms, and devices.

**AC-6.1.7**: Room templates load and can be used to create rooms.

**AC-6.1.8**: Device allocation constraints are enforced.

**AC-6.1.9**: Room area constraints are enforced.

**AC-6.1.10**: Wizard state persists across browser refresh.

### 6.2 Performance Acceptance

**AC-6.2.1**: Step transitions complete in < 100ms (measured with Chrome DevTools).

**AC-6.2.2**: Complete submission completes in < 3 seconds for typical organization.

**AC-6.2.3**: Room template loading completes in < 500ms.

**AC-6.2.4**: Real-time validation responds in < 300ms.

### 6.3 Security Acceptance

**AC-6.3.1**: Non-SuperAdmin users cannot access wizard.

**AC-6.3.2**: Passwords are hashed in Firestore (not plaintext).

**AC-6.3.3**: Duplicate organization emails are rejected.

**AC-6.3.4**: Firestore security rules prevent unauthorized access.

**AC-6.3.5**: XSS attempts are sanitized.

### 6.4 Usability Acceptance

**AC-6.4.1**: SuperAdmin can complete wizard in 5-10 minutes.

**AC-6.4.2**: Error messages are clear and actionable.

**AC-6.4.3**: Progress indicator accurately reflects completion.

**AC-6.4.4**: UI is responsive on 1280px+ screens.

**AC-6.4.5**: Keyboard navigation works for all interactive elements.

## 7. Dependencies

### 7.1 Internal Dependencies

**ID-7.1.1**: Simple3DFloorPlan component (already implemented).

**ID-7.1.2**: Room templates library (already implemented).

**ID-7.1.3**: Firebase Firestore with existing collections (already implemented).

**ID-7.1.4**: Firebase Authentication for SuperAdmin (already implemented).

**ID-7.1.5**: Existing UI component library (Radix UI, Tailwind CSS).

### 7.2 External Dependencies

**ED-7.2.1**: React 18 (npm package).

**ED-7.2.2**: Next.js 15 (npm package).

**ED-7.2.3**: TypeScript 5 (npm package).

**ED-7.2.4**: React Hook Form 7 (npm package).

**ED-7.2.5**: Zod 3 (npm package).

**ED-7.2.6**: Firebase Admin SDK (npm package).

**ED-7.2.7**: bcrypt (npm package).

**ED-7.2.8**: Lucide React (npm package).

## 8. Assumptions

**AS-8.1**: SuperAdmin users have sufficient permissions to create organizations.

**AS-8.2**: Firebase Firestore has sufficient storage for organization data.

**AS-8.3**: Browser supports modern JavaScript features (ES2020+).

**AS-8.4**: Network connection is stable during wizard completion.

**AS-8.5**: Room templates library contains at least 15 templates.

**AS-8.6**: 3D Floor Plan component accepts data format specified in design.

**AS-8.7**: Organization admins will log in after creation to view 3D floor plan.

**AS-8.8**: SuperAdmin will not create more than 10 organizations per hour.

## 9. Risks

**R-9.1**: Risk: Large organizations (20 floors, 100 rooms/floor) may cause performance issues.
- Mitigation: Implement virtual scrolling and pagination.

**R-9.2**: Risk: Browser crashes may cause data loss during wizard completion.
- Mitigation: Implement auto-save every 30 seconds.

**R-9.3**: Risk: Firestore batch write failures may leave partial data.
- Mitigation: Use proper error handling and implement retry logic for failed batches.

**R-9.4**: Risk: 3D component may not render correctly with wizard-generated data.
- Mitigation: Comprehensive integration testing and data format validation.

**R-9.5**: Risk: Complex validation logic may have edge cases.
- Mitigation: Property-based testing to cover wide range of inputs.

**R-9.6**: Risk: API endpoint may timeout for large organizations.
- Mitigation: Implement request timeout handling and retry logic.

## 10. Future Enhancements

**FE-10.1**: Import floor plans from CAD files (DXF, DWG).

**FE-10.2**: Drag-and-drop room arrangement on visual floor plan.

**FE-10.3**: Real-time 3D preview during wizard completion.

**FE-10.4**: AI-powered room layout optimization.

**FE-10.5**: Template creation and sharing between SuperAdmins.

**FE-10.6**: Bulk organization import from CSV/Excel.

**FE-10.7**: Organization cloning feature.

**FE-10.8**: Advanced device configuration with network topology.

**FE-10.9**: Cost estimation based on plan and device count.

**FE-10.10**: Integration with external building management systems.
