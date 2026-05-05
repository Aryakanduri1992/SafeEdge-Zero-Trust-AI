'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, XCircle, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import type { ValidationError } from '@/lib/validation-service';

interface ValidationErrorDisplayProps {
  errors: string[];
  warnings?: string[];
  fieldErrors?: ValidationError[];
  context?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

interface ValidationSummaryProps {
  errorCount: number;
  warningCount: number;
  context?: string;
}

interface OrphanedDeviceErrorProps {
  deviceCount: number;
  deviceNames: string[];
  onReassignDevices?: () => void;
  onViewDevices?: () => void;
}

interface NetworkTopologyErrorProps {
  errors: string[];
  warnings: string[];
  onFixTopology?: () => void;
  onViewDetails?: () => void;
}

interface SafeEdgeDisconnectionErrorProps {
  connectedDeviceCount: number;
  deviceNames: string[];
  onRemoveDevices?: () => void;
  onViewDevices?: () => void;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errorCount, 
  warningCount, 
  context = 'Validation' 
}) => {
  const getIcon = () => {
    if (errorCount > 0) return <XCircle className="h-5 w-5 text-red-500" />;
    if (warningCount > 0) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getVariant = () => {
    if (errorCount > 0) return 'destructive';
    if (warningCount > 0) return 'default';
    return 'default';
  };

  const getMessage = () => {
    if (errorCount > 0 && warningCount > 0) {
      return `${context} failed with ${errorCount} error${errorCount !== 1 ? 's' : ''} and ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
    }
    if (errorCount > 0) {
      return `${context} failed with ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
    }
    if (warningCount > 0) {
      return `${context} completed with ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
    }
    return `${context} completed successfully`;
  };

  return (
    <Alert variant={getVariant()}>
      {getIcon()}
      <AlertTitle className="flex items-center gap-2">
        {getMessage()}
      </AlertTitle>
    </Alert>
  );
};

const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({
  errors,
  warnings = [],
  fieldErrors = [],
  context = 'Operation',
  onRetry,
  onDismiss,
  className = ''
}) => {
  const criticalErrors = fieldErrors.filter(e => 
    e.severity === 'error' && 
    ['ZERO_FLOOR_COUNT', 'ZERO_ROOM_COUNT', 'EMPTY_ROOM_NAME', 'ORPHANED_DEVICE', 'MISSING_SAFE_EDGE'].includes(e.code)
  );

  const otherErrors = fieldErrors.filter(e => 
    e.severity === 'error' && 
    !['ZERO_FLOOR_COUNT', 'ZERO_ROOM_COUNT', 'EMPTY_ROOM_NAME', 'ORPHANED_DEVICE', 'MISSING_SAFE_EDGE'].includes(e.code)
  );

  const warningErrors = fieldErrors.filter(e => e.severity === 'warning');

  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <ValidationSummary 
        errorCount={errors.length}
        warningCount={warnings.length}
        context={context}
      />

      {/* Critical Issues */}
      {criticalErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Critical Issues
            </CardTitle>
            <CardDescription className="text-red-600">
              These issues must be resolved before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error.message}</p>
                  {error.field && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Field: {error.field}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other Errors */}
      {otherErrors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {otherErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error.message}</p>
                  {error.field && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Field: {error.field}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {(warningErrors.length > 0 || warnings.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Warnings
            </CardTitle>
            <CardDescription className="text-yellow-600">
              These issues should be reviewed but don't prevent operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {warningErrors.map((warning, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-700">{warning.message}</p>
                  {warning.field && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Field: {warning.field}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">{warning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(onRetry || onDismiss) && (
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" size="sm">
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

const OrphanedDeviceError: React.FC<OrphanedDeviceErrorProps> = ({
  deviceCount,
  deviceNames,
  onReassignDevices,
  onViewDevices
}) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          Orphaned Devices Detected
        </CardTitle>
        <CardDescription className="text-red-600">
          {deviceCount} device{deviceCount !== 1 ? 's' : ''} without room assignments found. 
          All devices must be assigned to valid rooms before system operation can continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-red-700 mb-2">Affected Devices:</h4>
          <div className="flex flex-wrap gap-2">
            {deviceNames.slice(0, 10).map((name, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {name}
              </Badge>
            ))}
            {deviceNames.length > 10 && (
              <Badge variant="outline" className="text-xs">
                +{deviceNames.length - 10} more
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          {onReassignDevices && (
            <Button onClick={onReassignDevices} size="sm">
              Reassign Devices
            </Button>
          )}
          {onViewDevices && (
            <Button onClick={onViewDevices} variant="outline" size="sm">
              View All Devices
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const NetworkTopologyError: React.FC<NetworkTopologyErrorProps> = ({
  errors,
  warnings,
  onFixTopology,
  onViewDetails
}) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          Network Topology Issues
        </CardTitle>
        <CardDescription className="text-red-600">
          Network configuration problems detected. All devices must connect through centralized Safe Edge architecture.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 mb-2">Errors:</h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-600">
                  <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h4 className="font-medium text-yellow-700 mb-2">Warnings:</h4>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          {onFixTopology && (
            <Button onClick={onFixTopology} size="sm">
              Fix Network Issues
            </Button>
          )}
          {onViewDetails && (
            <Button onClick={onViewDetails} variant="outline" size="sm">
              View Network Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SafeEdgeDisconnectionError: React.FC<SafeEdgeDisconnectionErrorProps> = ({
  connectedDeviceCount,
  deviceNames,
  onRemoveDevices,
  onViewDevices
}) => {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          Cannot Disconnect Safe Edge
        </CardTitle>
        <CardDescription className="text-red-600">
          {connectedDeviceCount} device{connectedDeviceCount !== 1 ? 's are' : ' is'} still connected. 
          Please remove all devices before disconnecting Safe Edge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-red-700 mb-2">Connected Devices:</h4>
          <div className="flex flex-wrap gap-2">
            {deviceNames.slice(0, 10).map((name, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {name}
              </Badge>
            ))}
            {deviceNames.length > 10 && (
              <Badge variant="outline" className="text-xs">
                +{deviceNames.length - 10} more
              </Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex gap-2">
          {onRemoveDevices && (
            <Button onClick={onRemoveDevices} size="sm">
              Remove All Devices
            </Button>
          )}
          {onViewDevices && (
            <Button onClick={onViewDevices} variant="outline" size="sm">
              View Connected Devices
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export {
  ValidationErrorDisplay,
  ValidationSummary,
  OrphanedDeviceError,
  NetworkTopologyError,
  SafeEdgeDisconnectionError
};

export type {
  ValidationErrorDisplayProps,
  ValidationSummaryProps,
  OrphanedDeviceErrorProps,
  NetworkTopologyErrorProps,
  SafeEdgeDisconnectionErrorProps
};