# Firestore Data Structure

All application data is now stored in and fetched from Firestore. No hardcoded or random data is used.

## Circular Buffer Implementation

All time-series collections (activities, alerts, notifications) implement a circular buffer with a maximum of 200 entries per organization. When the limit is reached, the oldest entries are automatically deleted to maintain the limit.

**Collections with 200 entry limit:**
- `activities` - 200 max per organization
- `alerts` - 200 max per organization  
- `notifications` - 200 max per organization

## Collections

### 1. `organizations`
Stores organization information.

```javascript
{
  id: "org-123",
  name: "My University",
  email: "admin@university.edu",
  phoneNumber: "+1234567890",
  contactPerson: "John Doe",
  plan: "enterprise",
  maxDevices: 100,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### 2. `devices`
Stores device information for each organization.

```javascript
{
  id: "device-123",
  organizationId: "org-123",
  name: "Device D-245",
  status: "online", // or "offline"
  type: "sensor",
  departmentId: "dept-123",
  floorId: "floor-123",
  roomId: "room-123",
  lastSeen: "2024-01-01T12:00:00.000Z"
}
```

### 3. `activities`
Stores recent activities for the dashboard (max 200 per organization).

```javascript
{
  id: "activity-123",
  organizationId: "org-123",
  type: "device", // device, security, department, floor, alert, system
  message: "Device D-245 came online",
  metadata: {
    deviceId: "D-245",
    action: "online"
  },
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

**Activity Types:**
- `device`: Device-related activities (online, offline, added, removed)
- `security`: Security-related activities (alerts, threats, resolutions)
- `department`: Department changes (created, updated, deleted)
- `floor`: Floor plan changes (created, updated, deleted)
- `alert`: Alert-related activities
- `system`: System-level activities

**Circular Buffer:** When 200 activities exist for an organization, adding a new one automatically deletes the oldest entry.

### 4. `alerts`
Stores active and resolved alerts (max 200 per organization).

```javascript
{
  id: "alert-123",
  organizationId: "org-123",
  severity: "high", // low, medium, high, critical
  title: "Unauthorized Access Attempt",
  message: "Multiple failed login attempts detected on device D-245",
  deviceId: "D-245",
  status: "active", // active, resolved
  timestamp: "2024-01-01T12:00:00.000Z",
  resolvedAt: null // or timestamp when resolved
}
```

**Circular Buffer:** When 200 alerts exist for an organization, adding a new one automatically deletes the oldest entry.

### 5. `notifications`
Stores notifications (max 200 per organization).

```javascript
{
  id: "notif-123",
  organizationId: "org-123",
  title: "New Device Added",
  message: "Device D-245 has been added to Floor 2",
  type: "info", // info, warning, error, success
  read: false,
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

**Circular Buffer:** When 200 notifications exist for an organization, adding a new one automatically deletes the oldest entry.

### 6. `reports`
Stores generated reports (max 200 per organization).

```javascript
{
  id: "report-123",
  organizationId: "org-123",
  title: "Device Usage Report",
  type: "device-usage", // device-usage, monthly-summary, security-audit, custom
  description: "Comprehensive device usage analysis for the last 30 days",
  fileUrl: "https://example.com/reports/device-usage-2026-04.pdf",
  metadata: {
    period: "last-30-days",
    totalDevices: 45,
    activeDevices: 42
  },
  generatedAt: "2024-01-01T12:00:00.000Z",
  status: "completed" // pending, processing, completed, failed
}
```

**Report Types:**
- `device-usage`: Device performance and usage reports
- `monthly-summary`: Monthly organizational summaries
- `security-audit`: Security assessment reports
- `custom`: Custom generated reports

**Circular Buffer:** When 200 reports exist for an organization, adding a new one automatically deletes the oldest entry.

### 7. `securityMetrics`
Stores daily security metrics.

```javascript
{
  id: "org-123_2024-01-01",
  organizationId: "org-123",
  date: "2024-01-01",
  metrics: {
    securityScore: 85, // 0-100
    threatsDetected: 5,
    threatsBlocked: 5,
    vulnerabilities: 2
  }
}
```

### 7. `networkMetrics`
Stores current network status for each organization.

```javascript
{
  id: "org-123", // document ID is organizationId
  status: 95, // 0-100 percentage
  lastUpdated: "2024-01-01T12:00:00.000Z",
  latency: 25.5, // milliseconds
  packetLoss: 0.5 // percentage
}
```

### 8. `departments`
Stores department information.

```javascript
{
  id: "dept-123",
  organizationId: "org-123",
  name: "Emergency Department",
  description: "Emergency care services",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### 9. `floors`
Stores floor plan information.

```javascript
{
  id: "floor-123",
  organizationId: "org-123",
  name: "Floor 1",
  departmentId: "dept-123",
  rooms: [...],
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## API Endpoints

### Activities
- `GET /api/activities?organizationId=xxx&limit=10` - Fetch recent activities
- `POST /api/activities` - Create new activity

### Alerts
- `GET /api/alerts?organizationId=xxx&status=active` - Fetch alerts
- `POST /api/alerts` - Create new alert
- `PATCH /api/alerts` - Update alert status

### System Health
- `GET /api/system-health?organizationId=xxx` - Fetch system health metrics

### Notifications
- `GET /api/notifications?organizationId=xxx` - Fetch notifications
- `POST /api/notifications` - Create new notification
- `PATCH /api/notifications` - Mark notification as read

## Data Flow

1. **Dashboard loads** → Fetches data from Firestore via API endpoints
2. **User actions** → Create/update data in Firestore
3. **Background services** → Update metrics (network status, security scores)
4. **Real-time updates** → Poll APIs every 30 seconds for notifications

## System Health Calculations

- **Device Connectivity**: `(onlineDevices / totalDevices) * 100`
- **Network Status**: Fetched from `networkMetrics` collection (updated by monitoring service)
- **Security Score**: Fetched from `securityMetrics` collection (updated daily)
- **Storage Usage**: `(totalDevices / maxDevices) * 100`

## No Random or Hardcoded Data

All data displayed in the application comes from Firestore:
- ✅ Activities - fetched from `activities` collection
- ✅ Alerts count - fetched from `alerts` collection
- ✅ Network status - fetched from `networkMetrics` collection
- ✅ Security score - fetched from `securityMetrics` collection
- ✅ Device statistics - calculated from `devices` collection
- ✅ Organization info - fetched from `organizations` collection

## Testing

Use the provided scripts in the `scripts/` folder to add sample data:
- `add-sample-activity.js` - Add activities
- `add-sample-alert.js` - Add alerts
- `update-network-status.js` - Update network metrics
