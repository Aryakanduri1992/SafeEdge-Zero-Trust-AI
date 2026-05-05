# SafeEdge Cloud Architecture Documentation

## Overview

SafeEdge uses a **"Firebase Now, Azure Later"** strategy with a cloud abstraction layer that enables seamless migration from Firebase (MVP) to Azure (Production) without code changes.

## Current Architecture (Firebase MVP)

```
ESP32 Devices → Firebase Realtime DB → Next.js Dashboard
     ↓              ↓                      ↓
AES Encryption → Firestore Collections → React Components
     ↓              ↓                      ↓
Sensor Data → Firebase Auth → Role-based Access
```

### Components:
- **Firebase Authentication**: User management and authentication
- **Firestore**: Structured data (organizations, departments, devices)
- **Firebase Realtime Database**: ESP32 sensor data streaming
- **Firebase Storage**: File uploads and firmware distribution

### Cost: ~$0/month (Free tier during development)

## Future Architecture (Azure Production)

```
ESP32 Devices → Azure IoT Hub → Azure Functions → Azure Storage → Dashboard
     ↓              ↓              ↓               ↓              ↓
X.509 Certs → MQTT Protocol → Event Processing → Blob/Table → React UI
     ↓              ↓              ↓               ↓              ↓
TinyML → Azure ML Pipeline → Azure OpenAI → Cost Optimization → Real-time Updates
```

### Components:
- **Azure AD B2C**: User authentication and management
- **Azure IoT Hub**: ESP32 device management and communication
- **Azure Table Storage**: Structured data (90% cheaper than Cosmos DB)
- **Azure Blob Storage**: Time-series sensor data (95% cheaper than Firestore)
- **Azure Functions**: Serverless event processing
- **Azure Machine Learning**: MLOps pipeline for continuous learning
- **Azure OpenAI**: AI-powered security analysis
- **Azure Speech Services**: Voice synthesis for alerts

### Cost: ~$30/month (85% savings vs Firebase + External AI)

## Cloud Abstraction Layer

### Architecture

```typescript
CloudService (Abstract)
    ├── FirebaseCloudService (Current)
    └── AzureCloudService (Future)
```

### Key Features:

1. **Unified Interface**: Single API for both Firebase and Azure
2. **Environment-Based Configuration**: Switch providers via environment variable
3. **Automatic Retry Logic**: Exponential backoff for failed operations
4. **Performance Monitoring**: Built-in latency and error tracking
5. **Real-time Device Monitoring**: Subscribe to device status changes
6. **Health Checks**: Monitor system health and connection metrics

### Usage Example:

```typescript
import { CloudServiceFactory, getCloudConfig } from '@/lib/cloud-service';

// Initialize cloud service (automatically selects Firebase or Azure)
const cloudService = CloudServiceFactory.getInstance(getCloudConfig());

// Use unified API (works with both providers)
await cloudService.login({ email, password });
await cloudService.createDevice(deviceData);
await cloudService.storeSensorData(sensorData);

// Real-time monitoring
const unsubscribe = cloudService.subscribeToDeviceStatus(deviceId, (status) => {
  console.log('Device status:', status);
});

// Health check
const health = await cloudService.healthCheck();
console.log('System status:', health.status);
```

## Migration Process (48 Hours)

### Phase 1: Azure Infrastructure Setup (16 hours)
1. Deploy Azure IoT Hub
2. Configure device provisioning
3. Deploy Azure Table Storage and Blob Storage
4. Set up Azure AD B2C tenant
5. Deploy Azure Functions

### Phase 2: Data Migration (16 hours)
1. Run migration utilities from `azure-migration/` folder
2. Migrate Firestore collections → Azure Table Storage
3. Migrate Firebase Storage → Azure Blob Storage
4. Update ESP32 firmware to use MQTT with X.509 certificates
5. Test device connectivity

### Phase 3: AI Services Integration (8 hours)
1. Deploy Azure OpenAI service
2. Deploy Azure Speech Services
3. Deploy Azure Machine Learning workspace
4. Migrate ML pipeline and model deployment
5. Test AI analysis and voice synthesis

### Phase 4: Testing and Validation (8 hours)
1. End-to-end system testing
2. Performance validation
3. Security audit
4. Production deployment

## Environment Configuration

### Firebase (Current)

```env
NEXT_PUBLIC_CLOUD_PROVIDER=firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
```

### Azure (Future)

```env
NEXT_PUBLIC_CLOUD_PROVIDER=azure
NEXT_PUBLIC_AZURE_TENANT_ID=your_tenant_id
NEXT_PUBLIC_AZURE_CLIENT_ID=your_client_id
NEXT_PUBLIC_AZURE_STORAGE_ACCOUNT=your_storage_account
AZURE_IOT_HUB_CONNECTION_STRING=your_connection_string
AZURE_OPENAI_ENDPOINT=your_openai_endpoint
AZURE_SPEECH_SERVICE_KEY=your_speech_key
```

## Performance Monitoring

### Firebase Cloud Service Metrics:
- Total requests
- Successful/failed requests
- Average latency
- Error rate
- Recent errors (last 10)

### Health Check Response:
```typescript
{
  status: 'healthy' | 'degraded' | 'down',
  latency: number, // ms
  errors: string[]
}
```

### Connection Metrics:
```typescript
{
  activeConnections: number,
  avgLatency: number, // ms
  errorRate: number // 0-1
}
```

## Device Status Monitoring

### Real-time Status Updates:
```typescript
interface DeviceStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'alerting' | 'maintenance';
  lastSeen: string;
  batteryLevel?: number;
  signalStrength?: number;
  threatLevel?: 'safe' | 'warning' | 'critical';
  location?: string;
}
```

### Sensor Data Structure (Azure-Compatible):
```typescript
interface SensorData {
  deviceId: string;
  timestamp: string;
  encryptedData?: string;
  
  // Environmental Control
  temperature?: number;
  humidity?: number;
  airPressure?: number;
  oxygenLevel?: number;
  co2Level?: number;
  
  // Security & Access Control
  motionDetected?: boolean;
  vibrationLevel?: number;
  doorStatus?: boolean;
  soundLevel?: number;
  
  // Power & System Health
  powerVoltage?: number;
  wifiSignalStrength?: number;
  systemTemperature?: number;
  
  // Security Analysis
  threatLevel?: 'safe' | 'warning' | 'critical';
  anomalyDetected?: boolean;
  securityScore?: number;
}
```

## Cost Comparison

### Firebase + External AI (Current MVP):
| Service | Cost/Month |
|---------|-----------|
| Firebase Free Tier | $0 |
| Groq API (Free) | $0 |
| ElevenLabs (Free) | $0 |
| **Total** | **$0** |

### Firebase + External AI (Production Scale):
| Service | Cost/Month |
|---------|-----------|
| Firebase (1M ops, 100GB) | $120 |
| OpenAI API | $50 |
| ElevenLabs Pro | $30 |
| **Total** | **$200** |

### Azure (Production Scale):
| Service | Cost/Month |
|---------|-----------|
| Azure IoT Hub | $25 |
| Azure Table Storage | $2 |
| Azure Blob Storage | $3 |
| Azure Functions | $5 |
| Azure OpenAI | $10 |
| Azure Speech Services | $5 |
| **Total** | **$50** |

### Savings: 75% cost reduction vs Firebase production

## Security Features

### Current (Firebase):
- AES-128-CBC encryption for sensor data
- Firebase Authentication with email/password
- Firestore security rules for role-based access
- SSL/TLS for all communications

### Future (Azure):
- X.509 certificate-based device authentication
- Azure AD B2C with multi-factor authentication
- Azure Key Vault for secrets management
- Azure Security Center for threat detection
- Compliance: HIPAA, SOC 2, ISO 27001

## Scalability

### Firebase (Current):
- Supports: 100-1,000 devices
- Latency: 100-500ms
- Throughput: 10,000 ops/sec

### Azure (Future):
- Supports: 1,000,000+ devices
- Latency: 50-200ms
- Throughput: 1,000,000+ ops/sec
- Auto-scaling with Azure Functions
- Global distribution with Azure CDN

## Next Steps

1. ✅ **Complete**: Cloud abstraction layer implementation
2. ✅ **Complete**: Firebase optimization with retry logic
3. ✅ **Complete**: Azure service stubs for future migration
4. 🔄 **In Progress**: Real-time device monitoring dashboard
5. ⏳ **Pending**: Azure deployment (post-competition funding)

## References

- [Azure Migration Documentation](../azure-migration/README.md)
- [Firebase Cloud Service](../src/lib/firebase-cloud-service.ts)
- [Azure Cloud Service](../src/lib/azure-cloud-service.ts)
- [Cloud Service Interface](../src/lib/cloud-service.ts)