# Firebase Circular Buffer Implementation - Design Update

## Date: 2026-04-09

## Summary of Changes

Updated the ESP32 Web Platform Integration design document to ensure all data is stored exclusively in Firebase Realtime Database with a circular buffer pattern for efficient storage management.

## Key Changes

### 1. Data Storage Architecture

**BEFORE**: 
- Mixed storage: Azure SQL/SQLite for device metadata, Firebase for real-time data
- Unlimited sensor history growth
- Complex sync between databases

**AFTER**:
- **100% Firebase Realtime Database** - No Azure SQL or SQLite for ESP32 data
- All device info, sensor readings, alerts, and IoT device data stored in Firebase
- ESP32 writes directly to Firebase
- Web platform reads directly from Firebase
- No database synchronization needed

### 2. Circular Buffer Pattern (200 Entry Limit)

Implemented circular buffer for two data types:

#### Sensor History Buffer
- **Path**: `/devices/{DEVICE_ID}/sensorHistory/readings/{0-199}`
- **Max Entries**: 200
- **Behavior**: When index reaches 200, wraps to 0 and overwrites oldest data
- **Metadata Tracked**:
  - `currentIndex`: Next write position (0-199)
  - `totalWrites`: Total number of writes since device registration
  - `oldestEntry`: Index of oldest data point
  - `newestEntry`: Index of newest data point
  - `lastRewrite`: Timestamp when buffer completed full cycle

#### Alerts Buffer
- **Path**: `/devices/{DEVICE_ID}/alerts/entries/{0-199}`
- **Max Entries**: 200
- **Behavior**: Same circular pattern as sensor history
- **Metadata Tracked**: Same structure as sensor history

### 3. Firebase Database Structure

```
/devices/{DEVICE_ID}/
├── info/                          # Device metadata
├── current/                       # Latest sensor reading
├── sensorHistory/
│   ├── metadata/
│   │   ├── maxEntries: 200
│   │   ├── currentIndex: 0-199
│   │   ├── totalWrites: count
│   │   ├── oldestEntry: index
│   │   ├── newestEntry: index
│   │   └── lastRewrite: timestamp
│   └── readings/
│       ├── 0: {sensor data}
│       ├── 1: {sensor data}
│       ├── ...
│       └── 199: {sensor data}
├── alerts/
│   ├── metadata/
│   │   ├── maxEntries: 200
│   │   ├── currentIndex: 0-199
│   │   ├── totalAlerts: count
│   │   ├── oldestEntry: index
│   │   └── newestEntry: index
│   └── entries/
│       ├── 0: {alert data}
│       ├── 1: {alert data}
│       ├── ...
│       └── 199: {alert data}
├── connectedIoTDevices/
└── blockedDevices/
```

### 4. ESP32 Firmware Updates

#### New Module: CircularBufferManager.cpp

**Purpose**: Manage circular buffer writes to Firebase

**Key Functions**:
```cpp
bool pushSensorReading(const String& deviceId, const SensorData& data);
bool pushAlert(const String& deviceId, const AlertData& alert);
void initCircularBuffer(const String& deviceId);
```

**Algorithm**:
1. Read current index from Firebase metadata
2. Write data to `/readings/{currentIndex}` or `/entries/{currentIndex}`
3. Calculate next index: `(currentIndex + 1) % 200`
4. Update metadata: currentIndex, totalWrites, oldestEntry, newestEntry
5. If nextIndex == 0 and totalWrites >= 200: Log "Rewrite cycle completed"

#### Updated Module: FirebaseSyncManager.cpp

**Changes**:
- Replaced `pushSensorData()` with `pushSensorDataToCircularBuffer()`
- Replaced `pushAlert()` with `pushAlertToCircularBuffer()`
- Added circular buffer index management
- Added metadata update functions

### 5. Benefits of This Approach

#### Storage Efficiency
- **Predictable Size**: Each device uses exactly 200 entries per buffer type
- **No Cleanup Needed**: Automatic overwriting eliminates need for deletion
- **Firebase Costs**: Fixed storage per device (not growing indefinitely)

#### Performance
- **Consistent Write Speed**: Always writing to single index, not appending
- **Fast Reads**: Dashboard can read specific index ranges
- **No Database Maintenance**: No need to archive or delete old data

#### Simplicity
- **Single Source of Truth**: Firebase is the only database
- **No Sync Logic**: ESP32 and web platform use same data source
- **Easier Debugging**: All data in one place

### 6. Data Retention

- **Current Data**: Always available at `/devices/{DEVICE_ID}/current`
- **Recent History**: Last 200 sensor readings (typically 10 minutes at 3-second intervals)
- **Recent Alerts**: Last 200 alerts
- **Long-term Storage**: If needed, web platform can export to separate archive

### 7. Web Platform Changes

#### Backend API
- Reads directly from Firebase (no SQL queries for ESP32 data)
- Firebase listeners for real-time updates
- Circular buffer-aware queries (handle wrap-around)

#### Frontend Dashboard
- Displays data from Firebase
- Handles circular buffer index logic for historical charts
- Shows metadata (total writes, buffer status)

## Implementation Notes

### ESP32 Memory Usage
- Circular buffer logic adds minimal overhead (~100 bytes)
- No local buffering needed (writes directly to Firebase)
- Metadata reads are cached to reduce Firebase calls

### Firebase Rules
```json
{
  "rules": {
    "devices": {
      "$deviceId": {
        "sensorHistory": {
          "readings": {
            "$index": {
              ".validate": "$index >= 0 && $index < 200"
            }
          }
        },
        "alerts": {
          "entries": {
            "$index": {
              ".validate": "$index >= 0 && $index < 200"
            }
          }
        }
      }
    }
  }
}
```

### Error Handling
- If Firebase write fails, ESP32 retries with exponential backoff
- Metadata inconsistency detection and auto-repair
- Offline mode: Queue writes, sync when reconnected

## Migration Path

For existing deployments:
1. Initialize circular buffer metadata for all devices
2. Migrate last 200 sensor readings to new structure
3. Migrate last 200 alerts to new structure
4. Update ESP32 firmware to use circular buffer functions
5. Update web platform to read from new Firebase structure

## Testing Checklist

- [ ] ESP32 writes to circular buffer correctly
- [ ] Index wraps from 199 to 0
- [ ] Metadata updates accurately
- [ ] Dashboard displays historical data correctly
- [ ] Dashboard handles index wrap-around in charts
- [ ] Alert buffer works independently from sensor buffer
- [ ] Firebase storage size remains constant after 200 writes
- [ ] Performance testing: 1000+ writes to verify consistency

## Files Modified

- `.kiro/specs/esp32-web-platform-integration/design.md`
  - Removed all Azure SQL/SQLite database schemas
  - Added Firebase circular buffer structure
  - Added CircularBufferManager.cpp module documentation
  - Updated FirebaseSyncManager.cpp documentation
  - Updated data flow diagrams
  - Updated backend API documentation

## Next Steps

1. ✅ Design document updated
2. ⏳ Update requirements.md to reflect Firebase-only storage
3. ⏳ Create tasks.md for implementation
4. ⏳ Implement CircularBufferManager.cpp in ESP32 firmware
5. ⏳ Update FirebaseSyncManager.cpp
6. ⏳ Update web platform backend to read from circular buffers
7. ⏳ Update frontend to display circular buffer data
8. ⏳ Add attack logging and report generation (next feature)

---

**Status**: Design document updated ✅  
**Ready for**: Requirements update and task creation
