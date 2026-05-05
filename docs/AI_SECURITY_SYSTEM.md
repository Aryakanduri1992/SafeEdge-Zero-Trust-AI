# SafeEdge AI Security Response System

## Overview

The AI Security Response System is a complete pipeline that detects, blocks, analyzes, and responds to security threats targeting hospital incubator systems. Built using free-tier APIs (Groq + ElevenLabs) with Azure-compatible architecture.

## Architecture

```
ESP32 Sensor Data → Security Event Detector → Attack Blocker → Groq AI Analyzer → ElevenLabs Voice → Phone Alert
     ↓                      ↓                      ↓                ↓                    ↓              ↓
Firebase Storage    Anomaly Detection    Countermeasures    Incident Analysis    Voice Synthesis   Multi-Channel
```

## Components

### 1. Security Event Detector (`security-event-detector.ts`)

**Purpose**: Analyzes sensor data for anomalies and security threats

**Features**:
- Patient safety threshold monitoring
- Multi-parameter anomaly detection
- Threat classification (temperature, access, power, network, vibration, environmental)
- Security score calculation (0-100)

**Thresholds**:
- Temperature: 36.5-37.5°C (±0.5°C triggers alert)
- Humidity: 50-60% RH (±5% triggers warning)
- Oxygen: 21-40% O2
- CO2: <0.5%
- Vibration: <0.5g (tampering detection)
- Power: >11V (backup activation)
- Sound: <70dB

**Example Usage**:
```typescript
import { SecurityEventDetector } from '@/lib/security-event-detector';

const detector = new SecurityEventDetector();
const event = detector.detectAnomalies(sensorData);

if (event) {
  console.log(`Threat detected: ${event.threatType} (${event.threatLevel})`);
  console.log(`Anomaly score: ${event.anomalyScore}/100`);
}
```

### 2. Attack Blocker (`attack-blocker.ts`)

**Purpose**: Implements countermeasure strategies for detected threats

**Blocking Strategies**:
- `network_isolation`: Isolate device from network (70-80% success)
- `system_backup`: Activate backup systems (85-90% success)
- `temperature_override`: Override temperature control (65-75% success)
- `access_lockdown`: Lock physical access (80% success)
- `alert_escalation`: Escalate to human operators (100% success)

**Features**:
- Multiple blocking attempts with fallback
- Success/failure detection
- Blocking history tracking
- Performance metrics

**Example Usage**:
```typescript
import { AttackBlocker } from '@/lib/attack-blocker';

const blocker = new AttackBlocker();
const result = await blocker.blockThreat(event);

console.log(`Blocking ${result.blocked ? 'SUCCESS' : 'FAILED'}`);
console.log(`Final status: ${result.finalStatus}`);
console.log(`Human intervention: ${result.requiresHumanIntervention}`);
```

### 3. Groq AI Analyzer (`groq-analyzer.ts`)

**Purpose**: Intelligent incident analysis using LLaMA 3.3 70B

**Features**:
- Context-aware analysis (blocking success/failure)
- Differentiated responses (calm vs urgent)
- Confidence scoring
- Rate limiting (30 requests/minute free tier)
- Fallback to rule-based analysis

**API Configuration**:
- Model: `llama-3.3-70b-versatile`
- Max Tokens: 500
- Temperature: 0.7
- Rate Limit: 30 requests/minute

**Example Usage**:
```typescript
import { GroqAnalyzer } from '@/lib/groq-analyzer';

const analyzer = new GroqAnalyzer({
  apiKey: process.env.GROQ_API_KEY!,
});

const analysis = await analyzer.analyzeIncident(event, blockingResult);

console.log(`Summary: ${analysis.summary}`);
console.log(`Voice script: ${analysis.voiceScript}`);
console.log(`Urgency: ${analysis.urgencyLevel}`);
```

### 4. ElevenLabs Voice Generator (`elevenlabs-voice.ts`)

**Purpose**: Generate voice alerts with differentiated responses

**Voice Types**:
- **Calm** (successful blocking): Reassuring, professional tone
  - Example: "Patient safe. Threat neutralized. All systems operating normally."
- **Urgent** (failed blocking): Directive, urgent tone with alert sounds
  - Example: "[ALERT TONE] Critical alert. Security breach in progress. Immediate response required."

**Features**:
- Character usage tracking (10,000/month free tier)
- Audio file generation (MP3)
- Browser speech synthesis fallback
- Audio playback support

**API Configuration**:
- Calm Voice: `EXAVITQu4vr4xnSDxMaL` (Sarah)
- Urgent Voice: `21m00Tcm4TlvDq8ikWAM` (Rachel)
- Model: `eleven_monolingual_v1`

**Example Usage**:
```typescript
import { ElevenLabsVoice } from '@/lib/elevenlabs-voice';

const voiceGen = new ElevenLabsVoice({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

const voiceAlert = await voiceGen.generateVoiceAlert(analysis);

console.log(`Voice type: ${voiceAlert.voiceType}`);
console.log(`Audio URL: ${voiceAlert.audioUrl}`);
console.log(`Characters used: ${voiceAlert.characterCount}`);

// Play audio
await voiceGen.playAudio(voiceAlert.audioBuffer!);
```

### 5. Security Response Pipeline (`security-response-pipeline.ts`)

**Purpose**: Complete end-to-end security response workflow

**Pipeline Flow**:
1. **Detection** (0-100ms): Analyze sensor data for anomalies
2. **Blocking** (100-500ms): Attempt countermeasures
3. **Analysis** (1-3s): AI incident analysis with Groq
4. **Voice** (2-5s): Generate voice alert with ElevenLabs
5. **Alert** (0-1s): Trigger phone/multi-channel alerts

**Total Processing Time**: <30 seconds (requirement)

**Features**:
- Async processing with timeout protection
- Comprehensive error handling
- Performance metrics tracking
- Processing history
- Health checks for all components

**Example Usage**:
```typescript
import { SecurityResponsePipeline } from '@/lib/security-response-pipeline';

const pipeline = new SecurityResponsePipeline({
  groq: { apiKey: process.env.GROQ_API_KEY! },
  elevenlabs: { apiKey: process.env.ELEVENLABS_API_KEY! },
  enableVoiceAlerts: true,
  enablePhoneAlerts: true,
  maxProcessingTime: 30000,
});

// Process sensor data
const result = await pipeline.processSensorData(sensorData);

console.log(`Processing time: ${result.processingTime}ms`);
console.log(`Threat blocked: ${result.blockingResult?.blocked}`);
console.log(`Phone alert sent: ${result.phoneAlertTriggered}`);

// Get metrics
const metrics = pipeline.getMetrics();
console.log(`Success rate: ${pipeline.getBlockingSuccessRate()}%`);
```

## API Keys Setup

### 1. Groq API (Free Tier)

1. Sign up at https://console.groq.com
2. Create API key
3. Add to `.env.local`:
   ```
   GROQ_API_KEY=gsk_...
   ```

**Free Tier Limits**:
- 30 requests/minute
- LLaMA 3.3 70B model access
- No credit card required

### 2. ElevenLabs API (Free Tier)

1. Sign up at https://elevenlabs.io
2. Get API key from profile
3. Add to `.env.local`:
   ```
   ELEVENLABS_API_KEY=...
   ```

**Free Tier Limits**:
- 10,000 characters/month
- All voices available
- Commercial use allowed

## Testing

### Unit Test Example

```typescript
// Test security event detection
const detector = new SecurityEventDetector();
const testData: SensorData = {
  deviceId: 'test_001',
  timestamp: new Date().toISOString(),
  temperature: 38.5, // Critical
  motionDetected: true, // Unauthorized access
  powerVoltage: 12.0,
};

const event = detector.detectAnomalies(testData);
expect(event).not.toBeNull();
expect(event?.threatType).toBe('temperature_attack');
expect(event?.threatLevel).toBe('critical');
```

### Integration Test

```typescript
// Test complete pipeline
const pipeline = new SecurityResponsePipeline(config);
const result = await pipeline.testPipeline();

expect(result.success).toBe(true);
expect(result.processingTime).toBeLessThan(30000);
expect(result.event).not.toBeNull();
expect(result.analysis).not.toBeNull();
```

## Performance Metrics

### Expected Performance

- **Detection**: <100ms
- **Blocking**: 100-500ms
- **AI Analysis**: 1-3 seconds
- **Voice Generation**: 2-5 seconds
- **Total Pipeline**: <30 seconds

### Success Rates

- **Network Isolation**: 70-80%
- **System Backup**: 85-90%
- **Temperature Override**: 65-75%
- **Access Lockdown**: 80%
- **Overall Blocking**: ~75%

## Azure Migration Path

### Current (Firebase + Free APIs)

```
ESP32 → Firebase → Next.js → Groq API → ElevenLabs → Phone Alert
```

### Future (Azure Production)

```
ESP32 → Azure IoT Hub → Azure Functions → Azure OpenAI → Azure Speech → Azure Logic Apps
```

### Migration Steps

1. **Azure IoT Hub**: Replace Firebase Realtime Database
2. **Azure OpenAI**: Replace Groq API (same prompt templates)
3. **Azure Speech Services**: Replace ElevenLabs (same voice scripts)
4. **Azure Logic Apps**: Phone alert orchestration

**Estimated Migration Time**: 48 hours
**Code Changes Required**: Minimal (abstraction layer already in place)

## Demo Scenarios

### Scenario 1: Temperature Attack (Successfully Blocked)

```typescript
const sensorData = {
  deviceId: 'incubator_001',
  temperature: 38.5, // Critical
  humidity: 55,
  motionDetected: false,
};

// Expected output:
// - Threat detected: temperature_attack (critical)
// - Blocking: SUCCESS (temperature_override)
// - Voice: CALM ("Patient safe. Temperature normalized.")
// - Phone: Calm alert sent
```

### Scenario 2: Access Attack (Blocking Failed)

```typescript
const sensorData = {
  deviceId: 'incubator_002',
  motionDetected: true,
  doorStatus: true,
  vibrationLevel: 0.8,
};

// Expected output:
// - Threat detected: access_attack (critical)
// - Blocking: FAILED (access_lockdown failed)
// - Voice: URGENT ("[ALERT] Security breach. Immediate response required.")
// - Phone: Urgent alert with siren
```

## Troubleshooting

### Issue: Groq API Rate Limit

**Solution**: Pipeline automatically waits and retries. Check rate limit status:
```typescript
const status = pipeline.getRateLimitStatus();
console.log(`Groq: ${status.groq.used}/${status.groq.limit}`);
```

### Issue: ElevenLabs Character Limit

**Solution**: Monitor usage and reset monthly:
```typescript
const usage = voiceGen.getUsageStatus();
console.log(`Characters: ${usage.used}/${usage.limit} (${usage.percentUsed}%)`);
```

### Issue: Processing Time Exceeded

**Solution**: Check individual component latency and optimize:
```typescript
const result = await pipeline.processSensorData(data);
console.log(`Processing time: ${result.processingTime}ms`);
console.log(`Errors: ${result.errors}`);
```

## Next Steps

- **Task 4.1**: Implement phone alert integration (Android Intent, Bluetooth, Telegram)
- **Task 4.2**: Create differentiated alert system with intelligent fallback
- **Task 5.1**: Implement local ML pipeline for anomaly detection
- **Task 6.1**: Build enhanced dashboard with real-time security monitoring

## Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs)
- [Azure OpenAI Migration Guide](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure Speech Services](https://learn.microsoft.com/azure/ai-services/speech-service/)
