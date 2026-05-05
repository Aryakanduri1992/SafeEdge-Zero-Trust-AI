"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Key, 
  Bell, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Save,
  RefreshCw
} from 'lucide-react';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettings {
  // Authentication
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  
  // Encryption
  encryptionEnabled: boolean;
  encryptionAlgorithm: string;
  keyRotationDays: number;
  
  // Alerts
  emailAlerts: boolean;
  smsAlerts: boolean;
  criticalAlertsOnly: boolean;
  alertThreshold: string;
  
  // Access Control
  ipWhitelisting: boolean;
  allowedIPs: string[];
  deviceLimitPerUser: number;
  
  // Monitoring
  auditLogging: boolean;
  realTimeMonitoring: boolean;
  anomalyDetection: boolean;
  
  // Compliance
  gdprCompliance: boolean;
  hipaaCompliance: boolean;
  dataRetentionDays: number;
}

export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState<SecuritySettings>({
    // Authentication
    twoFactorEnabled: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    
    // Encryption
    encryptionEnabled: true,
    encryptionAlgorithm: 'AES-256-GCM',
    keyRotationDays: 30,
    
    // Alerts
    emailAlerts: true,
    smsAlerts: false,
    criticalAlertsOnly: false,
    alertThreshold: 'medium',
    
    // Access Control
    ipWhitelisting: false,
    allowedIPs: [],
    deviceLimitPerUser: 5,
    
    // Monitoring
    auditLogging: true,
    realTimeMonitoring: true,
    anomalyDetection: true,
    
    // Compliance
    gdprCompliance: true,
    hipaaCompliance: true,
    dataRetentionDays: 365,
  });

  const [newIP, setNewIP] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      
      const response = await fetch(`/api/security/settings?organizationId=${userData.organizationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const userData = JSON.parse(storedUser);
      
      const response = await fetch('/api/security/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: userData.organizationId,
          settings
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Security settings saved successfully'
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save security settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addIP = () => {
    if (newIP && !settings.allowedIPs.includes(newIP)) {
      setSettings({
        ...settings,
        allowedIPs: [...settings.allowedIPs, newIP]
      });
      setNewIP('');
    }
  };

  const removeIP = (ip: string) => {
    setSettings({
      ...settings,
      allowedIPs: settings.allowedIPs.filter(i => i !== ip)
    });
  };

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-[#d3b78f]" />
                <h1 className="text-3xl font-bold">Security Settings</h1>
              </div>
              <p className="text-gray-200">Configure security policies and access controls</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="bg-white/10 border-[#d3b78f] text-white hover:bg-[#d3b78f] hover:text-[#242d53]"
                onClick={loadSettings}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876]"
                onClick={saveSettings}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>

        {/* Security Status Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-[#6B8E6F]/30 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Encryption</CardTitle>
              <Lock className="h-5 w-5 text-[#6B8E6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#242d53]">
                {settings.encryptionEnabled ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-[#5B6B8F]">{settings.encryptionAlgorithm}</p>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/30 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">2FA Status</CardTitle>
              <Key className="h-5 w-5 text-[#d3b78f]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#242d53]">
                {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <p className="text-xs text-[#5B6B8F]">Two-factor authentication</p>
            </CardContent>
          </Card>

          <Card className="border-[#C17A3A]/30 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring</CardTitle>
              <Activity className="h-5 w-5 text-[#C17A3A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#242d53]">
                {settings.realTimeMonitoring ? 'Active' : 'Inactive'}
              </div>
              <p className="text-xs text-[#5B6B8F]">Real-time threat detection</p>
            </CardContent>
          </Card>

          <Card className="border-[#5B6B8F]/30 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <CheckCircle className="h-5 w-5 text-[#5B6B8F]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#242d53]">
                {(settings.gdprCompliance && settings.hipaaCompliance) ? 'Full' : 'Partial'}
              </div>
              <p className="text-xs text-[#5B6B8F]">GDPR & HIPAA</p>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="authentication" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-[#242d53]/10">
            <TabsTrigger value="authentication" className="data-[state=active]:bg-[#242d53] data-[state=active]:text-[#d3b78f]">
              <Key className="w-4 h-4 mr-2" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="encryption" className="data-[state=active]:bg-[#242d53] data-[state=active]:text-[#d3b78f]">
              <Lock className="w-4 h-4 mr-2" />
              Encryption
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-[#242d53] data-[state=active]:text-[#d3b78f]">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-[#242d53] data-[state=active]:text-[#d3b78f]">
              <Users className="w-4 h-4 mr-2" />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-[#242d53] data-[state=active]:text-[#d3b78f]">
              <Activity className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <Card className="border-[#242d53]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Authentication Settings</CardTitle>
                <CardDescription>Configure user authentication and session management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Two-Factor Authentication</Label>
                    <p className="text-sm text-[#5B6B8F]">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, twoFactorEnabled: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                    className="border-[#242d53]/20"
                  />
                  <p className="text-sm text-[#5B6B8F]">Automatically log out inactive users</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Password Expiry (days)</Label>
                  <Input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings({...settings, passwordExpiry: parseInt(e.target.value)})}
                    className="border-[#242d53]/20"
                  />
                  <p className="text-sm text-[#5B6B8F]">Force password change after this period</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Encryption Tab */}
          <TabsContent value="encryption" className="space-y-6">
            <Card className="border-[#242d53]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Encryption Settings</CardTitle>
                <CardDescription>Configure data encryption and key management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">End-to-End Encryption</Label>
                    <p className="text-sm text-[#5B6B8F]">Encrypt all sensor data</p>
                  </div>
                  <Switch
                    checked={settings.encryptionEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, encryptionEnabled: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Encryption Algorithm</Label>
                  <Input
                    value={settings.encryptionAlgorithm}
                    disabled
                    className="border-[#242d53]/20 bg-gray-50"
                  />
                  <p className="text-sm text-[#5B6B8F]">Industry-standard AES-256-GCM encryption</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Key Rotation Period (days)</Label>
                  <Input
                    type="number"
                    value={settings.keyRotationDays}
                    onChange={(e) => setSettings({...settings, keyRotationDays: parseInt(e.target.value)})}
                    className="border-[#242d53]/20"
                  />
                  <p className="text-sm text-[#5B6B8F]">Automatically rotate encryption keys</p>
                </div>

                <div className="bg-[#d3b78f]/10 border border-[#d3b78f]/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#d3b78f] mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-[#242d53] mb-1">Encryption Status</h4>
                      <p className="text-sm text-[#5B6B8F]">
                        All data transmitted between IoT devices and the backend is encrypted using AES-256-GCM.
                        Keys are securely stored and rotated automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="border-[#242d53]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Alert Settings</CardTitle>
                <CardDescription>Configure security alert notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Email Alerts</Label>
                    <p className="text-sm text-[#5B6B8F]">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, emailAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">SMS Alerts</Label>
                    <p className="text-sm text-[#5B6B8F]">Receive alerts via SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, smsAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Critical Alerts Only</Label>
                    <p className="text-sm text-[#5B6B8F]">Only notify for critical threats</p>
                  </div>
                  <Switch
                    checked={settings.criticalAlertsOnly}
                    onCheckedChange={(checked) => setSettings({...settings, criticalAlertsOnly: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Alert Threshold</Label>
                  <select
                    value={settings.alertThreshold}
                    onChange={(e) => setSettings({...settings, alertThreshold: e.target.value})}
                    className="w-full p-2 border border-[#242d53]/20 rounded-md"
                  >
                    <option value="low">Low - All events</option>
                    <option value="medium">Medium - Important events</option>
                    <option value="high">High - Critical events only</option>
                  </select>
                  <p className="text-sm text-[#5B6B8F]">Minimum severity level for alerts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-6">
            <Card className="border-[#242d53]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Access Control</CardTitle>
                <CardDescription>Manage user access and IP restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">IP Whitelisting</Label>
                    <p className="text-sm text-[#5B6B8F]">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch
                    checked={settings.ipWhitelisting}
                    onCheckedChange={(checked) => setSettings({...settings, ipWhitelisting: checked})}
                  />
                </div>

                {settings.ipWhitelisting && (
                  <div className="space-y-3">
                    <Label className="text-[#242d53] font-semibold">Allowed IP Addresses</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter IP address (e.g., 192.168.1.1)"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        className="border-[#242d53]/20"
                      />
                      <Button onClick={addIP} className="bg-[#242d53] text-[#d3b78f]">
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {settings.allowedIPs.map((ip) => (
                        <div key={ip} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-[#242d53]">{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIP(ip)}
                            className="text-[#8B2635] hover:text-[#8B2635] hover:bg-[#8B2635]/10"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      {settings.allowedIPs.length === 0 && (
                        <p className="text-sm text-[#5B6B8F] text-center py-4">No IP addresses added</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#242d53] font-semibold">Device Limit Per User</Label>
                  <Input
                    type="number"
                    value={settings.deviceLimitPerUser}
                    onChange={(e) => setSettings({...settings, deviceLimitPerUser: parseInt(e.target.value)})}
                    className="border-[#242d53]/20"
                  />
                  <p className="text-sm text-[#5B6B8F]">Maximum devices per user account</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card className="border-[#242d53]/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#242d53]">Monitoring & Compliance</CardTitle>
                <CardDescription>Configure system monitoring and compliance settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Audit Logging</Label>
                    <p className="text-sm text-[#5B6B8F]">Log all security events</p>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => setSettings({...settings, auditLogging: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Real-Time Monitoring</Label>
                    <p className="text-sm text-[#5B6B8F]">Monitor threats in real-time</p>
                  </div>
                  <Switch
                    checked={settings.realTimeMonitoring}
                    onCheckedChange={(checked) => setSettings({...settings, realTimeMonitoring: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-[#242d53] font-semibold">Anomaly Detection</Label>
                    <p className="text-sm text-[#5B6B8F]">AI-powered threat detection</p>
                  </div>
                  <Switch
                    checked={settings.anomalyDetection}
                    onCheckedChange={(checked) => setSettings({...settings, anomalyDetection: checked})}
                  />
                </div>

                <div className="border-t border-[#242d53]/10 pt-6 space-y-4">
                  <h3 className="font-semibold text-[#242d53]">Compliance</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[#242d53] font-semibold">GDPR Compliance</Label>
                      <p className="text-sm text-[#5B6B8F]">EU data protection regulation</p>
                    </div>
                    <Switch
                      checked={settings.gdprCompliance}
                      onCheckedChange={(checked) => setSettings({...settings, gdprCompliance: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[#242d53] font-semibold">HIPAA Compliance</Label>
                      <p className="text-sm text-[#5B6B8F]">Healthcare data protection</p>
                    </div>
                    <Switch
                      checked={settings.hipaaCompliance}
                      onCheckedChange={(checked) => setSettings({...settings, hipaaCompliance: checked})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#242d53] font-semibold">Data Retention Period (days)</Label>
                    <Input
                      type="number"
                      value={settings.dataRetentionDays}
                      onChange={(e) => setSettings({...settings, dataRetentionDays: parseInt(e.target.value)})}
                      className="border-[#242d53]/20"
                    />
                    <p className="text-sm text-[#5B6B8F]">Automatically delete old data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button (Fixed at bottom) */}
        <div className="sticky bottom-0 bg-white border-t border-[#242d53]/10 p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#5B6B8F]">
              Changes will be applied immediately after saving
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadSettings}
                disabled={isLoading}
                className="border-[#242d53]/20"
              >
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-[#242d53] text-[#d3b78f] hover:bg-[#242d53]/90"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
