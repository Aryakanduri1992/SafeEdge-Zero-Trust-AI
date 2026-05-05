# SafeEdge Python Backend

## Overview

Python backend for SafeEdge IoT Security Platform implementing:
- **Task 2.1**: Optimized Firebase integration with monitoring
- **Task 2.2**: Cloud abstraction layer (Firebase + Azure stub)
- **Task 3**: AI Security Response Pipeline (coming next)
- **Task 5**: MLOps Pipeline (coming next)

## Architecture

```
┌─────────────────────────────────────────┐
│ Next.js Frontend (TypeScript)           │
│ Port: 9002                              │
└─────────────────────────────────────────┘
                ↓ HTTP/REST
┌─────────────────────────────────────────┐
│ Python Backend (FastAPI)                │
│ Port: 8000                              │
│ ├── Cloud Abstraction Layer            │
│ ├── Firebase Service (optimized)       │
│ ├── Azure Service (stub)               │
│ └── Security Pipeline (next)           │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Firebase / Azure                        │
└─────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd src/backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```bash
# Cloud Provider
CLOUD_PROVIDER=firebase

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# AI Services (for Task 3)
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true
```

### 3. Get Firebase Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-credentials.json` in `src/backend/`

### 4. Run Server

```bash
# Development mode (auto-reload)
python -m uvicorn main:app --reload --port 8000

# Or using the main script
python main.py
```

Server will start at: http://localhost:8000

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "latency_ms": 45.2,
  "errors": [],
  "metrics": {
    "active_connections": 1,
    "avg_latency_ms": 52.3,
    "error_rate": 0.02
  }
}
```

### Authentication
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Store Sensor Data
```bash
POST /api/sensor-data
Content-Type: application/json

{
  "device_id": "incubator_001",
  "temperature": 37.2,
  "humidity": 55.0,
  "motion_detected": false,
  "threat_level": "safe",
  "security_score": 95
}
```

### Get Sensor History
```bash
GET /api/sensor-data/incubator_001?hours=24
```

### Get Device Status
```bash
GET /api/devices/incubator_001/status
```

### Get Metrics
```bash
GET /api/metrics
```

## Features

### Task 2.1: Firebase Optimization ✅

- ✅ Automatic retry logic with exponential backoff (3 attempts)
- ✅ Performance monitoring (latency, success/failure rates)
- ✅ Real-time device monitoring
- ✅ Health checks and connection metrics
- ✅ Sensor data storage and history queries

### Task 2.2: Cloud Abstraction Layer ✅

- ✅ Abstract `CloudService` class with unified API
- ✅ `FirebaseCloudService` with full optimization
- ✅ `AzureCloudService` stub for future migration
- ✅ `CloudServiceFactory` for automatic provider selection
- ✅ Environment-based configuration

## Testing

### Test Health Check
```bash
curl http://localhost:8000/health
```

### Test Sensor Data Storage
```bash
curl -X POST http://localhost:8000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "test_001",
    "temperature": 37.5,
    "humidity": 55,
    "threat_level": "safe",
    "security_score": 95
  }'
```

### Test Metrics
```bash
curl http://localhost:8000/api/metrics
```

## Performance Metrics

Expected performance:
- **Health Check**: <100ms
- **Sensor Data Storage**: <200ms
- **Sensor History Query**: <500ms
- **Device Status**: <150ms

## Azure Migration

The Azure implementation is ready as a stub. To migrate:

1. Update `.env`:
   ```bash
   CLOUD_PROVIDER=azure
   AZURE_IOT_HUB_CONNECTION_STRING=...
   AZURE_STORAGE_ACCOUNT=...
   ```

2. Implement Azure methods in `azure_cloud_service.py`

3. Restart server

**Estimated Migration Time**: 48 hours

See `azure_cloud_service.py` for detailed migration guide.

## Next Steps

- [ ] **Task 3**: Implement AI Security Response Pipeline (Python)
- [ ] **Task 4**: Phone Alert Integration (Python)
- [ ] **Task 5**: MLOps Pipeline (Python + scikit-learn)

## Troubleshooting

### Issue: "Firebase credentials not found"
**Solution**: Ensure `firebase-credentials.json` is in `src/backend/` directory

### Issue: "Port 8000 already in use"
**Solution**: Change port in `.env` or kill existing process:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Issue: "Module not found"
**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

## Documentation

- [Cloud Service API](./cloud_service.py)
- [Firebase Implementation](./firebase_cloud_service.py)
- [Azure Migration Guide](./azure_cloud_service.py)
- [Configuration](./config.py)

## Support

For issues or questions, check:
1. [FastAPI Documentation](https://fastapi.tiangolo.com/)
2. [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
3. [Azure Python SDK](https://docs.microsoft.com/python/azure/)
