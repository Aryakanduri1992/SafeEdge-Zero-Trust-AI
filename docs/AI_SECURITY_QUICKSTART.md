# AI Security System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get API Keys (Free)

#### Groq API (30 requests/minute free)
1. Visit https://console.groq.com
2. Sign up (no credit card required)
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `gsk_`)

#### ElevenLabs API (10,000 characters/month free)
1. Visit https://elevenlabs.io
2. Sign up (no credit card required)
3. Go to Profile → API Keys
4. Copy your API key

### Step 2: Configure Environment

Create `.env.local` file in project root:

```bash
# AI Services (Required)
GROQ_API_KEY=gsk_your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Security Pipeline Configuration (Optional)
ENABLE_VOICE_ALERTS=true
ENABLE_PHONE_ALERTS=true
MAX_PROCESSING_TIME=30000
```

### Step 3: Test the System

Create a test file `test-security-pipeline.ts`:

```typescript
import { SecurityResponsePipeline } from '@/lib/security-response-pipeline';
import type { SensorData } from '@/lib/cloud-service';

async function testSecuritySystem() {
  // Initialize pipeline
  const pipeline = new SecurityResponsePipeline({
    groq: {
      apiKey: process.env.GROQ_API_KEY!,
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY!,
    },
  });

  // Simulate temperature attack on hospital incubator
  const attackData: SensorData = {
    deviceId: 'incubator_nicu_001',
    timestamp: new Date().toISOString(),
    temperature: 38.5, // CRITICAL - above safe range (36.5-37.5°C)
    humidity: 55,
    motionDetected: false,
    doorStatus: false,
    vibrationLevel: 0.2,
    powerVoltage: 12.0,
    wifiSignalStrength: -65,
    threatLevel: 'critical',
    anomalyDetected: true,
    securityScore: 45,
  };

  console.log('🧪 Testing AI Security Response Pipeline...\n');
  console.log('📊 Simulating temperature attack on incubator...');
  
  // Process through complete pipeline
  const result = await pipeline.processSensorData(attackData);

  // Display results
  console.log('\n✅ PIPELINE RESULTS:');
  console.log('─────────────────────────────────────');
  console.log(`⏱️  Processing Time: ${result.processingTime}ms`);
  console.log(`🚨 Threat Detected: ${result.event?.threatType}`);
  console.log(`⚠️  Threat Level: ${result.event?.threatLevel}`);
  console.log(`🛡️  Blocking Status: ${result.blockingResult?.blocked ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🤖 AI Analysis: ${result.analysis?.summary}`);
  console.log(`🔊 Voice Type: ${result.voiceAlert?.voiceType}`);
  console.log(`📞 Phone Alert: ${result.phoneAlertTriggered ? '✅ Sent' : '❌ Not sent'}`);
  
  if (result.voiceAlert) {
    console.log(`\n🎙️  VOICE SCRIPT:`);
    console.log(`"${result.voiceAlert.text}"`);
  }

  if (result.analysis) {
    console.log(`\n📋 RECOMMENDATIONS:`);
    result.analysis.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  // Display metrics
  const metrics = pipeline.getMetrics();
  console.log(`\n📈 PIPELINE METRICS:`);
  console.log(`   Total Processed: ${metrics.totalProcessed}`);
  console.log(`   Successful Blocks: ${metrics.successfulBlocks}`);
  console.log(`   Failed Blocks: ${metrics.failedBlocks}`);
  console.log(`   Success Rate: ${pipeline.getBlockingSuccessRate().toFixed(1)}%`);
  console.log(`   Avg Processing Time: ${metrics.averageProcessingTime.toFixed(0)}ms`);

  // Display API usage
  const rateLimits = pipeline.getRateLimitStatus();
  console.log(`\n🔑 API USAGE:`);
  console.log(`   Groq: ${rateLimits.groq.used}/${rateLimits.groq.limit} requests`);
  console.log(`   ElevenLabs: ${rateLimits.elevenlabs.used}/${rateLimits.elevenlabs.limit} characters (${rateLimits.elevenlabs.percentUsed.toFixed(1)}%)`);
}

// Run test
testSecuritySystem().catch(console.error);
```

Run the test:

```bash
npx tsx test-security-pipeline.ts
```

### Step 4: Expected Output

```
🧪 Testing AI Security Response Pipeline...

📊 Simulating temperature attack on incubator...
🚨 Security event detected: temperature_attack (critical)
🛡️ Blocking result: safe (SUCCESS)
🤖 AI analysis complete: Critical temperature anomaly successfully blocked. Patient safety maintained.
🔊 Voice alert generated: calm

✅ PIPELINE RESULTS:
─────────────────────────────────────
⏱️  Processing Time: 3247ms
🚨 Threat Detected: temperature_attack
⚠️  Threat Level: critical
🛡️  Blocking Status: ✅ SUCCESS
🤖 AI Analysis: Critical temperature anomaly successfully blocked. Patient safety maintained.
🔊 Voice Type: calm
📞 Phone Alert: ✅ Sent

🎙️  VOICE SCRIPT:
"Patient safe. Temperature normalized. All systems operating normally."

📋 RECOMMENDATIONS:
   1. Continue monitoring device status
   2. Verify all safety parameters are within normal range
   3. Document incident for security review

📈 PIPELINE METRICS:
   Total Processed: 1
   Successful Blocks: 1
   Failed Blocks: 0
   Success Rate: 100.0%
   Avg Processing Time: 3247ms

🔑 API USAGE:
   Groq: 1/30 requests
   ElevenLabs: 67/10000 characters (0.7%)
```

## 🎯 Demo Scenarios

### Scenario 1: Temperature Attack (Blocked)

```typescript
const data: SensorData = {
  deviceId: 'incubator_001',
  timestamp: new Date().toISOString(),
  temperature: 38.5, // Critical
  humidity: 55,
  motionDetected: false,
};

// Expected: Calm voice alert, successful blocking
```

### Scenario 2: Access Attack (Failed)

```typescript
const data: SensorData = {
  deviceId: 'incubator_002',
  timestamp: new Date().toISOString(),
  temperature: 37.0,
  motionDetected: true, // Unauthorized access
  doorStatus: true, // Door opened
  vibrationLevel: 0.8, // Tampering
};

// Expected: Urgent voice alert with siren, failed blocking
```

### Scenario 3: Power Attack (Blocked)

```typescript
const data: SensorData = {
  deviceId: 'incubator_003',
  timestamp: new Date().toISOString(),
  temperature: 37.0,
  powerVoltage: 10.5, // Below minimum
};

// Expected: Calm voice alert, backup activated
```

### Scenario 4: Network Attack (Blocked)

```typescript
const data: SensorData = {
  deviceId: 'incubator_004',
  timestamp: new Date().toISOString(),
  temperature: 37.0,
  wifiSignalStrength: -85, // Very weak signal
};

// Expected: Calm voice alert, network isolation
```

## 🔧 Integration with Existing Code

### Add to Dashboard Component

```typescript
import { SecurityResponsePipeline } from '@/lib/security-response-pipeline';
import { useEffect, useState } from 'react';

export function SecurityDashboard() {
  const [pipeline] = useState(() => new SecurityResponsePipeline({
    groq: { apiKey: process.env.GROQ_API_KEY! },
    elevenlabs: { apiKey: process.env.ELEVENLABS_API_KEY! },
  }));

  const [metrics, setMetrics] = useState(pipeline.getMetrics());

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(pipeline.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, [pipeline]);

  return (
    <div>
      <h2>Security Metrics</h2>
      <p>Total Processed: {metrics.totalProcessed}</p>
      <p>Success Rate: {((metrics.successfulBlocks / (metrics.successfulBlocks + metrics.failedBlocks)) * 100).toFixed(1)}%</p>
      <p>Avg Processing Time: {metrics.averageProcessingTime.toFixed(0)}ms</p>
    </div>
  );
}
```

### Process ESP32 Sensor Data

```typescript
import { SecurityResponsePipeline } from '@/lib/security-response-pipeline';
import { CloudServiceFactory, getCloudConfig } from '@/lib/cloud-service';

// Initialize services
const cloudService = CloudServiceFactory.getInstance(getCloudConfig());
const pipeline = new SecurityResponsePipeline({
  groq: { apiKey: process.env.GROQ_API_KEY! },
  elevenlabs: { apiKey: process.env.ELEVENLABS_API_KEY! },
});

// Listen for ESP32 sensor data
cloudService.subscribeToDeviceStatus('incubator_001', async (status) => {
  // Get latest sensor data
  const sensorHistory = await cloudService.getSensorHistory('incubator_001', 1);
  const latestData = sensorHistory[0];

  if (latestData) {
    // Process through security pipeline
    const result = await pipeline.processSensorData(latestData);

    if (result.event) {
      console.log('🚨 Security event processed:', result);
      
      // Store result in Firebase
      await cloudService.storeSensorData({
        ...latestData,
        securityEvent: result.event,
        blockingResult: result.blockingResult,
        analysis: result.analysis,
      });
    }
  }
});
```

## 📊 Monitoring & Debugging

### Check API Rate Limits

```typescript
const rateLimits = pipeline.getRateLimitStatus();

console.log('Groq API:', rateLimits.groq);
// { used: 5, limit: 30, resetIn: 45000 }

console.log('ElevenLabs:', rateLimits.elevenlabs);
// { used: 234, limit: 10000, remaining: 9766, percentUsed: 2.34 }
```

### View Processing History

```typescript
const history = pipeline.getProcessingHistory(10);

history.forEach(result => {
  console.log(`Event: ${result.event?.threatType}`);
  console.log(`Blocked: ${result.blockingResult?.blocked}`);
  console.log(`Time: ${result.processingTime}ms`);
});
```

### Health Check

```typescript
const health = await pipeline.healthCheck();

console.log('Pipeline Health:', health);
// { detector: true, blocker: true, analyzer: true, voiceGenerator: true, overall: true }
```

## 🐛 Troubleshooting

### Issue: "Groq API error: 401"
**Solution**: Check your API key in `.env.local`

### Issue: "ElevenLabs character limit exceeded"
**Solution**: Monitor usage and reset monthly:
```typescript
const usage = voiceGen.getUsageStatus();
if (usage.percentUsed > 90) {
  console.warn('Approaching character limit!');
}
```

### Issue: "Processing time exceeded 30 seconds"
**Solution**: Check network latency and API response times

### Issue: "Voice alert not playing"
**Solution**: Ensure browser allows audio playback (user interaction required)

## 🎓 Next Steps

1. ✅ **Completed**: AI Security Response System (Tasks 3.1-3.4)
2. 🔄 **Next**: Phone Alert Integration (Task 4.1)
3. 🔄 **Next**: Enhanced Dashboard (Task 6.1)
4. 🔄 **Next**: Demo Infrastructure (Task 7.1)

## 📚 Additional Resources

- [Full Documentation](./AI_SECURITY_SYSTEM.md)
- [Groq API Docs](https://console.groq.com/docs)
- [ElevenLabs API Docs](https://elevenlabs.io/docs)
- [Azure Migration Guide](./CLOUD_ARCHITECTURE.md)
