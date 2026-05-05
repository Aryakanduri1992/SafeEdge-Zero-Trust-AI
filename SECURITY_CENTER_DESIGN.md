# Security Center - Enterprise Design & Implementation Plan

## Overview
A professional, enterprise-grade security monitoring dashboard with real-time alerts, event logging, and compliance tracking. All data stored in Firebase Firestore with automatic rotation at 150 entries.

**Design Inspiration**: Tarvlume.com - Elegant, sophisticated color scheme with navy and gold accents on white background.

**Brand Colors**:
- Primary Navy: `#242d53` - Professional, trustworthy, secure
- Primary Gold: `#d3b78f` - Premium, elegant, sophisticated
- White Background: Clean, modern, spacious

---

## Visual Design Reference

### Tarvlume.com Inspiration
The design takes inspiration from tarvlume.com's elegant and sophisticated aesthetic:
- **Navy (#242d53)**: Used for headers, primary buttons, main text, and navigation
- **Gold (#d3b78f)**: Used for accents, highlights, hover states, and secondary elements
- **White Background**: Clean, spacious layout with ample whitespace
- **Typography**: Clean, modern sans-serif fonts
- **Spacing**: Generous padding and margins for breathing room
- **Shadows**: Subtle, soft shadows for depth
- **Borders**: Minimal, elegant borders in gold or navy

### Design Characteristics
1. **Sophisticated**: Navy and gold create a premium, professional feel
2. **Clean**: White background with minimal clutter
3. **Elegant**: Subtle animations and transitions
4. **Modern**: Contemporary UI patterns and components
5. **Trustworthy**: Navy conveys security and reliability

---

## Design Principles

### Visual Design
1. **Professional Color Scheme**: Dark accents with status-based colors
2. **Clear Hierarchy**: Important alerts stand out
3. **Real-time Updates**: Live data from Firebase
4. **Data Visualization**: Charts and graphs for trends
5. **Empty States**: Elegant zero-data displays

### Color Palette (Inspired by Tarvlume.com)

#### Primary Brand Colors
- **Primary Navy**: `#242d53` - Main brand color, headers, primary buttons
- **Primary Gold**: `#d3b78f` - Accent color, highlights, secondary buttons
- **White**: `#FFFFFF` - Main background, card backgrounds

#### Status Colors (Adjusted to match brand)
- **Critical**: `#8B2635` (Deep Red) - Immediate action required
- **High**: `#C17A3A` (Warm Orange) - Urgent attention needed
- **Medium**: `#D4A574` (Soft Gold) - Monitor closely
- **Low**: `#5B6B8F` (Muted Blue) - Informational
- **Success**: `#6B8E6F` (Sage Green) - Resolved/Normal
- **Info**: `#7A8BA3` (Slate Blue) - System information

#### Background Colors
- **Primary Background**: `#FFFFFF` (White)
- **Secondary Background**: `#F8F9FA` (Off-white)
- **Card Background**: `#FFFFFF` with subtle shadow
- **Navy Accent BG**: `#242d53` with 5% opacity `rgba(36, 45, 83, 0.05)`
- **Gold Accent BG**: `#d3b78f` with 10% opacity `rgba(211, 183, 143, 0.1)`
- **Alert Critical BG**: `rgba(139, 38, 53, 0.08)`
- **Alert High BG**: `rgba(193, 122, 58, 0.08)`
- **Alert Medium BG**: `rgba(212, 165, 116, 0.1)`
- **Alert Low BG**: `rgba(91, 107, 143, 0.08)`
- **Success BG**: `rgba(107, 142, 111, 0.08)`

#### Text Colors
- **Primary Text**: `#242d53` (Navy)
- **Secondary Text**: `#5B6B8F` (Muted Navy)
- **Muted Text**: `#9CA3AF` (Gray)
- **Gold Text**: `#d3b78f` (Gold accent)

#### Gradient Colors
- **Navy Gradient**: `linear-gradient(135deg, #242d53 0%, #3a4570 100%)`
- **Gold Gradient**: `linear-gradient(135deg, #d3b78f 0%, #c9a876 100%)`
- **Hero Gradient**: `linear-gradient(135deg, #242d53 0%, #d3b78f 100%)`

---

## Color Usage Guide

### Primary Navy (#242d53)
**Use for**:
- Page headers and titles
- Primary buttons
- Navigation elements
- Main text content
- Icons (primary)
- Borders (primary)
- Sidebar background

**Examples**:
```css
.header { background: #242d53; color: white; }
.btn-primary { background: #242d53; color: #d3b78f; }
.text-primary { color: #242d53; }
```

### Primary Gold (#d3b78f)
**Use for**:
- Accent elements
- Hover states
- Secondary buttons
- Highlights and badges
- Links
- Icons (accent)
- Progress indicators
- Active states

**Examples**:
```css
.btn-secondary { background: #d3b78f; color: #242d53; }
.link { color: #d3b78f; }
.badge { background: #d3b78f; color: white; }
.btn-primary:hover { background: #242d53; border: 2px solid #d3b78f; }
```

### White (#FFFFFF)
**Use for**:
- Main page background
- Card backgrounds
- Modal backgrounds
- Text on dark backgrounds
- Input fields

**Examples**:
```css
body { background: #FFFFFF; }
.card { background: #FFFFFF; box-shadow: 0 2px 8px rgba(36, 45, 83, 0.1); }
```

### Status Colors
**Critical (#8B2635)**: Urgent security threats
**High (#C17A3A)**: Important alerts requiring attention
**Medium (#D4A574)**: Moderate priority items
**Low (#5B6B8F)**: Informational notices
**Success (#6B8E6F)**: Resolved items, positive states

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Security Center                    [🔔 Notifications] [⚙️]  │
│  Real-time security monitoring                              │
└─────────────────────────────────────────────────────────────┘
   ↑ Navy background (#242d53) with white text

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🛡️ Security  │ ⚠️ Active    │ ✅ Resolved  │ 📊 Events    │
│ Score        │ Alerts       │ Today        │ (24h)        │
│ 94/100       │ 3            │ 12           │ 156          │
│ Excellent ↑  │ View All →   │ +2 vs yest.  │ +12 vs yest. │
└──────────────┴──────────────┴──────────────┴──────────────┘
   ↑ White cards with navy text, gold accents on hover

┌─────────────────────────────────┬─────────────────────────┐
│  Critical Alerts (Real-time)    │  Security Trends        │
│  ┌───────────────────────────┐  │  [Line Chart]           │
│  │ 🔴 CRITICAL               │  │  Navy and gold lines    │
│  │ Unauthorized Access       │  │  Last 7 days            │
│  │ Floor 2, Room 201         │  │  - Critical: 2          │
│  │ 2 mins ago                │  │  - High: 8              │
│  │ [Investigate] [Dismiss]   │  │  - Medium: 15           │
│  └───────────────────────────┘  │  - Low: 45              │
│  ↑ Red tint background          │  - Resolved: 89         │
│    Navy text, gold buttons      │                         │
│                                 │  Threat Distribution    │
│  High Priority Alerts           │  [Donut Chart]          │
│  [List of high priority]        │  Navy and gold colors   │
└─────────────────────────────────┴─────────────────────────┘
   ↑ White background, navy borders, gold accents

┌─────────────────────────────────────────────────────────────┐
│  Recent Security Events (Last 150)                          │
│  [Filters: All | Critical | High | Medium | Low]            │
│  [Search events...]                                         │
│  ┌──────┬────────────┬──────────┬──────────┬───────────┐  │
│  │ Time │ Event Type │ Location │ Severity │ Status    │  │
│  ├──────┼────────────┼──────────┼──────────┼───────────┤  │
│  │ 14:32│ Access     │ F2-R201  │ Critical │ Active    │  │
│  │ 14:15│ Device Off │ F3-R305  │ High     │ Active    │  │
│  │ 13:45│ Login      │ Admin    │ Low      │ Resolved  │  │
│  └──────┴────────────┴──────────┴──────────┴───────────┘  │
│  Showing 1-50 of 150 events                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Compliance Dashboard                                       │
│  [4 compliance cards with status indicators]                │
└─────────────────────────────────────────────────────────────┘
```

---

## Firebase Data Structure

### Collections

#### 1. `securityEvents` Collection
```javascript
{
  id: "auto-generated",
  organizationId: "org-id",
  eventType: "unauthorized_access" | "device_offline" | "login_attempt" | 
             "suspicious_activity" | "system_alert" | "compliance_issue",
  severity: "critical" | "high" | "medium" | "low",
  status: "active" | "investigating" | "resolved" | "dismissed",
  title: "Unauthorized Access Attempt",
  description: "Multiple failed login attempts detected",
  location: {
    floorId: "floor-id",
    floorNumber: 2,
    roomId: "room-id",
    roomName: "R201"
  },
  deviceId: "device-id" (optional),
  userId: "user-id" (optional),
  metadata: {
    ipAddress: "192.168.1.100",
    attempts: 5,
    source: "camera" | "sensor" | "system" | "manual"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp (optional),
  resolvedBy: "user-id" (optional),
  notes: "Investigation notes"
}
```

#### 2. `securityMetrics` Collection (Daily Aggregates)
```javascript
{
  id: "org-id_YYYY-MM-DD",
  organizationId: "org-id",
  date: "2026-04-07",
  metrics: {
    totalEvents: 156,
    criticalCount: 2,
    highCount: 8,
    mediumCount: 15,
    lowCount: 45,
    resolvedCount: 89,
    activeCount: 3,
    securityScore: 94,
    threatLevel: "low" | "medium" | "high" | "critical"
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 3. `complianceStatus` Collection
```javascript
{
  id: "org-id_compliance-type",
  organizationId: "org-id",
  complianceType: "gdpr" | "iso27001" | "soc2" | "hipaa",
  status: "compliant" | "review_required" | "non_compliant",
  lastAuditDate: Timestamp,
  nextAuditDate: Timestamp,
  certificationExpiry: Timestamp (optional),
  issues: [
    {
      id: "issue-id",
      title: "Data retention policy",
      severity: "medium",
      status: "open" | "resolved"
    }
  ],
  score: 95,
  updatedAt: Timestamp
}
```

---

## Data Management Strategy

### 150 Entry Limit with Rotation

#### Strategy: FIFO (First In, First Out)
When adding a new event and count >= 150:
1. Query oldest event by `createdAt`
2. Delete oldest event
3. Add new event
4. Maintain exactly 150 events

#### Implementation Approach
```javascript
async function addSecurityEvent(eventData) {
  const eventsRef = firestore.collection('securityEvents');
  
  // Count current events for this organization
  const countSnapshot = await eventsRef
    .where('organizationId', '==', eventData.organizationId)
    .count()
    .get();
  
  const currentCount = countSnapshot.data().count;
  
  // If at or over limit, delete oldest
  if (currentCount >= 150) {
    const oldestSnapshot = await eventsRef
      .where('organizationId', '==', eventData.organizationId)
      .orderBy('createdAt', 'asc')
      .limit(1)
      .get();
    
    if (!oldestSnapshot.empty) {
      await oldestSnapshot.docs[0].ref.delete();
    }
  }
  
  // Add new event
  await eventsRef.add({
    ...eventData,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
}
```

### Archiving Strategy (Optional)
Before deleting, optionally archive to `securityEventsArchive` collection:
```javascript
// Archive before deletion
await firestore.collection('securityEventsArchive').add({
  ...oldestEvent.data(),
  archivedAt: FieldValue.serverTimestamp()
});
```

---

## UI Components Design

### 1. Statistics Cards

#### Security Score Card
```
┌─────────────────────────────────┐
│ 🛡️ Security Score              │
│                                 │
│      94/100                     │
│   ████████████░░                │
│                                 │
│ Excellent ↑ +2 this week        │
│ [View Details]                  │
└─────────────────────────────────┘
```

**Colors**:
- Score 90-100: Gold gradient (#d3b78f to #c9a876)
- Score 70-89: Navy gradient (#242d53 to #3a4570)
- Score 50-69: Warm orange (#C17A3A)
- Score 0-49: Deep red (#8B2635)
- Card Background: White with navy border
- Text: Navy (#242d53)

#### Active Alerts Card
```
┌─────────────────────────────────┐
│ ⚠️ Active Alerts                │
│                                 │
│         3                       │
│                                 │
│ 🔴 1 Critical                   │
│ 🟠 2 High Priority              │
│ [View All Alerts →]             │
└─────────────────────────────────┘
```

### 2. Alert Cards

#### Critical Alert
```
┌─────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL ALERT                    [⋮ Actions]        │
├─────────────────────────────────────────────────────────┤
│ Unauthorized Access Attempt                             │
│ Multiple failed login attempts from unknown IP          │
│                                                         │
│ 📍 Location: Floor 2, Room 201                          │
│ 🕐 Time: 2 minutes ago (14:32)                          │
│ 🔗 Device: Camera-201                                   │
│ 🌐 IP: 192.168.1.100                                    │
│                                                         │
│ [🔍 Investigate] [✓ Mark Resolved] [✕ Dismiss]         │
└─────────────────────────────────────────────────────────┘
```

**Background**: `rgba(139, 38, 53, 0.08)` (Deep red tint)
**Border**: `#8B2635` (Deep red)
**Icon**: `#8B2635` (Deep red)
**Text**: `#242d53` (Navy)
**Buttons**: Navy background with gold hover

#### High Priority Alert
```
┌─────────────────────────────────────────────────────────┐
│ 🟠 HIGH PRIORITY                     [⋮ Actions]        │
├─────────────────────────────────────────────────────────┤
│ Device Offline                                          │
│ Security camera has been offline for 15 minutes         │
│                                                         │
│ 📍 Location: Floor 3, Room 305                          │
│ 🕐 Time: 15 minutes ago (14:17)                         │
│ 🔗 Device: Camera-305                                   │
│                                                         │
│ [🔍 Investigate] [✓ Mark Resolved] [✕ Dismiss]         │
└─────────────────────────────────────────────────────────┘
```

**Background**: `rgba(193, 122, 58, 0.08)` (Warm orange tint)
**Border**: `#C17A3A` (Warm orange)
**Icon**: `#C17A3A` (Warm orange)
**Text**: `#242d53` (Navy)
**Buttons**: Navy background with gold hover

### 3. Events Table

```
┌─────────────────────────────────────────────────────────────┐
│ Recent Security Events                                      │
│ [🔍 Search...] [Filter: All ▼] [Severity: All ▼] [Export]  │
├──────┬────────────────┬──────────┬──────────┬──────────────┤
│ Time │ Event          │ Location │ Severity │ Status       │
├──────┼────────────────┼──────────┼──────────┼──────────────┤
│ 14:32│ 🔴 Unauth Acc  │ F2-R201  │ Critical │ 🔴 Active    │
│ 14:17│ 🟠 Device Off  │ F3-R305  │ High     │ 🟠 Active    │
│ 13:45│ 🔵 Login       │ Admin    │ Low      │ ✅ Resolved  │
│ 13:20│ 🟡 Suspicious  │ F1-Lobby │ Medium   │ 🔍 Investig. │
│ 12:55│ 🔵 System      │ Server   │ Low      │ ✅ Resolved  │
└──────┴────────────────┴──────────┴──────────┴──────────────┘
Showing 1-50 of 150 events • Last updated: 2 mins ago
```

### 4. Empty State

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🛡️                                       │
│                                                             │
│              All Systems Secure                             │
│                                                             │
│     No security alerts or events at this time.              │
│     Your organization's security is operating normally.     │
│                                                             │
│     [View Security Settings]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Background**: White with subtle navy gradient overlay
**Icon**: Large shield icon in gold (#d3b78f)
**Title**: Navy (#242d53) - Bold, 24px
**Text**: Muted navy (#5B6B8F) - 16px
**Button**: Navy background (#242d53) with gold text (#d3b78f)
**Border**: Subtle gold border (#d3b78f with 20% opacity)

---

## Charts & Visualizations

### 1. Security Trends (Line Chart)
```
Events Over Time (Last 7 Days)

  50 ┤                              ╭─
  40 ┤                         ╭────╯
  30 ┤                    ╭────╯
  20 ┤              ╭─────╯
  10 ┤         ╭────╯
   0 ┼─────────╯
     Mon  Tue  Wed  Thu  Fri  Sat  Sun

Legend:
─── Total Events
─── Critical
─── High
─── Medium
─── Low
```

**Library**: Recharts
**Colors**: 
- Total: Navy (#242d53)
- Critical: Deep Red (#8B2635)
- High: Warm Orange (#C17A3A)
- Medium: Soft Gold (#D4A574)
- Low: Muted Blue (#5B6B8F)
- Grid Lines: Gold with 10% opacity
- Background: White

### 2. Threat Distribution (Donut Chart)
```
        Threat Distribution
        
           ╱───────╲
         ╱           ╲
        │   94/100    │
        │  Excellent  │
         ╲           ╱
           ╲───────╱
           
🔴 Critical: 2 (1.3%)
🟠 High: 8 (5.1%)
🟡 Medium: 15 (9.6%)
🔵 Low: 45 (28.8%)
✅ Resolved: 89 (55.2%)
```

### 3. Event Types (Bar Chart)
```
Event Types (Last 30 Days)

Unauthorized Access  ████████████████ 45
Device Offline       ████████████ 32
Login Attempts       ████████ 23
Suspicious Activity  ██████ 18
System Alerts        ████ 12
Compliance Issues    ██ 6
```

---

## Real-time Updates

### Firebase Realtime Listeners
```javascript
// Listen to security events
const unsubscribe = firestore
  .collection('securityEvents')
  .where('organizationId', '==', orgId)
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(50)
  .onSnapshot((snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSecurityEvents(events);
  });
```

### Update Indicators
- **Live Badge**: "🔴 LIVE" badge in top right
- **Pulse Animation**: On new alerts
- **Toast Notifications**: For critical alerts
- **Sound Alerts**: Optional for critical events

---

## API Endpoints

### 1. Add Security Event
**POST** `/api/security/events/add`
```json
{
  "organizationId": "org-id",
  "eventType": "unauthorized_access",
  "severity": "critical",
  "title": "Unauthorized Access Attempt",
  "description": "Multiple failed login attempts",
  "location": {
    "floorId": "floor-id",
    "floorNumber": 2,
    "roomId": "room-id",
    "roomName": "R201"
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "attempts": 5
  }
}
```

### 2. Update Event Status
**PATCH** `/api/security/events/{eventId}`
```json
{
  "status": "resolved",
  "notes": "False alarm - authorized maintenance"
}
```

### 3. Get Security Metrics
**GET** `/api/security/metrics?organizationId={id}&days=7`
```json
{
  "securityScore": 94,
  "threatLevel": "low",
  "totalEvents": 156,
  "activeAlerts": 3,
  "resolvedToday": 12,
  "trends": [...]
}
```

### 4. Get Events
**GET** `/api/security/events?organizationId={id}&limit=50&severity=critical`
```json
{
  "events": [...],
  "total": 150,
  "page": 1,
  "hasMore": true
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Security Events
    match /securityEvents/{eventId} {
      // Only authenticated users from the same organization
      allow read: if request.auth != null 
        && request.auth.token.organizationId == resource.data.organizationId;
      
      // Only admins can write
      allow write: if request.auth != null 
        && request.auth.token.role in ['admin', 'superadmin'];
    }
    
    // Security Metrics
    match /securityMetrics/{metricId} {
      allow read: if request.auth != null 
        && request.auth.token.organizationId == resource.data.organizationId;
      
      allow write: if request.auth != null 
        && request.auth.token.role in ['admin', 'superadmin'];
    }
    
    // Compliance Status
    match /complianceStatus/{complianceId} {
      allow read: if request.auth != null 
        && request.auth.token.organizationId == resource.data.organizationId;
      
      allow write: if request.auth != null 
        && request.auth.token.role in ['admin', 'superadmin'];
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Data Structure & API (Priority 1)
- [ ] Create Firestore collections
- [ ] Implement 150-entry rotation logic
- [ ] Create API endpoints
- [ ] Add security rules

### Phase 2: UI Components (Priority 1)
- [ ] Redesign security center page
- [ ] Create alert cards with new colors
- [ ] Implement empty states
- [ ] Add statistics cards

### Phase 3: Real-time Features (Priority 2)
- [ ] Add Firebase listeners
- [ ] Implement live updates
- [ ] Add toast notifications
- [ ] Add pulse animations

### Phase 4: Visualizations (Priority 2)
- [ ] Add line chart for trends
- [ ] Add donut chart for distribution
- [ ] Add bar chart for event types
- [ ] Add interactive filters

### Phase 5: Advanced Features (Priority 3)
- [ ] Export functionality
- [ ] Advanced filtering
- [ ] Event investigation workflow
- [ ] Compliance tracking

---

## Testing Strategy

### Unit Tests
- [ ] Test 150-entry rotation logic
- [ ] Test event creation
- [ ] Test event updates
- [ ] Test metrics calculation

### Integration Tests
- [ ] Test API endpoints
- [ ] Test Firebase listeners
- [ ] Test real-time updates
- [ ] Test data synchronization

### UI Tests
- [ ] Test empty states
- [ ] Test alert rendering
- [ ] Test filtering
- [ ] Test responsive design

---

## Performance Considerations

### Optimization Strategies
1. **Pagination**: Load 50 events at a time
2. **Indexing**: Create Firestore indexes for common queries
3. **Caching**: Cache metrics for 5 minutes
4. **Lazy Loading**: Load charts only when visible
5. **Debouncing**: Debounce search and filters

### Firestore Indexes Required
```
Collection: securityEvents
- organizationId (Ascending) + createdAt (Descending)
- organizationId (Ascending) + status (Ascending) + createdAt (Descending)
- organizationId (Ascending) + severity (Ascending) + createdAt (Descending)
```

---

## Accessibility

### WCAG 2.1 AA Compliance
- [ ] Color contrast ratios >= 4.5:1
- [ ] Keyboard navigation support
- [ ] Screen reader labels
- [ ] Focus indicators
- [ ] Alternative text for icons

### Semantic HTML
- Use proper heading hierarchy
- Use semantic elements (nav, main, section)
- Use ARIA labels where needed

---

## Mobile Responsiveness

### Breakpoints
- **Desktop**: >= 1024px (Full layout)
- **Tablet**: 768px - 1023px (Stacked cards)
- **Mobile**: < 768px (Single column)

### Mobile Optimizations
- Collapsible alert cards
- Simplified charts
- Touch-friendly buttons
- Swipe gestures for actions

---

## Security Considerations

### Data Privacy
- Encrypt sensitive data
- Mask IP addresses in logs
- Implement role-based access
- Audit trail for all actions

### Rate Limiting
- Limit API calls to 100/minute per user
- Implement exponential backoff
- Monitor for abuse

---

## Status: 📋 DESIGN COMPLETE - READY FOR IMPLEMENTATION

This comprehensive design provides:
- ✅ Enterprise-grade visual design
- ✅ Complete data structure
- ✅ 150-entry rotation strategy
- ✅ Real-time update architecture
- ✅ Empty state handling
- ✅ API specifications
- ✅ Implementation phases

**Next Step**: Review and approve design, then proceed with Phase 1 implementation.

---

**Created**: April 7, 2026
**Version**: 1.0.0
**Status**: Awaiting Approval
