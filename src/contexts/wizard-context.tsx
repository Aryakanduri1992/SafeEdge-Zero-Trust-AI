"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  OrganizationInfo,
  Department,
  FloorWithRooms,
  Device,
} from '@/lib/validations/organization-wizard';
import { generateId, getPlanDeviceLimit } from '@/lib/wizard-utils';

interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  organizationData: Partial<OrganizationInfo>;
  departments: Department[];
  floors: FloorWithRooms[];
  devices: Device[];
}

interface WizardContextType {
  state: WizardState;
  setOrganizationData: (data: Partial<OrganizationInfo>) => void;
  setDepartments: (departments: Department[]) => void;
  setFloors: (floors: FloorWithRooms[]) => void;
  setDevices: (devices: Device[]) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeStep: (step: number) => void;
  resetWizard: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const STORAGE_KEY = 'organization-wizard-state';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const initialState: WizardState = {
  currentStep: 1,
  completedSteps: new Set(),
  organizationData: {
    plan: 'basic',
    maxDevices: 50,
  },
  departments: [],
  floors: [],
  devices: [],
};

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  // Auto-save functionality
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        ...state,
        completedSteps: Array.from(state.completedSteps),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save wizard state:', error);
    }
  }, [state]);

  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          ...parsed,
          completedSteps: new Set(parsed.completedSteps),
        });
        return true;
      }
    } catch (error) {
      console.error('Failed to load wizard state:', error);
    }
    return false;
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  const setOrganizationData = useCallback((data: Partial<OrganizationInfo>) => {
    setState(prev => ({
      ...prev,
      organizationData: { ...prev.organizationData, ...data },
    }));
    
    // Update maxDevices if plan changes
    if (data.plan) {
      const maxDevices = getPlanDeviceLimit(data.plan);
      setState(prev => ({
        ...prev,
        organizationData: { ...prev.organizationData, maxDevices },
      }));
    }
  }, []);

  const setDepartments = useCallback((departments: Department[]) => {
    setState(prev => ({ ...prev, departments }));
  }, []);

  const setFloors = useCallback((floors: FloorWithRooms[]) => {
    setState(prev => ({ ...prev, floors }));
  }, []);

  const setDevices = useCallback((devices: Device[]) => {
    setState(prev => ({ ...prev, devices }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 6),
    }));
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const completeStep = useCallback((step: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
    }));
  }, []);

  const resetWizard = useCallback(() => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: WizardContextType = {
    state,
    setOrganizationData,
    setDepartments,
    setFloors,
    setDevices,
    goToStep,
    nextStep,
    previousStep,
    completeStep,
    resetWizard,
    saveToLocalStorage,
    loadFromLocalStorage,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
