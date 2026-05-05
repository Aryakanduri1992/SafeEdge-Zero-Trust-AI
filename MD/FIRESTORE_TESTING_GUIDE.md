# 🧪 Firestore Device Storage - Testing Guide

## ✅ Implementation Complete!

**Date**: April 10, 2026  
**Status**: Ready to Test

---

## 🎯 What Was Implemented

### 1. Dual Storage System
- ✅ **Firestore**: Stores device metadata for dashboard display
- ✅ **Firebase Realtime DB**: Stores provisioning data for ESP32 communication

### 2. Complete Data Flow
- ✅ User creates device → Backend provisions → Stores in both databases
- ✅ Frontend fetches from Firestore → Displays in device list
- ✅ ESP32 validates → Updates Firebase Realtime DB
- ⚠️ Status sync (Firebase → Firestore) - Manual for now

---

## 🚀 Quick Test Steps

### Test 1: Create Device and Verify Storage

**Step 1: Open Dashboard**
```bash
http://localhost:9002
```

**Step 2: Navigate to Devices**
- Click "Devices" in sidebar
- Click "Add Device" button

**Step 3: Fill Form**
```
Device Information:
- Name: ESP32-Test-001
- Type: Temperature Sensor
- Connection: WiFi
- WiFi SSID: Hospital-WiFi
- WiFi Password: test1234

Location:
- Department: (select any)
- Floor: (select any)
- Room: (select any)
```

**Step 4: Generate QR Code**
- Click "Generate QR Code" button
- Wait 2-3 seconds for certificates to generate
- QR code should appear ✅

**Step 5: Verify Firestore Storage**

Open Firebase Console → Firestore Database:
```
Collection: devices
Document: (auto-generated ID)

Expected Data:
{
  name: "ESP32-Test-001",
  type: "temperature_sensor",
  status: "pending",
  esp32DeviceId: "iot_temperature_sensor_20260410_...",
  connectionType: "wifi",
  organizationId: "org_...",
  departmentId: "dept_...",
  floorId: "floor_...",
  roomId: "room_...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Step 6: Verify Firebase Realtime DB Storage**

Open Firebase Console → Realtime Database:
```
Path: /devices/iot_temperature_sensor_20260410_.../

Expected Data:
{
  "info": {
    "device_id": "iot_temperature_sensor_...",
    "device_name": "ESP32-Test-001",
    "status": "offline",
    "created_at": "2026-04-10T..."
  },
  "provisioning": {
    "status": "pending",
    "provisioning_token": "...",
    "token_used": false,
    "connection_type": "wifi",
    "wifi_ssid": "Hospital-WiFi"
  },
  "security": {
    "certificate_serial": "...",
    "certificate_expires_at": "..."
  }
}
```

**Step 7: Verify Device List**
- Close the dialog (click "Done")
- Device should appear in the list ✅
- Status: 🔴 Offline (pending)
- Name: ESP32-Test-001
- Type: Temperature Sensor

---

### Test 2: Verify Device Fetching

**Step 1: Refresh Page**
```bash
# Refresh browser
F5 or Cmd+R
```

**Step 2: Check Device List**
- Device should still be visible ✅
- Data fetched from Firestore
- Status should be "pending" or "offline"

**Step 3: Check Browser Console**
```javascript
// Should see logs:
"Fetching data for organization: org_..."
"Devices found: X"
```

**Step 4: Check Network Tab**
```
Request: GET /api/org-data?organizationId=org_...
Response: {
  success: true,
  devices: [
    {
      id: "...",
      name: "ESP32-Test-001",
      status: "pending",
      ...
    }
  ]
}
```

---

### Test 3: Backend Logs Verification

**Step 1: Check Backend Console**

When device is created, you should see:
```
🔐 Provisioning device: iot_temperature_sensor_20260410_abc123
🎫 Provisioning token: abc123...
✅ Device provisioned: iot_temperature_sensor_20260410_abc123
   Certificate Serial: 123456789
   Encryption Key: Generated
   Stored in Firebase: ✅
```

**Step 2: Check Frontend Console**

When device is stored, you should see:
```
✅ Device stored in Firestore: doc_id_123
```

---

### Test 4: Multiple Devices

**Step 1: Create 3 More Devices**
```
Device 1:
- Name: ESP32-Sensor-ICU-01
- Type: Temperature Sensor
- Connection: Ethernet

Device 2:
- Name: ESP32-Lock-ER-01
- Type: Door Lock
- Connection: WiFi

Device 3:
- Name: ESP32-Camera-Lobby-01
- Type: Security Camera
- Connection: Ethernet
```

**Step 2: Verify All Devices Appear**
- Device list should show 4 devices ✅
- Each with correct name, type, status
- Statistics should update:
  - Total Devices: 4
  - Offline: 4
  - Online: 0

---

### Test 5: Search and Filter

**Step 1: Search by Name**
```
Search: "ICU"
Result: Should show only ESP32-Sensor-ICU-01
```

**Step 2: Search by Type**
```
Search: "camera"
Result: Should show only ESP32-Camera-Lobby-01
```

**Step 3: Filter by Floor**
```
Filter: Floor 2
Result: Should show only devices on Floor 2
```

---

## 🔍 Troubleshooting

### Issue 1: Device Not Appearing in List

**Check**:
1. Browser console for errors
2. Network tab for API response
3. Firestore console for document
4. organizationId matches

**Solution**:
```bash
# Refresh page
# Check if device has correct organizationId
# Verify API endpoint returns devices
```

### Issue 2: QR Code Not Generating

**Check**:
1. Backend console for errors
2. Network tab for 500 errors
3. Firebase credentials configured

**Solution**:
```bash
# Check backend logs
# Verify Firebase initialized
# Check certificate authority working
```

### Issue 3: Device Stored but Not Fetched

**Check**:
1. Firestore document has organizationId
2. API query filters correctly
3. Document structure matches expected format

**Solution**:
```typescript
// Check Firestore document:
{
  organizationId: "org_123", // Must match user's org
  status: "pending",
  // ... other fields
}
```

---

## 📊 Expected Results

### After Creating 1 Device:

**Dashboard Statistics**:
- Total Devices: 1
- Online: 0
- Offline: 1
- Warnings: 8 (mock data)

**Device List**:
```
┌──────────┬─────────────────┬──────────────────┬───────┬──────────┬────────────┐
│ Status   │ Name            │ Type             │ Floor │ Room     │ Department │
├──────────┼─────────────────┼──────────────────┼───────┼──────────┼────────────┤
│ 🔴 Offline│ ESP32-Test-001  │ Temperature...   │ F2    │ Room 201 │ ICU        │
└──────────┴─────────────────┴──────────────────┴───────┴──────────┴────────────┘
```

**Firestore**:
- Collection: `devices`
- Documents: 1
- Fields: name, type, status, esp32DeviceId, etc.

**Firebase Realtime DB**:
- Path: `/devices/iot_temperature_sensor_.../`
- Children: info, provisioning, security

---

## ✅ Success Checklist

### Frontend:
- [ ] Device form opens
- [ ] All fields fillable
- [ ] QR code generates
- [ ] Device appears in list
- [ ] Search works
- [ ] Filter works
- [ ] Statistics update

### Backend:
- [ ] Provisioning API responds
- [ ] Certificates generated
- [ ] Keys generated
- [ ] QR code created
- [ ] Firebase Realtime DB updated
- [ ] Logs show success

### Firestore:
- [ ] Document created
- [ ] All fields present
- [ ] organizationId correct
- [ ] esp32DeviceId linked
- [ ] Timestamps set

### Firebase Realtime DB:
- [ ] Device path created
- [ ] info/ node present
- [ ] provisioning/ node present
- [ ] security/ node present
- [ ] Token stored

---

## 🎉 When Everything Works

**You should see**:

1. **In Dashboard**:
   - Device list populated from Firestore ✅
   - Statistics accurate ✅
   - Search and filter working ✅
   - Device status displayed ✅

2. **In Firestore Console**:
   - devices collection with documents ✅
   - Each document has complete data ✅
   - organizationId field present ✅

3. **In Firebase Realtime DB Console**:
   - /devices/ path with device nodes ✅
   - Each device has info, provisioning, security ✅
   - Provisioning token stored ✅

4. **In Backend Logs**:
   - "Device provisioned" messages ✅
   - "Stored in Firebase" confirmations ✅
   - No errors ✅

5. **In Frontend Console**:
   - "Device stored in Firestore" messages ✅
   - "Devices found: X" messages ✅
   - No errors ✅

---

## 🚀 Next Steps After Testing

### If Everything Works:
1. ✅ Test with ESP32 hardware
2. ✅ Test device validation flow
3. ✅ Test status updates
4. ⚠️ Implement status sync (Firebase → Firestore)

### If Issues Found:
1. Check this troubleshooting guide
2. Review FIRESTORE_DEVICE_STORAGE.md
3. Check backend and frontend logs
4. Verify Firebase configuration

---

## 📞 Quick Reference

### Servers:
- Backend: http://localhost:8000
- Frontend: http://localhost:9002
- API Docs: http://localhost:8000/docs

### Files:
- Frontend: `src/app/org-dashboard/devices/page.tsx`
- Backend: `src/backend/device_provisioning_api.py`
- Firestore API: `src/app/api/devices/add/route.ts`
- Fetch API: `src/app/api/org-data/route.ts`

### Documentation:
- Complete Flow: `FIRESTORE_DEVICE_STORAGE.md`
- Integration: `ESP32_QR_PROVISIONING_INTEGRATED.md`
- System Ready: `COMPLETE_SYSTEM_READY.md`

---

**Author**: SafeEdge Team - Imagine Cup 2026  
**Date**: April 10, 2026  
**Status**: ✅ READY TO TEST!
