# LumeEdge Azure Functions - Zero-Trust IoT Security Platform

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ESP32 EDGE DEVICE                                   │
│                         (LumeEdge Security Box)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  • X.509 Certificate Authentication                                      │   │
│  │  • Sensors: Temperature, Humidity, Motion, Door, Vibration              │   │
│  │  • MQTT/TLS 8883 → Azure IoT Hub                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ MQTT/TLS (X.509 Auth)
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AZURE IOT HUB (Free Tier)                              │
│                        lume-iothub.azure-devices.net                            │
│                                                                                  │
│  • Device: lumeedge-001 (X.509 Self-Signed)                                     │
│  • Ingestion ONLY (no storage)                                                  │
│  • Event Hub Compatible Endpoint → Azure Functions                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ Event Hub Trigger
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AZURE FUNCTIONS (Flex Consumption, Python)                    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                        IoTHubTrigger Function                             │  │
│  │                                                                           │  │
│  │  1. ZERO-TRUST VALIDATION PIPELINE                                       │  │
│  │     ├─ Device Allowlist Check (reject unknown devices)                   │  │
│  │     ├─ Schema Validation (strict, no extra fields)                       │  │
│  │     ├─ Timestamp Sanity Check (clock skew, age limits)                   │  │
│  │     ├─ Replay Attack Detection (message ID + payload hash)               │  │
│  │     └─ Message Flood Detection (rate limiting)                           │  │
│  │                                                                           │  │
│  │  2. ANOMALY DETECTION (AI-Ready)                                         │  │
│  │     ├─ Threshold Rules (temp, humidity, signal, battery)                 │  │
│  │     ├─ Pattern Matching (behavioral anomalies)                           │  │
│  │     ├─ Statistical Analysis (z-score deviation)                          │  │
│  │     └─ ML Hooks (Azure Anomaly Detector ready)                           │  │
│  │                                                                           │  │
│  │  3. IN-MEMORY AGGREGATION (Cost Optimized)                               │  │
│  │     ├─ 1-minute / 5-minute windows                                       │  │
│  │     ├─ Compute: avg, min, max, event counts                              │  │
│  │     └─ Store ONLY aggregated data (no raw telemetry)                     │  │
│  │                                                                           │  │
│  │  4. ALERT WORKFLOW                                                        │  │
│  │     ├─ Auto-block device (for critical attacks)                          │  │
│  │     ├─ Store security event                                              │  │
│  │     ├─ Create attack incident                                            │  │
│  │     └─ Trigger phone call (Twilio)                                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         REST API Functions                                │  │
│  │                                                                           │  │
│  │  GET  /api/dashboard/stats      → Aggregated statistics                  │  │
│  │  GET  /api/dashboard/health     → System health status                   │  │
│  │  GET  /api/dashboard/threats    → Active threats summary                 │  │
│  │  GET  /api/telemetry            → Aggregated telemetry (no raw data)     │  │
│  │  GET  /api/security-events      → Security events list                   │  │
│  │  GET  /api/devices              → Device list                            │  │
│  │  GET  /api/devices/{id}         → Device details                         │  │
│  │  POST /api/devices/{id}/block   → Block device                           │  │
│  │  POST /api/devices/{id}/unblock → Unblock device                         │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        AZURE SQL DATABASE (Basic Tier)                           │
│                                                                                  │
│  Tables:                                                                         │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │    devices      │  │ telemetry_aggregates│  │    security_events          │ │
│  │ • device_id     │  │ • window_start/end  │  │ • event_id                  │ │
│  │ • status        │  │ • temp avg/min/max  │  │ • severity                  │ │
│  │ • trust_score   │  │ • humidity stats    │  │ • attack_type               │ │
│  │ • blocked_at    │  │ • event counts      │  │ • action_taken              │ │
│  └─────────────────┘  └─────────────────────┘  └─────────────────────────────┘ │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────────┐  ┌─────────────────────────────┐ │
│  │  device_health  │  │  attack_incidents   │  │    message_tracking         │ │
│  │ • uptime        │  │ • incident_id       │  │ • message_id                │ │
│  │ • battery       │  │ • attack_type       │  │ • message_hash              │ │
│  │ • signal        │  │ • confidence_score  │  │ • device_timestamp          │ │
│  │ • firmware      │  │ • response_actions  │  │ (auto-purged hourly)        │ │
│  └─────────────────┘  └─────────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND DASHBOARD                                     │
│                                                                                  │
│  • Consumes REST APIs ONLY                                                      │
│  • NEVER accesses IoT Hub directly                                              │
│  • NEVER sees raw telemetry                                                     │
│  • NEVER sees secrets                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Folder Structure

```
azure-functions/
├── README.md                    # This file
├── host.json                    # Azure Functions host configuration
├── local.settings.json          # Local development settings (gitignored)
├── local.settings.example.json  # Template for local settings
├── requirements.txt             # Python dependencies
├── DEPLOYMENT.md                # Deployment instructions
│
├── sql/
│   └── schema.sql              # Azure SQL DDL (all tables, views, procedures)
│
├── shared/                      # Shared modules
│   ├── __init__.py             # Module exports
│   ├── config.py               # Configuration management
│   ├── database.py             # Azure SQL connection helper
│   ├── validators.py           # Zero-Trust payload validation
│   ├── anomaly_detector.py     # Anomaly detection engine
│   ├── aggregator.py           # In-memory telemetry aggregation
│   └── alert_service.py        # Alert/notification service
│
├── IoTHubTrigger/              # Event Hub trigger for IoT Hub
│   ├── __init__.py             # Main processing logic
│   └── function.json           # Binding configuration
│
├── HttpApiDashboard/           # Dashboard statistics API
│   ├── __init__.py
│   └── function.json
│
├── HttpApiDevices/             # Device management API
│   ├── __init__.py
│   └── function.json
│
├── HttpApiTelemetry/           # Telemetry data API
│   ├── __init__.py
│   └── function.json
│
└── HttpApiSecurityEvents/      # Security events API
    ├── __init__.py
    └── function.json
```


## 🔒 Security Principles (Zero-Trust)

### 1. Device Validation
- Every message validated against registered device allowlist
- Unknown devices are immediately rejected
- Device ID format strictly validated

### 2. Schema Enforcement
- Pydantic models with `extra='forbid'` (reject unknown fields)
- Type validation for all sensor readings
- Size limits on all string fields

### 3. Timestamp Sanity
- Reject timestamps > 5 minutes in future (clock skew attack)
- Reject timestamps > 1 hour old (replay indicator)
- Log warnings for missing timestamps

### 4. Replay Attack Detection
- Track message IDs (must be unique)
- Track payload hashes (detect duplicate content)
- Auto-block devices on replay detection

### 5. Message Flood Detection
- Rate limit: 10 messages/second per device
- Rate limit: 100 messages/minute per device
- Auto-block on flood detection

### 6. No Raw Data Exposure
- Frontend only sees aggregated telemetry
- Raw payloads never exposed via API
- Secrets stored in environment variables only

### 7. Audit Trail
- All security events logged with timestamps
- Attack incidents tracked with forensic data
- Device trust scores adjusted based on behavior

## 📊 REST API Reference

### Dashboard APIs

#### GET /api/dashboard/stats
Returns aggregated dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "devices": {
      "total": 5,
      "active": 4,
      "blocked": 1
    },
    "security_events_24h": {
      "total": 12,
      "critical": 1,
      "high": 3,
      "unresolved": 2
    },
    "telemetry_1h": {
      "message_count": 1250,
      "anomaly_count": 3
    },
    "attack_incidents": {
      "total": 5,
      "active": 1
    },
    "system": {
      "timestamp": "2026-01-09T10:30:00Z",
      "anomaly_detection_enabled": true,
      "phone_alerts_enabled": true
    }
  }
}
```

#### GET /api/dashboard/health
Returns system health status.

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "timestamp": "2026-01-09T10:30:00Z",
    "components": {
      "database": { "status": "healthy", "type": "Azure SQL" },
      "iot_hub": { "status": "configured", "name": "lume-iothub" },
      "alerts": { "status": "configured", "phone_alerts": true },
      "anomaly_detection": { "status": "enabled" }
    }
  }
}
```

### Telemetry API

#### GET /api/telemetry
Returns AGGREGATED telemetry data (never raw).

**Query Parameters:**
- `device_id` (optional): Filter by device
- `hours` (optional): Time range, default 24, max 168
- `limit` (optional): Max records, default 100, max 1000

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data_type": "aggregated",
  "filters": {
    "device_id": "lumeedge-001",
    "hours": 24,
    "limit": 100
  },
  "telemetry": [
    {
      "device_id": "lumeedge-001",
      "window_start": "2026-01-09T10:00:00Z",
      "window_end": "2026-01-09T10:01:00Z",
      "temp_avg": 23.5,
      "temp_min": 22.1,
      "temp_max": 24.8,
      "humidity_avg": 45.2,
      "motion_events": 3,
      "message_count": 60,
      "anomaly_count": 0,
      "signal_avg": -65,
      "battery_avg": 87.5
    }
  ]
}
```

### Security Events API

#### GET /api/security-events
Returns security events list.

**Query Parameters:**
- `device_id` (optional): Filter by device
- `severity` (optional): critical, high, medium, low, info
- `unresolved` (optional): 1 for unresolved only
- `limit` (optional): Max records, default 100

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 12,
    "by_severity": { "critical": 1, "high": 3, "medium": 5, "low": 3 }
  },
  "events": [
    {
      "event_id": "abc123",
      "device_id": "lumeedge-001",
      "event_type": "anomaly_detected",
      "severity": "high",
      "title": "Temperature threshold breach",
      "attack_type": "threshold_breach",
      "confidence_score": 85.0,
      "action_taken": "monitored",
      "created_at": "2026-01-09T10:15:00Z"
    }
  ]
}
```

### Device APIs

#### GET /api/devices
Returns all devices.

**Query Parameters:**
- `status` (optional): active, blocked, quarantine

#### GET /api/devices/{device_id}
Returns single device details.

#### POST /api/devices/{device_id}/block
Block a device.

**Request Body:**
```json
{
  "reason": "Manual block due to suspicious activity"
}
```

#### POST /api/devices/{device_id}/unblock
Unblock a device. Trust score reset to 50.

## 🚀 Quick Start

### Prerequisites
- Azure Functions Core Tools v4
- Python 3.9+
- Azure SQL Database
- Azure IoT Hub

### Local Development

1. Clone and navigate to azure-functions directory
2. Copy settings template:
   ```bash
   cp local.settings.example.json local.settings.json
   ```
3. Configure your Azure SQL and IoT Hub connection strings
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Run locally:
   ```bash
   func start
   ```

### Deploy to Azure

See `DEPLOYMENT.md` for detailed deployment instructions.

## 💰 Cost Optimization (Imagine Cup MVP)

| Resource | Tier | Monthly Cost |
|----------|------|--------------|
| Azure Functions | Flex Consumption | ~$0 (free tier) |
| Azure IoT Hub | Free | $0 |
| Azure SQL | Basic (5 DTU) | ~$5 |
| **Total** | | **~$5/month** |

### Cost Optimization Strategies:
1. **No raw telemetry storage** - Only aggregated data stored
2. **In-memory aggregation** - Reduces database writes by 60x
3. **Message tracking auto-purge** - Hourly cleanup of replay detection data
4. **Efficient batching** - Aggregate windows reduce insert frequency

## 🧪 Testing

### Test IoT Hub Trigger
```bash
# Simulate telemetry message
curl -X POST http://localhost:7071/api/test-telemetry \
  -H "Content-Type: application/json" \
  -d '{"device_id":"lumeedge-001","temperature":25.5,"humidity":45}'
```

### Test REST APIs
```bash
# Dashboard stats
curl http://localhost:7071/api/dashboard/stats

# Telemetry
curl "http://localhost:7071/api/telemetry?device_id=lumeedge-001&hours=24"

# Security events
curl "http://localhost:7071/api/security-events?severity=critical"

# Block device
curl -X POST http://localhost:7071/api/devices/lumeedge-001/block \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test block"}'
```

## 📝 For Imagine Cup Judges

### Key Differentiators

1. **Zero-Trust Architecture**: Every device message is validated against multiple security checks before processing.

2. **Cost-Optimized Design**: Achieves enterprise-grade security on a $5/month budget through intelligent aggregation.

3. **AI-Ready**: Rule-based detection with hooks for Azure Anomaly Detector integration.

4. **Real-Time Response**: Automatic device blocking and phone alerts for critical attacks.

5. **Privacy by Design**: Raw telemetry never stored or exposed - only aggregated insights.

### Security Attack Detection

| Attack Type | Detection Method | Response |
|-------------|------------------|----------|
| Replay Attack | Message ID + Payload Hash | Auto-block + Alert |
| DoS/Flood | Rate Limiting | Auto-block + Alert |
| Clock Skew | Timestamp Validation | Reject Message |
| Injection | Schema Validation | Reject Message |
| Unknown Device | Allowlist Check | Reject + Log |

---

Built with ❤️ for Imagine Cup 2026
