"use client";

import { useState, useCallback, useMemo } from 'react';
import { validateFloorPlan, type Floor, type FloorPlanValidationResult } from '@/lib/floor-plan-validation';

export interface OrganizationWizardData {
  // Step 1: Basic Info
  organizationName: string;
  email: string;
  password: string;
  description?: string;
  
  // Step 2: Building Structure
  totalFloors: number;
  buildingName?: string;
  buildingAddress?: string;
  
  // Step 3: Floor & Room Data
  floors: Floor[];
  
  // Step 4: Department
  departmentName: string;
  location: string;
  plan: 'Basic' | 'Pro' | 'Enterprise';
  devices: number;
}

export interface WizardStepValidation {
  isValid: boolean;
  errors: string[];
  canProceed: boolean;
}

export interface UseOrganizationWizardReturn {
  // Data
  data: Partial<OrganizationWizardData>;
  currentStep: number;
  
  // Actions
  updateData: (stepData: Partial<OrganizationWizardData>) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetWizard: () => void;
  
  // Validation
  validateCurrentStep: () => WizardStepValidation;
  validateAllSteps: () => Record<number, WizardStepValidation>;
  floorPlanValidation: FloorPlanValidationResult;
  
  // Utilities
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceedToNext: boolean;
  completionPercentage: number;
}

const TOTAL_STEPS = 5;

const initialData: Partial<OrganizationWizardData> = {
  floors: [],
  plan: 'Basic',
  devices: 10,
  totalFloors: 1,
};

export function useOrganizationWizard(): UseOrganizationWizardReturn {
  const [data, setData] = useState<Partial<OrganizationWizardData>>(initialData);
  const [currentStep, setCurrentStep] = useState(1);

  // Update wizard data
  const updateData = useCallback((stepData: Partial<OrganizationWizardData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const resetWizard = useCallback(() => {
    setData(initialData);
    setCurrentStep(1);
  }, []);

  // Validation for individual steps
  const validateStep1 = useCallback((): WizardStepValidation => {
    const errors: string[] = [];
    
    if (!data.organizationName?.trim()) {
      errors.push('Organization name is required');
    }
    
    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!data.password?.trim()) {
      errors.push('Password is required');
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      canProceed: errors.length === 0
    };
  }, [data.organizationName, data.email, data.password]);

  const validateStep2 = useCallback((): WizardStepValidation => {
    const errors: string[] = [];
    
    if (!data.totalFloors || data.totalFloors < 1) {
      errors.push('At least 1 floor is required');
    }
    
    if (data.totalFloors && data.totalFloors > 50) {
      errors.push('Maximum 50 floors allowed');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      canProceed: errors.length === 0
    };
  }, [data.totalFloors]);

  const validateStep3 = useCallback((): WizardStepValidation => {
    const errors: string[] = [];
    
    if (!data.floors || data.floors.length === 0) {
      errors.push('At least one floor with rooms is required');
    }
    
    if (data.floors) {
      // Check if all floors have rooms
      const floorsWithoutRooms = data.floors.filter(floor => floor.rooms.length === 0);
      if (floorsWithoutRooms.length > 0) {
        errors.push(`${floorsWithoutRooms.length} floor(s) have no rooms defined`);
      }
      
      // Check total room count
      const totalRooms = data.floors.reduce((total, floor) => total + floor.rooms.length, 0);
      if (totalRooms === 0) {
        errors.push('At least one room is required');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      canProceed: errors.length === 0
    };
  }, [data.floors]);

  const validateStep4 = useCallback((): WizardStepValidation => {
    const errors: string[] = [];
    
    if (!data.departmentName?.trim()) {
      errors.push('Department name is required');
    }
    
    if (!data.location?.trim()) {
      errors.push('Location is required');
    }
    
    if (!data.plan) {
      errors.push('Plan selection is required');
    }
    
    if (!data.devices || data.devices < 1) {
      errors.push('At least 1 device is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      canProceed: errors.length === 0
    };
  }, [data.departmentName, data.location, data.plan, data.devices]);

  const validateStep5 = useCallback((): WizardStepValidation => {
    // Step 5 is review - validate all previous steps
    const step1 = validateStep1();
    const step2 = validateStep2();
    const step3 = validateStep3();
    const step4 = validateStep4();
    
    const allErrors = [
      ...step1.errors,
      ...step2.errors,
      ...step3.errors,
      ...step4.errors
    ];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      canProceed: allErrors.length === 0
    };
  }, [validateStep1, validateStep2, validateStep3, validateStep4]);

  // Current step validation
  const validateCurrentStep = useCallback((): WizardStepValidation => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      case 5: return validateStep5();
      default: return { isValid: false, errors: ['Invalid step'], canProceed: false };
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3, validateStep4, validateStep5]);

  // All steps validation
  const validateAllSteps = useCallback((): Record<number, WizardStepValidation> => {
    return {
      1: validateStep1(),
      2: validateStep2(),
      3: validateStep3(),
      4: validateStep4(),
      5: validateStep5(),
    };
  }, [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5]);

  // Floor plan validation
  const floorPlanValidation = useMemo(() => {
    if (!data.floors || data.floors.length === 0) {
      return { isValid: true, errors: [], warnings: [] };
    }
    return validateFloorPlan(data.floors);
  }, [data.floors]);

  // Computed properties
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;
  const canProceedToNext = validateCurrentStep().canProceed;
  
  const completionPercentage = useMemo(() => {
    const validSteps = Object.values(validateAllSteps()).filter(v => v.isValid).length;
    return Math.round((validSteps / TOTAL_STEPS) * 100);
  }, [validateAllSteps]);

  return {
    // Data
    data,
    currentStep,
    
    // Actions
    updateData,
    setCurrentStep,
    nextStep,
    prevStep,
    resetWizard,
    
    // Validation
    validateCurrentStep,
    validateAllSteps,
    floorPlanValidation,
    
    // Utilities
    isFirstStep,
    isLastStep,
    canProceedToNext,
    completionPercentage,
  };
}