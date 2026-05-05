# 📊 Historical Security Data Feature

## ✅ Implementation Complete

Added a "Previous Data" button to the Security Center that loads and displays historical security data from Firebase Realtime Database.

---

## 🎯 Features Added

### 1. **Previous Data Button**
- Located in the action buttons section
- Loads historical sensor data from all devices
- Shows loading spinner while fetching data
- Displays success toast with data count

### 2. **Time Range Selector**
Choose how far back to load data:
- Last 1 hour
- Last 6 hours
- Last 24 hours (default)
- Last 3 days
- Last 7 days

### 3. **Historical Data Table**
Displays comprehensive historical data with columns:
- **Timestamp**: When the data was recorded
- **Device**: Device name and ID
- **Temperature**: With thermometer icon
- **Humidity**: With droplet icon
- **Security Score**: With alert icon if critical
- **Threat Level**: Color-coded badge with emoji
- **Anomaly**: Detection status

### 4. **Visual Indicators**
- Critical data points highlighted in red
- Color-coded threat levels
- Icons for each metric
- Hover effects on rows

### 5. **Hide History Button**
- Appears after loading historical data
- Hides the historical data table
- Returns to real-time view

---

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [📊 Previous Data]  [⏱️ Last 24 hours ▼]  [✕ Hide History]    │
│                                          [⚡ Auto Refresh On]    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Historical Security Data                                        │
│  Showing 60 data points from the last 24 hours                  │
├──────────┬─────────┬──────┬─────────┬───────┬────────┬─────────┤
│ Time     │ Device  │ Temp │ Humidity│ Score │ Threat │ Anomaly │
├──────────┼─────────┼──────┼─────────┼───────┼────────┼─────────┤
│ 11:43 AM │ TEMP    │ 27°C │ 45%     │  94   │ 🟢 LOW │ ✅ Norm │
│ 11:38 AM │ TEMP    │ 28°C │ 44%     │  92   │ 🟢 LOW │ ✅ Norm │
│ 11:33 AM │ TEMP    │ 26°C │ 46%     │  95   │ 🟢 SAFE│ ✅ Norm │
│ ...      │ ...     │ ...  │ ...     │  ...  │ ...    │ ...     │
└──────────┴─────────┴──────┴─────────┴───────┴────────┴─────────┘
Showing first 50 of 60 data points
```

---

## 🔄 Data Flow

```
1. User clicks "Previous Data" button
   ↓
2. Fetch all devices from organization
   ↓
3. For each device:
   - Fetch sensor data from Firebase Realtime DB
   - Decrypt encrypted data
   - Extract relevant metrics
   ↓
4. Combine all historical data points
   ↓
5. Sort by timestamp (newest first)
   ↓
6. Display in table (max 50 rows)
   ↓
7. Show success toast with count
```

---

## 📊 Data Displayed

### For Each Historical Data Point:
- **Timestamp**: Formatted date and time
- **Device Name**: Device identifier
- **Temperature**: °C with icon
- **Humidity**: % with icon
- **Security Score**: 0-100 scale
- **Threat Level**: Safe/Low/Medium/High/Critical
- **Anomaly Status**: Detected or Normal

### Visual Indicators:
- 🔴 **Critical rows**: Red background tint
- 🌡️ **High/Low temp**: Red text
- ⚠️ **Low security score**: Red text with alert icon
- 🟢🔵🟡🟠🔴 **Threat badges**: Color-coded
- ✅⚠️ **Anomaly badges**: Green or orange

---

## 🎯 Use Cases

### 1. **Security Audit**
- Review past 7 days of security data
- Identify patterns in threats
- Verify security score trends

### 2. **Incident Investigation**
- Load data from specific time period
- Analyze what happened during an incident
- Correlate multiple device data

### 3. **Compliance Reporting**
- Export historical security metrics
- Show security posture over time
- Document threat responses

### 4. **Trend Analysis**
- Compare current vs historical data
- Identify recurring anomalies
- Track security improvements

---

## 🧪 How to Use

### Step 1: Access Security Center
```
http://localhost:9002/org-dashboard/security
```

### Step 2: Click "Previous Data"
- Button is in the top action bar
- Wait for data to load (shows spinner)
- Toast notification shows data count

### Step 3: Select Time Range (Optional)
- Click dropdown next to "Previous Data"
- Choose: 1h, 6h, 24h, 3d, or 7d
- Click "Previous Data" again to reload

### Step 4: Review Historical Data
- Scroll through the table
- Look for critical rows (red background)
- Check threat levels and anomalies

### Step 5: Hide History (Optional)
- Click "Hide History" button
- Returns to real-time view
- Historical data is cached

---

## 📈 Example Scenarios

### Scenario 1: Normal Operations
```
Time Range: Last 24 hours
Data Points: 60
Critical Events: 0
Average Security Score: 94
Threat Level: 🟢 SAFE
```

### Scenario 2: Attack Detected
```
Time Range: Last 6 hours
Data Points: 30
Critical Events: 5
Average Security Score: 35
Threat Level: 🔴 CRITICAL

Critical Data Points:
- 11:43 AM: Temp 45°C, Score 25, CRITICAL
- 11:38 AM: Temp 48°C, Score 20, CRITICAL
- 11:33 AM: Temp 42°C, Score 30, CRITICAL
```

### Scenario 3: Gradual Degradation
```
Time Range: Last 3 days
Data Points: 150
Pattern: Security score declining from 95 to 70
Anomalies: Increasing from 0 to 3 per hour
Action: Investigate cause of degradation
```

---

## 🎨 Visual Features

### Color Coding
- **Critical rows**: `bg-[#8B2635]/5` (light red)
- **Normal rows**: White background
- **Hover**: `bg-[#d3b78f]/10` (light gold)

### Icons
- 🌡️ Temperature
- 💧 Humidity
- ⚠️ Alert (low security score)
- 🟢🔵🟡🟠🔴 Threat level indicators
- ✅ Normal
- ⚠️ Anomaly detected

### Badges
- **Threat Level**: Color-coded with emoji
- **Anomaly**: Green (normal) or Orange (detected)

---

## 🔧 Technical Details

### State Management
```typescript
const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
const [showHistoricalData, setShowHistoricalData] = useState(false);
const [isLoadingHistory, setIsLoadingHistory] = useState(false);
const [historyTimeRange, setHistoryTimeRange] = useState<number>(24);
```

### Data Structure
```typescript
interface HistoricalDataPoint {
  timestamp: string;
  deviceId: string;
  deviceName: string;
  temperature?: number;
  humidity?: number;
  security_score?: number;
  threat_level?: string;
  anomaly_detected?: boolean;
}
```

### API Calls
```typescript
// Fetch sensor data for each device
GET /api/sensor-data/${deviceId}?hours=${historyTimeRange}

// Decrypt encrypted data
POST /api/decrypt-sensor-data
Body: { encrypted_data, salt, iv, tag, algorithm }
```

---

## 📊 Data Limits

- **Display Limit**: First 50 data points shown
- **Fetch Limit**: Up to 100 data points per device
- **Time Range**: 1 hour to 7 days
- **Devices**: All devices in organization

---

## ✅ Benefits

### For Security Teams
- Historical threat analysis
- Pattern recognition
- Incident investigation
- Compliance documentation

### For Administrators
- Security posture tracking
- Trend analysis
- Performance monitoring
- Audit trail

### For Operations
- Quick historical lookup
- Time-based filtering
- Visual data representation
- Export capability (future)

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Export to CSV/PDF
- [ ] Date range picker (custom dates)
- [ ] Chart/graph visualization
- [ ] Filter by device
- [ ] Filter by threat level
- [ ] Search functionality
- [ ] Pagination for large datasets
- [ ] Real-time updates in history view

---

## 🎉 Status: READY

The Historical Data feature is fully implemented and ready to use!

**Access it at**: http://localhost:9002/org-dashboard/security

**Steps**:
1. Login with `admin@socse.com` / `admin123`
2. Navigate to Security Center
3. Click "Previous Data" button
4. Select time range (optional)
5. Review historical security data
6. Click "Hide History" to return to real-time view

---

## 📝 Notes

- Historical data is decrypted automatically
- Data is sorted by timestamp (newest first)
- Critical data points are highlighted
- Maximum 50 rows displayed at once
- Toast notification shows data count
- Works with all devices in organization
- Respects encryption settings
- Compatible with auto-refresh feature

---

## ✅ Testing

### Test with Existing Data
```bash
# Data should already be in Firebase Realtime DB
# Just click "Previous Data" to load it
```

### Test with New Data
```bash
# Send some data first
python3 laptop2_fixed_normal_data.py

# Wait a few minutes, then send more
python3 laptop2_fixed_normal_data.py attack

# Now click "Previous Data" to see both normal and attack data
```

### Test Different Time Ranges
1. Click "Previous Data" (loads last 24 hours)
2. Change dropdown to "Last 1 hour"
3. Click "Previous Data" again
4. Compare data counts

---

The Historical Data feature provides comprehensive security data analysis capabilities! 🎉
