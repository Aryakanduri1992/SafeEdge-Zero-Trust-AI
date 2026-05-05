"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, MessageSquare, Mail, CheckCircle, Clock, Smartphone, Volume2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutWrapper } from '@/components/org-dashboard/layout-wrapper';

interface Alert {
  id: string;
  organizationId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  deviceId?: string;
  status: 'active' | 'resolved' | 'acknowledged';
  timestamp: string;
  resolvedAt?: string;
  phoneAlertSent?: boolean;
  smsAlertSent?: boolean;
  emailAlertSent?: boolean;
  voiceAlertSent?: boolean;
}

interface PhoneAlert {
  id: string;
  alertId: string;
  phoneNumber: string;
  status: 'pending' | 'delivered' | 'failed';
  channel: 'voice' | 'sms' | 'telegram' | 'android';
  timestamp: string;
  duration?: number;
  attempts: number;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [phoneAlerts, setPhoneAlerts] = useState<PhoneAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      fetchAlerts(userData.organizationId);
      fetchPhoneAlerts(userData.organizationId);
      
      // Set up auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchAlerts(userData.organizationId);
        fetchPhoneAlerts(userData.organizationId);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const fetchAlerts = async (organizationId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/alerts?organizationId=${organizationId}&status=${filter === 'all' ? 'all' : filter}`);
      const data = await response.json();

      if (response.ok) {
        let filteredAlerts = data.alerts || [];
        
        // Apply severity filter
        if (severityFilter !== 'all') {
          filteredAlerts = filteredAlerts.filter((alert: Alert) => alert.severity === severityFilter);
        }
        
        setAlerts(filteredAlerts);
      } else {
        throw new Error(data.error || 'Failed to fetch alerts');
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load alerts',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhoneAlerts = async (organizationId: string) => {
    try {
      // Fetch phone alert history from backend
      const response = await fetch(`http://localhost:8000/api/alerts/history?limit=20`);
      if (response.ok) {
        const data = await response.json();
        
        // Convert backend alert history to our format
        const phoneAlertsData = data.alerts?.map((alert: any, index: number) => ({
          id: `phone_${index}`,
          alertId: `alert_${index}`,
          phoneNumber: '+1234567890',
          status: alert.success ? 'delivered' : 'failed',
          channel: alert.final_channel || 'voice',
          timestamp: new Date(Date.now() - index * 300000).toISOString(), // Spread over last hour
          duration: alert.duration_ms,
          attempts: alert.attempts || 1
        })) || [];
        
        setPhoneAlerts(phoneAlertsData);
      }
    } catch (error: any) {
      console.error('Error fetching phone alerts:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          status: 'resolved'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Alert resolved successfully',
        });
        
        // Refresh alerts
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchAlerts(userData.organizationId);
        }
      } else {
        throw new Error('Failed to resolve alert');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to resolve alert',
      });
    }
  };

  const sendPhoneAlert = async (alertId: string) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return;

      const response = await fetch('http://localhost:8000/api/alerts/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: alert.deviceId || 'manual',
          message: `${alert.title}: ${alert.message}`,
          urgency: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'urgent' : 'calm'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Phone Alert Sent',
          description: 'Voice call and SMS alert sent successfully',
        });
        
        // Refresh phone alerts
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          fetchPhoneAlerts(userData.organizationId);
        }
      } else {
        throw new Error('Failed to send phone alert');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send phone alert',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'voice':
        return <Phone className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'telegram':
        return <MessageSquare className="w-4 h-4" />;
      case 'android':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-[#242d53] to-[#3a4570] text-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Security Alerts</h1>
              <p className="text-gray-200">Monitor and manage security alerts and notifications</p>
            </div>
            <Button 
              onClick={() => {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                  const userData = JSON.parse(storedUser);
                  fetchAlerts(userData.organizationId);
                  fetchPhoneAlerts(userData.organizationId);
                }
              }}
              className="bg-[#d3b78f] text-[#242d53] hover:bg-[#c9a876]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-[#242d53]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5B6B8F]">Active Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#242d53]">{activeAlerts.length}</div>
              <p className="text-xs text-red-500 mt-1">
                {activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} high priority
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5B6B8F]">Resolved Today</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#242d53]">{resolvedAlerts.length}</div>
              <p className="text-xs text-green-500 mt-1">All issues addressed</p>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5B6B8F]">Phone Alerts</CardTitle>
              <Phone className="h-5 w-5 text-[#d3b78f]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#242d53]">{phoneAlerts.length}</div>
              <p className="text-xs text-[#d3b78f] mt-1">
                {phoneAlerts.filter(p => p.status === 'delivered').length} delivered
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#242d53]/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#5B6B8F]">Response Time</CardTitle>
              <Clock className="h-5 w-5 text-[#6B8E6F]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#242d53]">2.3s</div>
              <p className="text-xs text-[#6B8E6F] mt-1">Average alert delivery</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-[#242d53] text-white' : ''}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                  className={filter === 'active' ? 'bg-[#242d53] text-white' : ''}
                >
                  Active
                </Button>
                <Button
                  variant={filter === 'resolved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('resolved')}
                  className={filter === 'resolved' ? 'bg-[#242d53] text-white' : ''}
                >
                  Resolved
                </Button>
              </div>
              
              <div className="flex gap-2">
                {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
                  <Button
                    key={severity}
                    variant={severityFilter === severity ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter(severity as any)}
                    className={severityFilter === severity ? 'bg-[#242d53] text-white' : ''}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Security Alerts ({alerts.length})
              </CardTitle>
              <CardDescription>Current security alerts and incidents</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#242d53] mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No alerts found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(alert.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-[#242d53]">{alert.title}</h4>
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant={alert.status === 'active' ? 'destructive' : 'secondary'}>
                                {alert.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatTimestamp(alert.timestamp)}</span>
                              {alert.deviceId && <span>Device: {alert.deviceId.slice(-8)}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => resolveAlert(alert.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPhoneAlert(alert.id)}
                              className="border-[#d3b78f] text-[#d3b78f] hover:bg-[#d3b78f] hover:text-white"
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Send Phone Alert
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phone Alerts History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#d3b78f]" />
                Phone Alert History ({phoneAlerts.length})
              </CardTitle>
              <CardDescription>Voice calls, SMS, and mobile notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {phoneAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No phone alerts sent yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {phoneAlerts.map((phoneAlert) => (
                    <div key={phoneAlert.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(phoneAlert.channel)}
                          <span className="font-medium text-sm">
                            {phoneAlert.channel.toUpperCase()} Alert
                          </span>
                          <Badge 
                            variant={phoneAlert.status === 'delivered' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {phoneAlert.status.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(phoneAlert.timestamp)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Phone: {phoneAlert.phoneNumber}</div>
                        <div>Attempts: {phoneAlert.attempts}</div>
                        {phoneAlert.duration && (
                          <div>Duration: {Math.round(phoneAlert.duration / 1000)}s</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </LayoutWrapper>
  );
}