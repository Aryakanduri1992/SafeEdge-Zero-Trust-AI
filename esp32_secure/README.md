# ESP32 Secure Configuration

This folder contains secure ESP32 configuration, firmware, and integration scripts for SafeEdge.

## Quick Start

### Step 1: Start the Backend
```bash
cd ../src/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Test Communication
```bash
python test_esp32_backend.py
```

### Step 3: Upload Firmware to ESP32
```bash
python upload_and_run.py
```

## Hardware Setup

### LED Connections (Optional)
| LED | GPIO | Purpose |
|-----|------|---------|
| Green | 27 | Safe - All systems normal |
| Yellow | 26 | Warning - Processing/Alert |
| Red | 25 | Danger - Attack detected |

### Buzzer Connection (Optional)
| Component | GPIO |
|-----------|------|
| Buzzer | 32 |

## Files

| File | Purpose |
|------|---------|
| `wifi_credentials.secret` | Your WiFi credentials (gitignored) |
| `boot.py` | Auto-connects to WiFi on ESP32 boot |
| `main.py` | SafeEdge firmware (MicroPython) |
| `safeedge_esp32_firmware.py` | Full firmware with LED/Buzzer support |
| `upload_and_run.py` | Upload firmware to ESP32 |
| `test_esp32_backend.py` | Test full communication pipeline |
| `check_status.py` | Check ESP32 WiFi status |
| `connect_wifi_now.py` | Quick WiFi connection |
| `flash_micropython.py` | Flash MicroPython firmware |

## LED Status Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Safe | All systems normal, no threats |
| 🟡 Yellow | Warning | Processing alert or minor issue |
| 🔴 Red | Danger | Attack detected, critical alert |

## Buzzer Alerts

| Pattern | Meaning |
|---------|---------|
| 2 short beeps | Warning alert |
| Rapid alternating | Danger/Attack alert |
| Ascending tones | Success/Connection |

## API Endpoints

The ESP32 communicates with these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/esp32/register` | POST | Register device |
| `/api/esp32/heartbeat` | POST | Send heartbeat |
| `/api/esp32/devices` | GET | List all devices |
| `/api/sensor-data` | POST | Send sensor data |
| `/api/esp32/alert` | POST | Trigger alert |

## Security

- `wifi_credentials.secret` is gitignored
- Credentials are never displayed in logs
- All communication uses HTTP (HTTPS for production)
