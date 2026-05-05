# Mobile Provisioning - Quick Reference Card

## 🚀 5-Minute Setup Guide

### Step 1: Create Device (Dashboard)
```
1. Open dashboard → Click "Create Device"
2. Fill form:
   - Device Name: "Temperature Sensor #1"
   - Device Type: "Temperature Sensor"
   - Location: "Ward A - Room 101"
   - Connection: "Ethernet" or "WiFi"
   - WiFi SSID/Password (if WiFi selected)
3. Click "Next" → Get QR Code
```

### Step 2: Provision ESP32 (Mobile)
```
1. Power on ESP32
2. ESP32 creates WiFi AP: "SafeEdge-XXXXXX"
3. Open SafeEdge Mobile App
4. Tap "Scan QR Code"
5. Scan QR from dashboard
6. Mobile connects to ESP32 automatically
7. Wait for provisioning (30 seconds)
8. Done! ✅
```

### Step 3: Verify (ESP32)
```
1. ESP32 restarts automatically
2. Green LED = Connected ✅
3. Red LED = Error ❌
4. Yellow LED = Provisioning mode
```

---

## 📱 Mobile App URLs

- **Dashboard**: `http://localhost:3000/dashboard/devices`
- **Mobile App**: `http://localhost:3000/mobile/provision`
- **Backend API**: `http://localhost:8000`

---

## 🔌 ESP32 Connection

### WiFi AP Mode (Provisioning):
- **SSID**: `SafeEdge-XXXXXX` (auto-generated)
- **Password**: `SafeEdge2026`
- **IP**: `192.168.4.1`
- **Port**: `80`

### Web Interface:
- **Status Page**: `http://192.168.4.1/`
- **Provision**: `POST http://192.168.4.1/provision`
- **Status API**: `GET http://192.168.4.1/status`

---

## 🔐 Security Checks

### Backend Validates:
1. ✅ Device ID exists
2. ✅ Provisioning token matches
3. ✅ Token not already used
4. ✅ MAC address not bound to different device

### If ANY check fails:
- ❌ Provisioning rejected
- 🔒 Enterprise security maintained

---

## 🧪 Quick Test

### Test Backend:
```bash
curl -X POST http://localhost:8000/api/devices/provision \
  -H "Content-Type: application/json" \
  -d '{
    "device_name": "Test Sensor",
    "device_type": "temperature_sensor",
    "location": "Test",
    "organization_id": "org_test",
    "connection_type": "ethernet"
  }'
```

### Test Validation:
```bash
curl -X POST http://localhost:8000/api/devices/validate \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "iot_temp_sensor_001",
    "provisioning_token": "token_here",
    "esp32_mac_address": "AA:BB:CC:DD:EE:FF"
  }'
```

---

## 🐛 Troubleshooting

### Problem: Can't find ESP32 WiFi AP
**Solution**: 
- Check ESP32 is powered on
- Look for "SafeEdge-" in WiFi list
- Check Serial Monitor for SSID

### Problem: Validation failed
**Solution**:
- Check backend is running
- Verify device_id is correct
- Ensure token not already used
- Check MAC address not bound

### Problem: ESP32 won't connect after provisioning
**Solution**:
- Check Ethernet cable (if Ethernet)
- Verify WiFi credentials (if WiFi)
- Check Serial Monitor for errors
- Verify gateway address

---

## 📊 LED Indicators

| LED | Status | Meaning |
|-----|--------|---------|
| 🟡 Blinking | Provisioning | Waiting for mobile |
| 🟢 Solid | Connected | Operational |
| 🔴 Blinking | Error | Not connected |
| 🟡 Solid | Validating | Checking with backend |

---

## 📁 Key Files

### Backend:
- `src/backend/device_provisioning_api.py` - API endpoints
- `src/backend/main.py` - Main server

### Frontend:
- `src/components/DeviceProvisioningWizard.tsx` - Dashboard wizard
- `src/components/MobileProvisioningApp.tsx` - Mobile app

### ESP32:
- `esp32_secure/mobile_provisioning.h` - Provisioning module
- `esp32_secure/mobile_provisioning_example.ino` - Complete example
- `esp32_secure/device_provisioning.h` - Storage module

### Documentation:
- `MOBILE_PROVISIONING_COMPLETE.md` - Full documentation
- `FINAL_IMPLEMENTATION_STATUS.md` - Implementation status
- `INTEGRATION_EXAMPLE.md` - Integration examples

---

## 🎯 Quick Commands

### Start Backend:
```bash
cd src/backend
python main.py
```

### Start Frontend:
```bash
npm run dev
```

### Upload ESP32:
```bash
# In Arduino IDE or PlatformIO
# Open: esp32_secure/mobile_provisioning_example.ino
# Upload to ESP32
```

### Check ESP32 Status:
```bash
# Connect to Serial Monitor (115200 baud)
# Look for:
# ✅ WiFi AP started
# ✅ Web server started
# 📱 Ready for mobile provisioning!
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] ESP32 powered on
- [ ] ESP32 WiFi AP visible
- [ ] Mobile can scan QR code
- [ ] Mobile can connect to ESP32
- [ ] Backend validates successfully
- [ ] ESP32 stores credentials
- [ ] ESP32 connects to network
- [ ] Green LED on = Success! ✅

---

## 📞 Support

### Check Logs:
- **Backend**: Terminal output
- **Frontend**: Browser console (F12)
- **ESP32**: Serial Monitor (115200 baud)

### Common Issues:
1. **Backend not responding**: Check if running on port 8000
2. **QR code not scanning**: Check camera permissions
3. **ESP32 not found**: Check WiFi AP is broadcasting
4. **Validation failed**: Check token not already used
5. **Won't connect**: Check network credentials

---

## 🎉 That's It!

**Total Time**: ~5 minutes per device  
**Security**: Enterprise-grade ✅  
**Complexity**: Simple for users ✅  
**Reliability**: Production-ready ✅

---

**Need Help?** Read `MOBILE_PROVISIONING_COMPLETE.md` for detailed documentation.

**Author**: SafeEdge Team - Imagine Cup 2026
