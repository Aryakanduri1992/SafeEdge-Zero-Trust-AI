"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, User, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthorization } from '@/hooks/use-authorization';
import type { SecurityEvent, AuditTrailEntry } from '@/lib/types';

interface SecurityEventsPanelProps {
  organizationId?: string;
  entityType?: 'floor_plan' | 'device' | 'organization' | 'network';
  entityId?: string;
}

export function SecurityEventsPanel({ 
  organizationId, 
  entityType, 
  entityId 
}: SecurityEventsPanelProps) {
  const { user } = useAuth();
  const { canViewSecurityEvents, canViewAuditTrail } = useAuthorization();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetOrgId = organizationId || user?.id;

  // Check permissions
  const canViewEvents = canViewSecurityEvents(targetOrgId);
  const canViewAudit = canViewAuditTrail(targetOrgId);

  useEffect(() => {
    if (canViewEvents && targetOrgId) {
      fetchSecurityEvents();
    }
  }, [canViewEvents, targetOrgId]);

  useEffect(() => {
    if (canViewAudit && targetOrgId && entityType && entityId) {
      fetchAuditTrail();
    }
  }, [canViewAudit, targetOrgId, entityType, entityId]);

  const fetchSecurityEvents = async () => {
    if (!targetOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/security/events?organizationId=${targetOrgId}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security events');
      }

      const data = await response.json();
      setSecurityEvents(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrail = async () => {
    if (!targetOrgId || !entityType || !entityId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/security/audit-trail?entityType=${entityType}&entityId=${entityId}&organizationId=${targetOrgId}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${await user?.getIdToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch audit trail');
      }

      const data = await response.json();
      setAuditTrail(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (eventType: SecurityEvent['eventType']) => {
    switch (eventType) {
      case 'unauthorized_access':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'floor_plan_modification':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'device_reassignment':
        return <Activity className="h-4 w-4 text-green-500" />;
      case 'safe_edge_disconnection_attempt':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventTypeBadge = (eventType: SecurityEvent['eventType'], success: boolean) => {
    const variant = success ? 'default' : 'destructive';
    
    switch (eventType) {
      case 'unauthorized_access':
        return <Badge variant="destructive">Unauthorized Access</Badge>;
      case 'floor_plan_modification':
        return <Badge variant={variant}>Floor Plan Modified</Badge>;
      case 'device_reassignment':
        return <Badge variant={variant}>Device Reassigned</Badge>;
      case 'safe_edge_disconnection_attempt':
        return <Badge variant={variant}>Safe Edge Disconnect</Badge>;
      default:
        return <Badge variant={variant}>{eventType}</Badge>;
    }
  };

  const getActionBadge = (action: AuditTrailEntry['action']) => {
    switch (action) {
      case 'create':
        return <Badge variant="default">Created</Badge>;
      case 'update':
        return <Badge variant="secondary">Updated</Badge>;
      case 'delete':
        return <Badge variant="destructive">Deleted</Badge>;
      case 'approve':
        return <Badge variant="default">Approved</Badge>;
      case 'reassign':
        return <Badge variant="secondary">Reassigned</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  if (!canViewEvents && !canViewAudit) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view security information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security & Audit
        </CardTitle>
        <CardDescription>
          Security events and audit trail for system activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events" disabled={!canViewEvents}>
              Security Events
            </TabsTrigger>
            <TabsTrigger value="audit" disabled={!canViewAudit || !entityType || !entityId}>
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Recent Security Events</h3>
              <Button 
                onClick={fetchSecurityEvents} 
                disabled={loading}
                size="sm"
                variant="outline"
              >
                Refresh
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No security events found
                  </div>
                ) : (
                  securityEvents.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getEventTypeIcon(event.eventType)}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getEventTypeBadge(event.eventType, event.success)}
                              <span className="text-sm text-muted-foreground">
                                by {event.userRole}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{event.action}</p>
                            {event.details && (
                              <p className="text-xs text-muted-foreground">
                                {JSON.stringify(event.details, null, 2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(event.timestamp)}
                          </div>
                          {event.ipAddress && (
                            <div className="mt-1">IP: {event.ipAddress}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Audit Trail</h3>
              <Button 
                onClick={fetchAuditTrail} 
                disabled={loading || !entityType || !entityId}
                size="sm"
                variant="outline"
              >
                Refresh
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {auditTrail.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit trail entries found
                  </div>
                ) : (
                  auditTrail.map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <User className="h-4 w-4 text-blue-500 mt-1" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getActionBadge(entry.action)}
                              <span className="text-sm text-muted-foreground">
                                {entry.entityType}
                              </span>
                            </div>
                            <p className="text-sm font-medium">
                              {entry.userRole} performed {entry.action}
                            </p>
                            {entry.changes && (
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium">Changes:</p>
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(entry.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                            {entry.metadata && (
                              <div className="text-xs text-muted-foreground">
                                <p className="font-medium">Metadata:</p>
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}