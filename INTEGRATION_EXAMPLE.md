# Device Provisioning Integration Example

## 🎯 Complete Mobile-Based Provisioning System

This guide shows the complete enterprise-grade mobile provisioning system with device authentication.

---

## 🏗️ System Architecture

```
Dashboard → QR Code → Mobile App → ESP32 WiFi AP → Backend Validation → Provisioned Device
```

### Key Features:
- ✅ Mobile app scans QR code (no ESP32 camera needed)
- ✅ Mobile transfers credentials to ESP32 over WiFi
- ✅ Backend validates device authenticity (enterprise security)
- ✅ Supports both Ethernet and WiFi ESP32 devices
- ✅ One-time provisioning tokens (prevents replay attacks)
- ✅ MAC address binding (prevents device cloning)

---

## Example 1: Complete Dashboard Integration with Mobile Provisioning

```typescript
// app/dashboard/devices/page.tsx

"use client";

import { useState, useEffect } from 'react';
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';
import { Plus, Trash2, RefreshCw, Wifi, Cable } from 'lucide-react';

interface Device {
  device_id: string;
  device_name: string;
  device_type: string;
  location: string;
  connection_type: string;
  status: string;
  provisioned_at: string;
  last_seen: string | null;
  esp32_mac_address: string | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get organization and department from user context
  const organizationId = "org_hospital_001";
  const departmentId = "dept_nicu_001";
  
  // Load devices
  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devices/list?organization_id=${organizationId}`);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDevices();
  }, []);
  
  // Handle device creation success
  const handleDeviceCreated = (deviceId: string) => {
    console.log('Device created:', deviceId);
    setShowWizard(false);
    loadDevices(); // Refresh list
  };
  
  // Handle device deletion
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to deprovision this device?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadDevices(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IoT Devices</h1>
          <p className="text-gray-600 mt-1">
            Manage your IoT devices with mobile provisioning
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDevices}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Device</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Provisioning Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📱 Mobile Provisioning:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Click "Create Device" and fill in device information</li>
          <li>Select connection type (Ethernet or WiFi)</li>
          <li>Get QR code from wizard</li>
          <li>Open SafeEdge Mobile App and scan QR code</li>
          <li>Mobile app will connect to ESP32 and provision automatically</li>
          <li>Device validates with backend for enterprise security</li>
        </ol>
      </div>
      
      {/* Devices List */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Device Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Connection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                MAC Address
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device.device_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {device.device_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {device.device_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {device.device_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    {device.connection_type === 'ethernet' ? (
                      <Cable className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Wifi className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm text-gray-900">
                      {device.connection_type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {device.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    device.status === 'online' 
                      ? 'bg-green-100 text-green-800'
                      : device.status === 'validated'
                      ? 'bg-blue-100 text-blue-800'
                      : device.status === 'offline'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {device.esp32_mac_address || 'Not bound'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDeleteDevice(device.device_id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {devices.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No devices found</p>
            <button
              onClick={() => setShowWizard(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first device
            </button>
          </div>
        )}
      </div>
      
      {/* Device Provisioning Wizard */}
      {showWizard && (
        <DeviceProvisioningWizard
          organizationId={organizationId}
          departmentId={departmentId}
          onClose={() => setShowWizard(false)}
          onSuccess={handleDeviceCreated}
        />
      )}
    </div>
  );
}
```

---

## Example 2: Mobile Provisioning App Page

```typescript
// app/mobile/provision/page.tsx

"use client";

import MobileProvisioningApp from '@/components/MobileProvisioningApp';

export default function MobileProvisionPage() {
  return <MobileProvisioningApp />;
}
```

Access at: `http://localhost:3000/mobile/provision`

---

## Example 3: Devices Management Page (Original)

```typescript
// app/dashboard/devices/page.tsx

"use client";

import { useState, useEffect } from 'react';
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

interface Device {
  device_id: string;
  device_name: string;
  device_type: string;
  location: string;
  status: string;
  provisioned_at: string;
  last_seen: string | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get organization and department from user context
  const organizationId = "org_hospital_001";
  const departmentId = "dept_nicu_001";
  
  // Load devices
  const loadDevices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/devices/list?organization_id=${organizationId}`);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadDevices();
  }, []);
  
  // Handle device creation success
  const handleDeviceCreated = (deviceId: string) => {
    console.log('Device created:', deviceId);
    setShowWizard(false);
    loadDevices(); // Refresh list
  };
  
  // Handle device deletion
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to deprovision this device?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadDevices(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IoT Devices</h1>
          <p className="text-gray-600 mt-1">
            Manage your IoT devices and security credentials
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDevices}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Device</span>
          </button>
        </div>
      </div>
      
      {/* Devices List */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Device Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Seen
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.map((device) => (
              <tr key={device.device_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {device.device_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {device.device_id}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {device.device_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {device.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    device.status === 'online' 
                      ? 'bg-green-100 text-green-800'
                      : device.status === 'offline'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {device.last_seen 
                    ? new Date(device.last_seen).toLocaleString()
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => handleDeleteDevice(device.device_id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {devices.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No devices found</p>
            <button
              onClick={() => setShowWizard(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first device
            </button>
          </div>
        )}
      </div>
      
      {/* Device Provisioning Wizard */}
      {showWizard && (
        <DeviceProvisioningWizard
          organizationId={organizationId}
          departmentId={departmentId}
          onClose={() => setShowWizard(false)}
          onSuccess={handleDeviceCreated}
        />
      )}
    </div>
  );
}
```

---

## Example 2: Quick Add Button in Navbar

```typescript
// components/Navbar.tsx

"use client";

import { useState } from 'react';
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';
import { Plus } from 'lucide-react';

export default function Navbar() {
  const [showWizard, setShowWizard] = useState(false);
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and navigation */}
          <div className="flex">
            {/* ... */}
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowWizard(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Device</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Wizard Modal */}
      {showWizard && (
        <DeviceProvisioningWizard
          organizationId="org_hospital_001"
          departmentId="dept_nicu_001"
          onClose={() => setShowWizard(false)}
          onSuccess={(deviceId) => {
            console.log('Device created:', deviceId);
            setShowWizard(false);
          }}
        />
      )}
    </nav>
  );
}
```

---

## Example 3: Department-Specific Provisioning

```typescript
// app/dashboard/departments/[id]/page.tsx

"use client";

import { useState } from 'react';
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';
import { useParams } from 'next/navigation';

export default function DepartmentPage() {
  const params = useParams();
  const departmentId = params.id as string;
  const [showWizard, setShowWizard] = useState(false);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Department Devices</h1>
      
      <button
        onClick={() => setShowWizard(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Add Device to This Department
      </button>
      
      {showWizard && (
        <DeviceProvisioningWizard
          organizationId="org_hospital_001"
          departmentId={departmentId}
          onClose={() => setShowWizard(false)}
          onSuccess={(deviceId) => {
            console.log('Device added to department:', deviceId);
            setShowWizard(false);
          }}
        />
      )}
    </div>
  );
}
```

---

## Example 4: Bulk Provisioning Interface

```typescript
// app/dashboard/bulk-provision/page.tsx

"use client";

import { useState } from 'react';
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';

interface BulkDevice {
  name: string;
  type: string;
  location: string;
}

export default function BulkProvisionPage() {
  const [devices, setDevices] = useState<BulkDevice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [provisionedDevices, setProvisionedDevices] = useState<string[]>([]);
  
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const parsed = lines.slice(1).map(line => {
        const [name, type, location] = line.split(',');
        return { name, type, location };
      });
      setDevices(parsed);
    };
    reader.readAsText(file);
  };
  
  const startBulkProvisioning = () => {
    setCurrentIndex(0);
    setShowWizard(true);
  };
  
  const handleDeviceProvisioned = (deviceId: string) => {
    setProvisionedDevices([...provisionedDevices, deviceId]);
    
    if (currentIndex < devices.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowWizard(false);
      alert(`Provisioned ${devices.length} devices!`);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Bulk Device Provisioning</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="mb-4"
        />
        
        {devices.length > 0 && (
          <div>
            <p className="text-gray-600 mb-4">
              {devices.length} devices ready to provision
            </p>
            <button
              onClick={startBulkProvisioning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Start Provisioning
            </button>
          </div>
        )}
      </div>
      
      {showWizard && devices[currentIndex] && (
        <DeviceProvisioningWizard
          organizationId="org_hospital_001"
          departmentId="dept_nicu_001"
          onClose={() => setShowWizard(false)}
          onSuccess={handleDeviceProvisioned}
        />
      )}
      
      {provisionedDevices.length > 0 && (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            Provisioned Devices ({provisionedDevices.length}/{devices.length})
          </h3>
          <ul className="space-y-1">
            {provisionedDevices.map((id, i) => (
              <li key={i} className="text-sm text-gray-700">
                ✅ {id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## Example 5: API Integration in Custom Component

```typescript
// components/CustomDeviceCreator.tsx

"use client";

import { useState } from 'react';

export default function CustomDeviceCreator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const createDevice = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/devices/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_name: 'Auto-Generated Device',
          device_type: 'temperature_sensor',
          location: 'Auto-Location',
          organization_id: 'org_hospital_001',
          department_id: 'dept_nicu_001',
          gateway_address: '192.168.1.177',
          gateway_port: 8883,
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
      // Download config automatically
      const configBlob = new Blob(
        [JSON.stringify(data.config_json, null, 2)],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(configBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.device_id}_config.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to create device:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={createDevice}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? 'Creating...' : 'Quick Create Device'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="font-semibold">Device Created!</p>
          <p className="text-sm text-gray-600">ID: {result.device_id}</p>
          <p className="text-sm text-gray-600">Config downloaded automatically</p>
        </div>
      )}
    </div>
  );
}
```

---

## Example 6: React Hook for Device Provisioning

```typescript
// hooks/useDeviceProvisioning.ts

import { useState } from 'react';

interface ProvisionDeviceParams {
  device_name: string;
  device_type: string;
  location: string;
  organization_id: string;
  department_id?: string;
}

export function useDeviceProvisioning() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const provisionDevice = async (params: ProvisionDeviceParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/devices/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          gateway_address: '192.168.1.177',
          gateway_port: 8883,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to provision device');
      }
      
      const data = await response.json();
      return data;
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
      
    } finally {
      setLoading(false);
    }
  };
  
  const listDevices = async (organizationId?: string) => {
    const url = organizationId
      ? `/api/devices/list?organization_id=${organizationId}`
      : '/api/devices/list';
    
    const response = await fetch(url);
    const data = await response.json();
    return data.devices;
  };
  
  const getDeviceStatus = async (deviceId: string) => {
    const response = await fetch(`/api/devices/${deviceId}/status`);
    return await response.json();
  };
  
  const deprovisionDevice = async (deviceId: string) => {
    const response = await fetch(`/api/devices/${deviceId}`, {
      method: 'DELETE',
    });
    return await response.json();
  };
  
  return {
    provisionDevice,
    listDevices,
    getDeviceStatus,
    deprovisionDevice,
    loading,
    error,
  };
}

// Usage:
// const { provisionDevice, loading, error } = useDeviceProvisioning();
// const result = await provisionDevice({ ... });
```

---

## Key Integration Points

### 1. Import the Component
```typescript
import DeviceProvisioningWizard from '@/components/DeviceProvisioningWizard';
```

### 2. Add State Management
```typescript
const [showWizard, setShowWizard] = useState(false);
```

### 3. Render the Wizard
```typescript
{showWizard && (
  <DeviceProvisioningWizard
    organizationId="org_id"
    departmentId="dept_id"
    onClose={() => setShowWizard(false)}
    onSuccess={(deviceId) => {
      console.log('Created:', deviceId);
      setShowWizard(false);
    }}
  />
)}
```

### 4. Trigger Button
```typescript
<button onClick={() => setShowWizard(true)}>
  Create Device
</button>
```

---

## Best Practices

1. **Always provide organizationId** - Required for multi-tenant systems
2. **Handle onSuccess callback** - Refresh device lists, show notifications
3. **Handle onClose callback** - Clean up state, hide wizard
4. **Error handling** - Show user-friendly error messages
5. **Loading states** - Provide feedback during provisioning
6. **Refresh data** - Update device lists after provisioning

---

## Testing Integration

```typescript
// Test the integration
describe('Device Provisioning Integration', () => {
  it('should open wizard on button click', () => {
    render(<DevicesPage />);
    fireEvent.click(screen.getByText('Create Device'));
    expect(screen.getByText('Create New IoT Device')).toBeInTheDocument();
  });
  
  it('should close wizard on cancel', () => {
    render(<DevicesPage />);
    fireEvent.click(screen.getByText('Create Device'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create New IoT Device')).not.toBeInTheDocument();
  });
});
```

---

**Ready to integrate!** Choose the example that best fits your use case and customize as needed.
