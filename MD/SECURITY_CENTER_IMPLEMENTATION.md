# 🛡️ Security Center - Real-Time Threat Analysis

## ✅ Implementation Complete

The Security Center has been enhanced to analyze decrypted sensor data in real-time and display comprehensive security insights.

---

## 🎯 Features Implemented

### 1. **Real-Time Threat Analysis**
- Analyzes sensor data from all devices
- Calculates overall threat level (Safe, Low, Medium, High, Critical)
- Detects anomalies automatically
- Identifies critical devices requiring attention

### 2. **Security Metrics Dashboard**
- **Overall Threat Level**: Visual indicator with emoji and color coding
- **Average Security Score**: Calculated across all devices with progress bar
- **Anomaly Detection**: Count of devices with detected anomalies
- **Encryption Status**: Shows how many devices are using encryption

### 3. **Critical Threat Detection**
Automatically detects and alerts for:
- 🌡️ **High Temperature**: > 40°C
- ❄️ **Low Temperature**: < 10°C
- 📳 **High Vibration**: > 10 units
- 🔊 **Loud Noise**: > 90 dB
- 🔴 **Critical Threat Level**: From sensor data
- ⚠️ **Low Security Score**: < 40

### 4. **Device Security Status Table**
Real-time table showing for each device:
- Device name and ID
- Online/Offline status
- Security score with visual indicators
- Threat level with color-coded badges
- Temperature readings
- Anomaly detection status
- Encryption status (locked/unlocked icon)

### 5. **Auto-Refresh**
- Automatically refreshes every 10 seconds
- Toggle on/off with button
- Shows last update timestamp

---

## 📊 Data Analysis Logic

### Threat Level Calculation

```typescript
// Critical if:
- threat_level === 'critical'
- temperature > 40°C or < 10°C
- humidity > 85%
- vibration_level > 10
- sound_level > 90 dB
- security_score < 40

// Overall Threat Level:
- CRITICAL: Any critical devices detected
- HIGH: More than 2 anomalies
- MEDIUM: 1-2 anomalies
- LOW: Average security score < 70
- SAFE: All systems normal
```

### Security Score

```typescript
// Average across all devices
averageSecurityScore = totalScore / deviceCount

// Visual indicators:
- 90-100: Green (Excellent)
- 70-89: Blue (Good)
- 50-69: Orange (Fair)
- 0-49: Red (Poor)
```

---

## 🎨 Visual Design

### Color Scheme
- **Critical**: `#8B2635` (Dark Red)
- **High**: `#C17A3A` (Orange)
- **Medium**: `#D4A574` (Light Orange)
- **Low**: `#5B6B8F` (Blue-Gray)
- **Safe**: `#6B8E6F` (Green)

### Threat Level Indicators
- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🔵 Low
- 🟢 Safe

---

## 🔄 Data Flow

```
1. Fetch all devices from Firestore
   ↓
2. For each device, fetch latest sensor data from Firebase Realtime DB
   ↓
3. Decrypt encrypted sensor data
   ↓
4. Analyze threat levels and anomalies
   ↓
5. Calculate security metrics
   ↓
6. Display in Security Center dashboard
   ↓
7. Auto-refresh every 10 seconds
```

---

## 📱 How to Use

### 1. Access Security Center
```
http://localhost:9002/org-dashboard/security
```

### 2. View Real-Time Metrics
- **Top Cards**: Show overall security status
  - Threat Level
  - Average Security Score
  - Anomalies Detected
  - Encrypted Devices

### 3. Monitor Critical Threats
- Critical threats appear in red alert cards
- Shows device name, threat type, and timestamp
- Action buttons: View Device, Mark Resolved

### 4. Check Device Status
- Scroll to "Device Security Status" table
- See all devices with their security metrics
- Critical devices highlighted in red background

### 5. Toggle Auto-Refresh
- Click "Auto Refresh" button to enable/disable
- When enabled, data updates every 10 seconds

---

## 🧪 Testing the Security Center

### Test with Normal Data
```bash
# Send normal sensor data
python3 laptop2_fixed_normal_data.py
```

**Expected Results**:
- Threat Level: 🟢 SAFE or 🔵 LOW
- Security Score: 85-98
- Anomalies: 0
- Temperature: 20-30°C (green)

### Test with Attack Data
```bash
# Send attack/critical data
python3 laptop2_fixed_normal_data.py attack
```

**Expected Results**:
- Threat Level: 🔴 CRITICAL
- Security Score: 15-40 (red)
- Anomalies: 1+
- Temperature: 40-50°C (red, highlighted)
- Critical threat alert card appears

---

## 📈 Security Metrics Explained

### 1. **Threat Level**
Overall security posture based on:
- Number of critical devices
- Anomaly count
- Average security score

### 2. **Security Score**
Average of all device security scores:
- Calculated from sensor data
- Range: 0-100
- Higher is better

### 3. **Anomalies**
Devices with `anomaly_detected: true`:
- Indicates unusual behavior
- Requires investigation

### 4. **Encryption Status**
Devices using AES-256-GCM encryption:
- 🔒 Encrypted (secure)
- 🔓 Unencrypted (vulnerable)

---

## 🎯 Key Features

### ✅ Real-Time Analysis
- Analyzes decrypted sensor data
- Updates every 10 seconds
- Shows current threat status

### ✅ Intelligent Threat Detection
- Multi-factor analysis
- Temperature, vibration, sound monitoring
- Security score evaluation

### ✅ Visual Indicators
- Color-coded threat levels
- Emoji indicators
- Progress bars
- Badges

### ✅ Actionable Insights
- Critical threat alerts
- Device-level details
- Investigation buttons

### ✅ Compliance Dashboard
- GDPR, ISO 27001, SOC 2, HIPAA
- Certification status
- Audit dates

---

## 🔧 Configuration

### Auto-Refresh Interval
```typescript
// In src/app/org-dashboard/security/page.tsx
interval = setInterval(() => {
  fetchDevicesSensorData(userData.organizationId);
}, 10000); // 10 seconds (10000ms)
```

### Threat Detection Thresholds
```typescript
// Temperature
const isCritical = reading.temperature > 40 || reading.temperature < 10;

// Vibration
const isCritical = reading.vibration_level > 10;

// Sound
const isCritical = reading.sound_level > 90;

// Security Score
const isCritical = reading.security_score < 40;
```

---

## 📊 Sample Security Center View

```
┌─────────────────────────────────────────────────────────┐
│  🛡️ Security Center                                     │
│  Real-time security monitoring and threat detection     │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Threat Level │ Avg Security │  Anomalies   │  Encrypted   │
│              │    Score     │   Detected   │   Devices    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│  🟢 SAFE     │   94/100     │      0       │    3/3       │
│  0 Critical  │   ████████   │  ✅ Normal   │  🔒 Secured  │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────┐
│  Device Security Status                                  │
├──────────┬────────┬─────────┬────────┬──────┬─────┬─────┤
│ Device   │ Status │ Score   │ Threat │ Temp │ Anom│ Enc │
├──────────┼────────┼─────────┼────────┼──────┼─────┼─────┤
│ TEMP     │ 🟢 On  │   94    │ 🟢 LOW │ 27°C │  ✅ │ 🔒  │
│ DOOR-01  │ 🟢 On  │   96    │ 🟢 SAFE│ 24°C │  ✅ │ 🔒  │
│ CAM-01   │ 🔴 Off │   N/A   │  N/A   │ N/A  │ N/A │ 🔒  │
└──────────┴────────┴─────────┴────────┴──────┴─────┴─────┘
```

---

## 🚀 Next Steps

1. **Open Security Center**:
   ```
   http://localhost:9002/org-dashboard/security
   ```

2. **Login** with test credentials:
   - Email: `admin@socse.com`
   - Password: `admin123`

3. **Navigate** to Security Center from sidebar

4. **View** real-time security analysis

5. **Test** with different data modes:
   - Normal mode: `python3 laptop2_fixed_normal_data.py`
   - Attack mode: `python3 laptop2_fixed_normal_data.py attack`

---

## 🎉 Benefits

### For Security Teams
- Real-time threat visibility
- Automated anomaly detection
- Prioritized alerts
- Device-level insights

### For Administrators
- Overall security posture
- Compliance status
- Encryption monitoring
- Historical events

### For Operations
- Auto-refresh capability
- Visual indicators
- Quick investigation
- Actionable insights

---

## 📝 Notes

- Security Center analyzes **decrypted** sensor data
- Requires devices to be sending data
- Auto-refresh can be toggled on/off
- Critical threats trigger visual alerts
- All timestamps are in local timezone

---

## ✅ Status: READY

The Security Center is now fully functional and analyzing real-time sensor data to provide comprehensive security insights!

**Access it at**: http://localhost:9002/org-dashboard/security
