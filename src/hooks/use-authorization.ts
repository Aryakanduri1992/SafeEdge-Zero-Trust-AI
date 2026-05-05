"use client";

import { useAuth } from './use-auth';
import type { UserRole } from '@/lib/types';

/**
 * Client-side authorization hook for React components
 */
export function useAuthorization() {
  const { user } = useAuth();

  return {
    /**
     * Checks if current user can create floor plans
     */
    canCreateFloorPlan: (): boolean => {
      return user?.role === 'superadmin';
    },

    /**
     * Checks if current user can modify floor plans
     */
    canModifyFloorPlan: (): boolean => {
      return user?.role === 'superadmin';
    },

    /**
     * Checks if current user can view floor plan
     */
    canViewFloorPlan: (isApproved: boolean): boolean => {
      if (!user) return false;
      
      if (user.role === 'superadmin') {
        return true;
      }
      if (user.role === 'admin') {
        return isApproved;
      }
      return false;
    },

    /**
     * Checks if current user can reassign devices
     */
    canReassignDevice: (deviceOrgId: string): boolean => {
      if (!user) return false;
      return user.role === 'admin' && user.id === deviceOrgId;
    },

    /**
     * Checks if current user can approve floor plans
     */
    canApproveFloorPlan: (): boolean => {
      return user?.role === 'superadmin';
    },

    /**
     * Checks if current user can disconnect Safe Edge
     */
    canDisconnectSafeEdge: (): boolean => {
      return user?.role === 'superadmin';
    },

    /**
     * Checks if current user can view security events
     */
    canViewSecurityEvents: (organizationId?: string): boolean => {
      if (!user) return false;
      
      if (user.role === 'superadmin') {
        return true;
      }
      if (user.role === 'admin' && organizationId) {
        return user.id === organizationId;
      }
      return false;
    },

    /**
     * Checks if current user can view audit trail
     */
    canViewAuditTrail: (organizationId?: string): boolean => {
      if (!user) return false;
      
      if (user.role === 'superadmin') {
        return true;
      }
      if (user.role === 'admin' && organizationId) {
        return user.id === organizationId;
      }
      return false;
    },

    /**
     * Gets the current user's role
     */
    getUserRole: (): UserRole | null => {
      return user?.role || null;
    },

    /**
     * Gets the current user's organization ID
     */
    getUserOrganizationId: (): string | null => {
      return user?.id || null;
    },

    /**
     * Checks if user is authenticated
     */
    isAuthenticated: (): boolean => {
      return !!user;
    },

    /**
     * Checks if user is a Super Admin
     */
    isSuperAdmin: (): boolean => {
      return user?.role === 'superadmin';
    },

    /**
     * Checks if user is an Organization Admin
     */
    isOrgAdmin: (): boolean => {
      return user?.role === 'admin';
    }
  };
}