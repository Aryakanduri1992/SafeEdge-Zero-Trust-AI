'use client';

import { useState, useCallback } from 'react';
import type { ValidationError } from '@/lib/validation-service';

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors: ValidationError[];
  isValidating: boolean;
}

interface ValidationHookReturn extends ValidationState {
  validateFloorPlan: (data: any) => Promise<boolean>;
  validateDeviceRegistration: (data: any) => Promise<boolean>;
  validateNetworkTopology: (organizationId: string) => Promise<boolean>;
  validateSafeEdgeDisconnection: (organizationId: string) => Promise<boolean>;
  validateOrphanedDevices: (organizationId: string) => Promise<boolean>;
  clearValidation: () => void;
  setValidationState: (state: Partial<ValidationState>) => void;
}

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
  };
  fieldErrors?: ValidationError[];
  timestamp: string;
}

export function useValidation(): ValidationHookReturn {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    fieldErrors: [],
    isValidating: false
  });

  const updateValidationState = useCallback((updates: Partial<ValidationState>) => {
    setValidationState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: [],
      isValidating: false
    });
  }, []);

  const handleApiError = useCallback((error: any): boolean => {
    console.error('Validation API error:', error);

    if (error.fieldErrors && Array.isArray(error.fieldErrors)) {
      // Handle structured API error response
      updateValidationState({
        isValid: false,
        errors: [error.error?.message || 'Validation failed'],
        warnings: [],
        fieldErrors: error.fieldErrors,
        isValidating: false
      });
    } else if (error.error && typeof error.error === 'object') {
      // Handle API error response
      updateValidationState({
        isValid: false,
        errors: [error.error.message || 'Validation failed'],
        warnings: [],
        fieldErrors: error.fieldErrors || [],
        isValidating: false
      });
    } else if (typeof error === 'string') {
      // Handle simple error message
      updateValidationState({
        isValid: false,
        errors: [error],
        warnings: [],
        fieldErrors: [],
        isValidating: false
      });
    } else {
      // Handle unknown error format
      updateValidationState({
        isValid: false,
        errors: ['An unexpected validation error occurred'],
        warnings: [],
        fieldErrors: [],
        isValidating: false
      });
    }

    return false;
  }, [updateValidationState]);

  const validateFloorPlan = useCallback(async (data: any): Promise<boolean> => {
    updateValidationState({ isValidating: true });

    try {
      const response = await fetch('/api/floor-plans/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return handleApiError(result);
      }

      updateValidationState({
        isValid: true,
        errors: [],
        warnings: result.warnings || [],
        fieldErrors: [],
        isValidating: false
      });

      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }, [updateValidationState, handleApiError]);

  const validateDeviceRegistration = useCallback(async (data: any): Promise<boolean> => {
    updateValidationState({ isValidating: true });

    try {
      const response = await fetch('/api/devices/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return handleApiError(result);
      }

      updateValidationState({
        isValid: true,
        errors: [],
        warnings: result.warnings || [],
        fieldErrors: [],
        isValidating: false
      });

      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }, [updateValidationState, handleApiError]);

  const validateNetworkTopology = useCallback(async (organizationId: string): Promise<boolean> => {
    updateValidationState({ isValidating: true });

    try {
      const response = await fetch(`/api/network/topology?organizationId=${organizationId}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return handleApiError(result);
      }

      const validation = result.data?.validation;
      if (validation && !validation.isValid) {
        updateValidationState({
          isValid: false,
          errors: validation.errors || [],
          warnings: validation.warnings || [],
          fieldErrors: [{
            field: 'networkTopology',
            message: 'Network topology validation failed',
            code: 'NETWORK_TOPOLOGY_INVALID',
            severity: 'error'
          }],
          isValidating: false
        });
        return false;
      }

      updateValidationState({
        isValid: true,
        errors: [],
        warnings: validation?.warnings || [],
        fieldErrors: [],
        isValidating: false
      });

      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }, [updateValidationState, handleApiError]);

  const validateSafeEdgeDisconnection = useCallback(async (organizationId: string): Promise<boolean> => {
    updateValidationState({ isValidating: true });

    try {
      const response = await fetch(`/api/network/safe-edge/disconnect?organizationId=${organizationId}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return handleApiError(result);
      }

      updateValidationState({
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: [],
        isValidating: false
      });

      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }, [updateValidationState, handleApiError]);

  const validateOrphanedDevices = useCallback(async (organizationId: string): Promise<boolean> => {
    updateValidationState({ isValidating: true });

    try {
      const response = await fetch(`/api/devices/validate?organizationId=${organizationId}&type=orphaned`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return handleApiError(result);
      }

      updateValidationState({
        isValid: true,
        errors: [],
        warnings: [],
        fieldErrors: [],
        isValidating: false
      });

      return true;
    } catch (error) {
      return handleApiError(error);
    }
  }, [updateValidationState, handleApiError]);

  return {
    ...validationState,
    validateFloorPlan,
    validateDeviceRegistration,
    validateNetworkTopology,
    validateSafeEdgeDisconnection,
    validateOrphanedDevices,
    clearValidation,
    setValidationState: updateValidationState
  };
}

// Utility function to extract user-friendly error messages from API responses
export function extractValidationErrors(apiResponse: any): {
  errors: string[];
  warnings: string[];
  fieldErrors: ValidationError[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fieldErrors: ValidationError[] = [];

  if (apiResponse?.error?.message) {
    errors.push(apiResponse.error.message);
  }

  if (apiResponse?.fieldErrors && Array.isArray(apiResponse.fieldErrors)) {
    fieldErrors.push(...apiResponse.fieldErrors);
    
    // Extract messages for backward compatibility
    apiResponse.fieldErrors.forEach((fieldError: ValidationError) => {
      if (fieldError.severity === 'error') {
        errors.push(fieldError.message);
      } else if (fieldError.severity === 'warning') {
        warnings.push(fieldError.message);
      }
    });
  }

  if (apiResponse?.warnings && Array.isArray(apiResponse.warnings)) {
    warnings.push(...apiResponse.warnings);
  }

  return { errors, warnings, fieldErrors };
}

// Utility function to check if an error is a specific validation error type
export function isValidationErrorType(error: any, errorCode: string): boolean {
  if (error?.error?.code === errorCode) {
    return true;
  }

  if (error?.fieldErrors && Array.isArray(error.fieldErrors)) {
    return error.fieldErrors.some((fieldError: ValidationError) => fieldError.code === errorCode);
  }

  return false;
}

// Utility function to get error details for specific error types
export function getValidationErrorDetails(error: any): {
  isOrphanedDeviceError: boolean;
  isNetworkTopologyError: boolean;
  isSafeEdgeDisconnectionError: boolean;
  isFloorPlanValidationError: boolean;
  details?: any;
} {
  return {
    isOrphanedDeviceError: isValidationErrorType(error, 'ORPHANED_DEVICES_DETECTED'),
    isNetworkTopologyError: isValidationErrorType(error, 'NETWORK_TOPOLOGY_INVALID'),
    isSafeEdgeDisconnectionError: isValidationErrorType(error, 'SAFE_EDGE_HAS_CONNECTED_DEVICES'),
    isFloorPlanValidationError: isValidationErrorType(error, 'FLOOR_PLAN_VALIDATION_ERROR'),
    details: error?.error?.details
  };
}