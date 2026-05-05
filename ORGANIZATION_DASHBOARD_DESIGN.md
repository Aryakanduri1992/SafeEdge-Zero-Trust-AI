# Organization Dashboard - Enterprise Platform Design

## Overview
A comprehensive, enterprise-grade organization dashboard with modern UI/UX, featuring department management, security center, device management, profile settings, and 3D floor plan visualization.

---

## Design Principles

1. **Enterprise-Grade UI**: Professional, clean, and modern interface
2. **Intuitive Navigation**: Clear sidebar with icons and labels
3. **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
4. **Data-Driven**: Real-time statistics and visualizations
5. **Role-Based Access**: Different views for different user roles
6. **Consistent Branding**: Unified color scheme and typography

---

## Color Palette

### Primary Colors
- **Primary Blue**: `#1976D2` - Main actions, headers
- **Primary Dark**: `#0D47A1` - Hover states, emphasis
- **Primary Light**: `#42A5F5` - Backgrounds, accents

### Secondary Colors
- **Success Green**: `#4CAF50` - Online status, success messages
- **Warning Orange**: `#FF9800` - Warnings, pending states
- **Error Red**: `#F44336` - Errors, offline status, alerts
- **Info Cyan**: `#00BCD4` - Information, notifications

### Neutral Colors
- **Background**: `#F5F7FA` - Main background
- **Card Background**: `#FFFFFF` - Card surfaces
- **Border**: `#E0E0E0` - Dividers, borders
- **Text Primary**: `#212121` - Main text
- **Text Secondary**: `#757575` - Secondary text
- **Text Muted**: `#9E9E9E` - Disabled, hints

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (Fixed)                                 │
│  [Logo] [Org Name]              [Notifications] [Profile]   │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                  │
│  Sidebar │  Main Content Area                               │
│  (Fixed) │  (Scrollable)                                    │
│          │                                                  │
│  [Icon]  │  ┌────────────────────────────────────────────┐ │
│  Home    │  │  Page Header                               │ │
│          │  │  [Title] [Breadcrumb]        [Actions]     │ │
│  [Icon]  │  └────────────────────────────────────────────┘ │
│  Depts   │                                                  │
│          │  ┌────────────────────────────────────────────┐ │
│  [Icon]  │  │  Statistics Cards (4 columns)              │ │
│  Devices │  │  [Card] [Card] [Card] [Card]               │ │
│          │  └────────────────────────────────────────────┘ │
│  [Icon]  │                                                  │
│  Floors  │  ┌────────────────────────────────────────────┐ │
│          │  │  Main Content Section                      │ │
│  [Icon]  │  │  (Tables, Charts, 3D View, etc.)           │ │
│  Security│  │                                            │ │
│          │  │                                            │ │
│  [Icon]  │  └────────────────────────────────────────────┘ │
│  Reports │                                                  │
│          │                                                  │
│  [Icon]  │                                                  │
│  Settings│                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Navigation Structure

### Sidebar Menu Items

1. **🏠 Dashboard** (Home)
   - Overview statistics
   - Quick actions
   - Recent activity
   - System health

2. **🏢 Departments**
   - List all departments
   - Add/Edit/Delete departments
   - Department details
   - Department analytics

3. **📱 Devices**
   - Device inventory
   - Add new device (with floor/room/department selection)
   - Device status monitoring
   - Device configuration
   - Device analytics

4. **🏗️ Floor Plans**
   - 3D Floor Plan Visualization
   - Floor management
   - Room management
   - Space utilization

5. **🛡️ Security Center**
   - Real-time alerts
   - Security events log
   - Threat detection
   - Access control
   - Compliance status

6. **📊 Reports**
   - Usage reports
   - Performance metrics
   - Custom reports
   - Export data

7. **⚙️ Settings**
   - Organization profile
   - User management
   - Preferences
   - Integrations
   - Billing

8. **👤 Profile** (Bottom)
   - User profile
   - Change password
   - Notifications settings
   - Logout

---

## Page Designs

### 1. Dashboard (Home) Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                    [Date Range ▼] │
│  Welcome back, [User Name]                                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📊 Total     │ 🏢 Active    │ 📱 Devices   │ ⚠️ Alerts    │
│ Departments  │ Floors       │ Online       │ Active       │
│ 12           │ 8            │ 245/280      │ 3            │
│ +2 this week │ 45 rooms     │ 87.5%        │ View All →   │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────┬─────────────────────────┐
│  System Health                  │  Recent Activity        │
│  ┌───────────────────────────┐  │  • Device D-245 online  │
│  │ [Donut Chart]             │  │    2 mins ago           │
│  │ - CPU: 45%                │  │  • Alert resolved       │
│  │ - Memory: 62%             │  │    15 mins ago          │
│  │ - Network: 78%            │  │  • New device added     │
│  │ - Storage: 34%            │  │    1 hour ago           │
│  └───────────────────────────┘  │  • User logged in       │
│                                 │    2 hours ago          │
└─────────────────────────────────┴─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Quick Actions                                              │
│  [+ Add Device] [+ Add Department] [View Reports] [Settings]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Device Status by Floor                                     │
│  [Bar Chart showing online/offline devices per floor]       │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Departments Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Departments                              [+ Add Department] │
│  Manage your organization's departments                      │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📊 Total     │ 👥 Total     │ 📱 Total     │ 📈 Avg       │
│ Departments  │ Employees    │ Devices      │ Utilization  │
│ 12           │ 450          │ 280          │ 78%          │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Search...] [Filter: All ▼] [Sort: Name ▼]                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Department Cards (Grid Layout)                             │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 💼 IT Department │  │ 💰 Finance Dept  │               │
│  │ Head: John Doe   │  │ Head: Jane Smith │               │
│  │ 📧 it@org.com    │  │ 📧 fin@org.com   │               │
│  │ 📱 45 devices    │  │ 📱 32 devices    │               │
│  │ 🏢 Floor 2-3     │  │ 🏢 Floor 1       │               │
│  │ [View] [Edit]    │  │ [View] [Edit]    │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 📊 Sales Dept    │  │ 🎨 Marketing     │               │
│  │ ...              │  │ ...              │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. Devices Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Devices                                      [+ Add Device] │
│  Monitor and manage all IoT devices                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📱 Total     │ ✅ Online    │ ❌ Offline   │ ⚠️ Warning   │
│ Devices      │ Devices      │ Devices      │ Status       │
│ 280          │ 245 (87.5%)  │ 35 (12.5%)   │ 8            │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Search...] [Floor: All ▼] [Room: All ▼] [Dept: All ▼]    │
│  [Status: All ▼] [Type: All ▼]                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Device Table                                               │
│  ┌──────┬────────┬──────┬──────┬──────┬──────┬─────────┐  │
│  │ ●    │ Name   │ Type │ Floor│ Room │ Dept │ Actions │  │
│  ├──────┼────────┼──────┼──────┼──────┼──────┼─────────┤  │
│  │ 🟢   │ D-001  │ Cam  │ F1   │ R101 │ IT   │ [⋮]     │  │
│  │ 🟢   │ D-002  │ Sens │ F1   │ R102 │ IT   │ [⋮]     │  │
│  │ 🔴   │ D-003  │ Cam  │ F2   │ R201 │ HR   │ [⋮]     │  │
│  │ 🟢   │ D-004  │ Lock │ F2   │ R202 │ Fin  │ [⋮]     │  │
│  │ 🟡   │ D-005  │ Sens │ F3   │ R301 │ IT   │ [⋮]     │  │
│  └──────┴────────┴──────┴──────┴──────┴──────┴─────────┘  │
│  [Pagination: 1 2 3 ... 10]                                │
└─────────────────────────────────────────────────────────────┘
```

#### Add Device Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Add New Device                                         [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Device Information                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Device Name *                                       │   │
│  │ [Enter device name...]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Device Type *                                       │   │
│  │ [Select type ▼] (Camera, Sensor, Lock, etc.)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Location Assignment                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Department *                                        │   │
│  │ [Select department ▼] (IT, Finance, HR, etc.)      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Floor *                                             │   │
│  │ [Select floor ▼] (Floor 1, Floor 2, etc.)          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Room *                                              │   │
│  │ [Select room ▼] (R101, R102, etc.)                 │   │
│  │ (Filtered based on selected floor)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Device Configuration (Optional)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Manufacturer                                        │   │
│  │ [Enter manufacturer...]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Model                                               │   │
│  │ [Enter model...]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MAC Address                                         │   │
│  │ [Enter MAC address...]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ IP Address                                          │   │
│  │ [Enter IP address...]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Notes                                               │   │
│  │ [Enter additional notes...]                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]                              [Add Device]         │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Floor Plans Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Floor Plans                                                 │
│  3D visualization of your building layout                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🏢 Total     │ 🚪 Total     │ 📏 Total     │ 📱 Devices   │
│ Floors       │ Rooms        │ Area         │ Deployed     │
│ 8            │ 145          │ 45,000 sq ft │ 280          │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [3D Floor Plan Component - Already Implemented]            │
│  (Keep existing 3D visualization here)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Floor Details                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Floor 1 - Ground Floor                               │  │
│  │ 📏 5,500 sq ft  |  🚪 18 rooms  |  📱 35 devices     │  │
│  │ [View Details] [Edit Layout]                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Floor 2 - First Floor                                │  │
│  │ 📏 5,500 sq ft  |  🚪 20 rooms  |  📱 42 devices     │  │
│  │ [View Details] [Edit Layout]                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Security Center Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Security Center                          [🔔 Notifications] │
│  Real-time security monitoring and alerts                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🛡️ Security  │ ⚠️ Active    │ ✅ Resolved  │ 📊 Threat    │
│ Score        │ Alerts       │ Today        │ Level        │
│ 94/100       │ 3            │ 12           │ LOW          │
│ Excellent    │ View All →   │ +2 vs yest.  │ 🟢           │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────┬─────────────────────────┐
│  Active Alerts                  │  Security Events        │
│  ┌───────────────────────────┐  │  [Line Chart]           │
│  │ ⚠️ HIGH PRIORITY          │  │  Last 7 days            │
│  │ Unauthorized access       │  │  - Alerts: 45           │
│  │ Floor 2, Room 201         │  │  - Access: 1,234        │
│  │ 5 mins ago                │  │  - Threats: 2           │
│  │ [Investigate] [Dismiss]   │  │                         │
│  └───────────────────────────┘  └─────────────────────────┘
│  ┌───────────────────────────┐                            │
│  │ ⚠️ MEDIUM PRIORITY        │  ┌─────────────────────────┐
│  │ Device offline            │  │  Compliance Status      │
│  │ Floor 3, Room 305         │  │  ✅ GDPR Compliant      │
│  │ 15 mins ago               │  │  ✅ ISO 27001           │
│  │ [Investigate] [Dismiss]   │  │  ✅ SOC 2               │
│  └───────────────────────────┘  │  ⚠️ HIPAA (Review)      │
│                                 └─────────────────────────┘
└─────────────────────────────────┴─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Recent Security Events                                     │
│  ┌──────┬────────────┬──────────┬──────────┬───────────┐  │
│  │ Time │ Event Type │ Location │ Severity │ Status    │  │
│  ├──────┼────────────┼──────────┼──────────┼───────────┤  │
│  │ 14:32│ Access     │ F2-R201  │ High     │ Active    │  │
│  │ 14:15│ Device Off │ F3-R305  │ Medium   │ Active    │  │
│  │ 13:45│ Login      │ Admin    │ Low      │ Resolved  │  │
│  │ 13:20│ Alert      │ F1-R105  │ Low      │ Resolved  │  │
│  └──────┴────────────┴──────────┴──────────┴───────────┘  │
│  [Load More]                                                │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Profile/Settings Page

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
│  Manage your organization and account settings               │
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────┐
│              │                                              │
│  Tabs:       │  Organization Profile                        │
│              │                                              │
│  [Profile]   │  ┌────────────────────────────────────────┐ │
│   General    │  │ Organization Name *                    │ │
│   Security   │  │ [Acme Corporation]                     │ │
│   Billing    │  └────────────────────────────────────────┘ │
│   Users      │                                              │
│   Integr.    │  ┌────────────────────────────────────────┐ │
│              │  │ Contact Email *                        │ │
│              │  │ [contact@acme.com]                     │ │
│              │  └────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌────────────────────────────────────────┐ │
│              │  │ Contact Person *                       │ │
│              │  │ [John Doe]                             │ │
│              │  └────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌────────────────────────────────────────┐ │
│              │  │ Phone Number *                         │ │
│              │  │ [+1 (555) 123-4567]                    │ │
│              │  └────────────────────────────────────────┘ │
│              │                                              │
│              │  Address                                     │
│              │  ┌────────────────────────────────────────┐ │
│              │  │ Street Address                         │ │
│              │  │ [123 Main Street]                      │ │
│              │  └────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌──────────┬──────────┬──────────────────┐ │
│              │  │ City     │ State    │ ZIP Code         │ │
│              │  │ [NYC]    │ [NY]     │ [10001]          │ │
│              │  └──────────┴──────────┴──────────────────┘ │
│              │                                              │
│              │  [Cancel]              [Save Changes]        │
└──────────────┴──────────────────────────────────────────────┘
```

---

## Component Specifications

### Top Navigation Bar
- **Height**: 64px
- **Background**: White with subtle shadow
- **Elements**:
  - Logo (left): 40x40px
  - Organization name (left): Bold, 18px
  - Notifications icon (right): Bell icon with badge
  - Profile dropdown (right): Avatar + name + dropdown

### Sidebar
- **Width**: 240px (expanded), 64px (collapsed)
- **Background**: Dark gradient (#1a1a2e to #16213e)
- **Text Color**: White/Light gray
- **Active Item**: Primary blue background
- **Hover**: Lighter background
- **Icons**: 24x24px, consistent style

### Statistics Cards
- **Layout**: 4 columns on desktop, 2 on tablet, 1 on mobile
- **Height**: 120px
- **Background**: White with subtle shadow
- **Border Radius**: 8px
- **Icon**: 32x32px, colored
- **Value**: Bold, 32px
- **Label**: Regular, 14px, muted color

### Data Tables
- **Header**: Bold, uppercase, 12px, muted color
- **Row Height**: 56px
- **Hover**: Light gray background
- **Borders**: Subtle, light gray
- **Actions**: Icon buttons (Edit, Delete, View)

### Buttons
- **Primary**: Blue background, white text, 36px height
- **Secondary**: White background, blue border, blue text
- **Danger**: Red background, white text
- **Border Radius**: 6px
- **Padding**: 12px 24px

### Modals/Dialogs
- **Max Width**: 600px
- **Background**: White
- **Overlay**: Semi-transparent dark
- **Border Radius**: 12px
- **Padding**: 24px

---

## Responsive Breakpoints

- **Desktop**: ≥1280px (Full layout)
- **Laptop**: 1024px - 1279px (Adjusted spacing)
- **Tablet**: 768px - 1023px (Collapsed sidebar, 2-column cards)
- **Mobile**: <768px (Hidden sidebar, 1-column layout)

---

## Key Features

### 1. Add Device Flow
1. Click "+ Add Device" button
2. Modal opens with form
3. Select Department (dropdown populated from Firestore)
4. Select Floor (dropdown populated from Firestore)
5. Select Room (dropdown filtered by selected floor)
6. Fill device details
7. Submit → Device added to Firestore with location references

### 2. Department Management
- View all departments in card grid
- Click department to see details
- Edit department information
- View devices assigned to department
- View floors/rooms associated with department

### 3. Security Center
- Real-time alert monitoring
- Security event log
- Threat level indicator
- Compliance status dashboard
- Quick action buttons for alerts

### 4. Profile Management
- Edit organization details
- Manage users and roles
- Change password
- Notification preferences
- Billing information

---

## Data Flow

### Device Addition
```
User Input → Validation → Firestore Collections:
  - devices/{deviceId}
  - departments/{deptId}/devices (reference)
  - floorPlans/{floorId}/rooms/{roomId}/devices (reference)
```

### Dashboard Data
```
Firestore → API Routes → Dashboard Components:
  - /api/org-data (existing)
  - /api/devices (new)
  - /api/departments (new)
  - /api/security/alerts (new)
```

---

## Implementation Priority

### Phase 1: Core Structure
1. ✅ 3D Floor Plan (Already done)
2. New sidebar navigation
3. Top navigation bar
4. Dashboard home page layout

### Phase 2: Device Management
1. Devices page with table
2. Add device modal with dropdowns
3. Device detail view
4. Device edit/delete functionality

### Phase 3: Department Management
1. Departments page with cards
2. Department detail view
3. Department analytics

### Phase 4: Security Center
1. Security dashboard
2. Alerts system
3. Event logging
4. Compliance tracking

### Phase 5: Settings & Profile
1. Organization profile page
2. User management
3. Settings pages

---

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui
- **3D Visualization**: Three.js (existing)
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context/Hooks

---

## Next Steps

1. Review and approve this design
2. Create implementation spec
3. Build components phase by phase
4. Test and iterate
5. Deploy

---

**Status**: ✅ Design Complete - Awaiting Approval
