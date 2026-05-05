# Security Center - Visual Mockup (Navy & Gold Theme)

## Color Palette
- **Navy**: `#242d53` - Primary brand color
- **Gold**: `#d3b78f` - Accent color
- **White**: `#FFFFFF` - Background

---

## Page Header

```
╔═══════════════════════════════════════════════════════════════╗
║  🛡️ Security Center                    🔔 3    ⚙️    👤       ║
║  Real-time security monitoring and threat detection           ║
╚═══════════════════════════════════════════════════════════════╝
```
**Style**:
- Background: Navy (#242d53)
- Text: White
- Icons: Gold (#d3b78f)
- Notification badge: Gold background with navy text

---

## Statistics Cards Row

```
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ 🛡️                  │ │ ⚠️                  │ │ ✅                  │ │ 📊                  │
│ Security Score      │ │ Active Alerts       │ │ Resolved Today      │ │ Events (24h)        │
│                     │ │                     │ │                     │ │                     │
│     94/100          │ │        3            │ │        12           │ │       156           │
│ ████████████░░░░    │ │                     │ │                     │ │                     │
│                     │ │ 🔴 1 Critical       │ │ +2 vs yesterday     │ │ +12 vs yesterday    │
│ Excellent ↑         │ │ 🟠 2 High           │ │                     │ │                     │
│                     │ │                     │ │                     │ │                     │
│ [View Details]      │ │ [View All →]        │ │ [View History]      │ │ [View Log]          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```
**Style**:
- Background: White
- Border: 1px solid rgba(36, 45, 83, 0.1)
- Shadow: 0 2px 8px rgba(36, 45, 83, 0.08)
- Title: Navy (#242d53), 14px, medium weight
- Value: Navy (#242d53), 32px, bold
- Icon: Gold (#d3b78f), 24px
- Progress bar: Gold fill, light gold background
- Button: Navy text, gold border, gold background on hover
- Hover: Lift effect with stronger shadow

---

## Critical Alert Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║ 🔴 CRITICAL ALERT                                          [⋮ Actions] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Unauthorized Access Attempt                                          ║
║  Multiple failed login attempts detected from unknown IP address      ║
║                                                                       ║
║  📍 Location: Floor 2, Room 201 (Conference Room)                     ║
║  🕐 Time: 2 minutes ago (14:32:15)                                    ║
║  🔗 Device: Camera-201 (Main Entrance)                                ║
║  🌐 IP Address: 192.168.1.100                                         ║
║  👤 Attempts: 5 failed login attempts                                 ║
║                                                                       ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               ║
║  │ 🔍 Investigate│  │ ✓ Resolve    │  │ ✕ Dismiss    │               ║
║  └──────────────┘  └──────────────┘  └──────────────┘               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```
**Style**:
- Background: rgba(139, 38, 53, 0.08) (Light red tint)
- Border: 2px solid #8B2635 (Deep red)
- Border-left: 4px solid #8B2635 (Accent)
- Title: Navy (#242d53), 16px, bold
- Badge: Deep red background, white text
- Icon: Deep red (#8B2635)
- Description: Navy (#242d53), 14px
- Metadata: Muted navy (#5B6B8F), 13px
- Buttons:
  - Investigate: Navy background, gold text
  - Resolve: Gold background, navy text
  - Dismiss: White background, navy border, navy text
- Hover: Gold border on all buttons

---

## High Priority Alert Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║ 🟠 HIGH PRIORITY                                           [⋮ Actions] ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Device Offline                                                       ║
║  Security camera has been offline for 15 minutes                      ║
║                                                                       ║
║  📍 Location: Floor 3, Room 305 (Server Room)                         ║
║  🕐 Time: 15 minutes ago (14:17:42)                                   ║
║  🔗 Device: Camera-305 (Server Room Monitor)                          ║
║  ⚡ Last Seen: 14:02:30                                               ║
║                                                                       ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               ║
║  │ 🔍 Investigate│  │ ✓ Resolve    │  │ ✕ Dismiss    │               ║
║  └──────────────┘  └──────────────┘  └──────────────┘               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```
**Style**:
- Background: rgba(193, 122, 58, 0.08) (Light orange tint)
- Border: 2px solid #C17A3A (Warm orange)
- Border-left: 4px solid #C17A3A (Accent)
- Same button and text styling as critical

---

## Medium Priority Alert Card

```
┌───────────────────────────────────────────────────────────────────────┐
│ 🟡 MEDIUM PRIORITY                                         [⋮ Actions] │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Suspicious Activity Detected                                         │
│  Unusual access pattern detected in lobby area                        │
│                                                                       │
│  📍 Location: Floor 1, Lobby                                          │
│  🕐 Time: 1 hour ago (13:32:15)                                       │
│  🔗 Device: Motion-Sensor-101                                         │
│                                                                       │
│  [🔍 Investigate]  [✓ Resolve]  [✕ Dismiss]                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```
**Style**:
- Background: rgba(212, 165, 116, 0.1) (Light gold tint)
- Border: 1px solid #D4A574 (Soft gold)
- Border-left: 4px solid #D4A574 (Accent)

---

## Events Table

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Recent Security Events                                               ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ 🔍 Search events...                                             │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  [All ▼] [Critical] [High] [Medium] [Low] [Resolved]    [Export ↓]   ║
║                                                                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Time    │ Event Type        │ Location  │ Severity │ Status          ║
╠═════════╪═══════════════════╪═══════════╪══════════╪═════════════════╣
║ 14:32   │ 🔴 Unauth Access  │ F2-R201   │ Critical │ 🔴 Active       ║
║ 14:17   │ 🟠 Device Offline │ F3-R305   │ High     │ 🟠 Active       ║
║ 13:45   │ 🔵 Login Success  │ Admin     │ Low      │ ✅ Resolved     ║
║ 13:32   │ 🟡 Suspicious     │ F1-Lobby  │ Medium   │ 🔍 Investigating║
║ 12:55   │ 🔵 System Update  │ Server    │ Low      │ ✅ Resolved     ║
║ 12:30   │ 🟠 High Temp      │ F2-R210   │ High     │ ✅ Resolved     ║
║ 11:45   │ 🔵 Door Access    │ F1-Main   │ Low      │ ✅ Resolved     ║
║ 11:20   │ 🟡 Network Spike  │ F3-Server │ Medium   │ ✅ Resolved     ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Showing 1-50 of 150 events • Last updated: 2 mins ago                ║
║ [← Previous]  [1] [2] [3]  [Next →]                                   ║
╚═══════════════════════════════════════════════════════════════════════╝
```
**Style**:
- Background: White
- Header: Navy background (#242d53), white text
- Rows: Alternating white and rgba(36, 45, 83, 0.02)
- Hover: rgba(211, 183, 143, 0.1) (Gold tint)
- Borders: rgba(36, 45, 83, 0.1)
- Status badges:
  - Active: Red background, white text
  - Investigating: Gold background, navy text
  - Resolved: Sage green background, white text
- Filter buttons: Navy border, navy text, gold background on active
- Pagination: Navy text, gold on active

---

## Empty State

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                                                                       │
│                              🛡️                                       │
│                                                                       │
│                      All Systems Secure                               │
│                                                                       │
│              No security alerts or events at this time.               │
│         Your organization's security is operating normally.           │
│                                                                       │
│                                                                       │
│                    ┌─────────────────────────┐                        │
│                    │  View Security Settings │                        │
│                    └─────────────────────────┘                        │
│                                                                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```
**Style**:
- Background: White with subtle gradient overlay
- Border: 1px solid rgba(211, 183, 143, 0.3) (Gold tint)
- Icon: 64px, gold (#d3b78f)
- Title: Navy (#242d53), 28px, bold
- Description: Muted navy (#5B6B8F), 16px
- Button: Navy background, gold text, gold border on hover
- Padding: 80px vertical

---

## Security Trends Chart

```
┌───────────────────────────────────────────────────────────────────────┐
│  Security Trends (Last 7 Days)                                        │
│                                                                       │
│  50 ┤                                                    ╭─────       │
│  40 ┤                                          ╭────────╯             │
│  30 ┤                                    ╭─────╯                      │
│  20 ┤                          ╭────────╯                             │
│  10 ┤                ╭─────────╯                                      │
│   0 ┼────────────────╯                                                │
│     Mon    Tue    Wed    Thu    Fri    Sat    Sun                    │
│                                                                       │
│  Legend:                                                              │
│  ─── Total Events (Navy)                                              │
│  ─── Critical (Deep Red)                                              │
│  ─── High (Warm Orange)                                               │
│  ─── Medium (Soft Gold)                                               │
│  ─── Low (Muted Blue)                                                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```
**Style**:
- Background: White
- Grid lines: rgba(211, 183, 143, 0.2) (Gold tint)
- Lines: Navy, red, orange, gold, blue (as per legend)
- Axis labels: Muted navy (#5B6B8F)
- Hover tooltip: Navy background, white text, gold border

---

## Threat Distribution Donut Chart

```
┌───────────────────────────────────────────────────────────────────────┐
│  Threat Distribution                                                  │
│                                                                       │
│                    ╱─────────╲                                        │
│                  ╱             ╲                                      │
│                 │    94/100     │                                     │
│                 │   Excellent   │                                     │
│                  ╲             ╱                                      │
│                    ╲─────────╱                                        │
│                                                                       │
│  🔴 Critical: 2 (1.3%)                                                │
│  🟠 High: 8 (5.1%)                                                    │
│  🟡 Medium: 15 (9.6%)                                                 │
│  🔵 Low: 45 (28.8%)                                                   │
│  ✅ Resolved: 89 (55.2%)                                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```
**Style**:
- Background: White
- Donut segments: Deep red, warm orange, soft gold, muted blue, sage green
- Center text: Navy (#242d53), bold
- Legend: Navy text with colored dots
- Hover: Highlight segment with gold border

---

## Compliance Dashboard

```
┌───────────────────────────────────────────────────────────────────────┐
│  Compliance Status                                                    │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ ✅ GDPR        │  │ ✅ ISO 27001   │  │ ✅ SOC 2       │         │
│  │ Compliant      │  │ Certified      │  │ Type II        │         │
│  │                │  │                │  │                │         │
│  │ Last Audit:    │  │ Valid Until:   │  │ Audit Passed:  │         │
│  │ 2 weeks ago    │  │ Dec 2026       │  │ Jan 2026       │         │
│  │                │  │                │  │                │         │
│  │ Score: 95/100  │  │ Score: 98/100  │  │ Score: 92/100  │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│                                                                       │
│  ┌────────────────┐                                                  │
│  │ ⚠️ HIPAA       │                                                  │
│  │ Review Needed  │                                                  │
│  │                │                                                  │
│  │ Next Review:   │                                                  │
│  │ In 5 days      │                                                  │
│  │                │                                                  │
│  │ Score: 78/100  │                                                  │
│  └────────────────┘                                                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```
**Style**:
- Background: White
- Compliant cards: rgba(107, 142, 111, 0.08) (Sage green tint), green border
- Review needed cards: rgba(212, 165, 116, 0.1) (Gold tint), gold border
- Icons: Green for compliant, gold for review needed
- Text: Navy (#242d53)
- Score: Bold, larger font

---

## Button Styles

### Primary Button
```
┌─────────────────┐
│  Investigate    │  ← Navy background (#242d53)
└─────────────────┘     Gold text (#d3b78f)
                        Hover: Gold border
```

### Secondary Button
```
┌─────────────────┐
│  View Details   │  ← Gold background (#d3b78f)
└─────────────────┘     Navy text (#242d53)
                        Hover: Navy border
```

### Outline Button
```
┌─────────────────┐
│  Dismiss        │  ← White background
└─────────────────┘     Navy border (#242d53)
                        Navy text (#242d53)
                        Hover: Gold border
```

---

## Typography

### Headings
- H1: Navy (#242d53), 32px, Bold
- H2: Navy (#242d53), 24px, Bold
- H3: Navy (#242d53), 20px, Semibold
- H4: Navy (#242d53), 16px, Semibold

### Body Text
- Primary: Navy (#242d53), 14px, Regular
- Secondary: Muted Navy (#5B6B8F), 14px, Regular
- Small: Muted Navy (#5B6B8F), 12px, Regular

### Links
- Default: Gold (#d3b78f), Underline on hover
- Visited: Darker gold (#c9a876)

---

## Spacing & Layout

### Card Spacing
- Padding: 24px
- Margin: 24px between cards
- Border radius: 8px

### Grid Layout
- Gap: 24px
- Columns: 4 on desktop, 2 on tablet, 1 on mobile

### Shadows
- Card: 0 2px 8px rgba(36, 45, 83, 0.08)
- Card hover: 0 4px 16px rgba(36, 45, 83, 0.12)
- Modal: 0 8px 32px rgba(36, 45, 83, 0.16)

---

**Design Status**: ✅ Complete - Ready for Implementation
**Color Scheme**: Navy (#242d53) + Gold (#d3b78f) + White (#FFFFFF)
**Inspiration**: Tarvlume.com - Elegant, sophisticated, professional
