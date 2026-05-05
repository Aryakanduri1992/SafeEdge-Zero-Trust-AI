"use client";

import React, { useState } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { calculateWizardProgress } from '@/lib/wizard-utils';
import { 
  Building2, 
  Users, 
  Layers, 
  LayoutGrid, 
  Cpu, 
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Import step components (we'll create these next)
import OrganizationInfoStep from './steps/organization-info-step';
import DepartmentManagementStep from './steps/department-management-step';
import FloorPlanBuilderStep from './steps/floor-plan-builder-step';
import RoomManagementStep from './steps/room-management-step';
import DeviceConfigurationStep from './steps/device-configuration-step';
import ReviewConfirmationStep from './steps/review-confirmation-step';

interface WizardContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (organizationId: string) => void;
}

const STEPS = [
  { number: 1, title: 'Organization Info', icon: Building2 },
  { number: 2, title: 'Departments', icon: Users },
  { number: 3, title: 'Floor Plans', icon: Layers },
  { number: 4, title: 'Rooms', icon: LayoutGrid },
  { number: 5, title: 'Devices', icon: Cpu },
  { number: 6, title: 'Review', icon: CheckCircle2 },
];

export default function WizardContainer({ open, onOpenChange, onComplete }: WizardContainerProps) {
  const { state, nextStep, previousStep, goToStep, resetWizard } = useWizard();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = calculateWizardProgress(state.currentStep);

  const handleClose = () => {
    if (confirm('Are you sure you want to close? Your progress will be saved.')) {
      onOpenChange(false);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Allow navigation to completed steps or current step
    if (state.completedSteps.has(stepNumber - 1) || stepNumber <= state.currentStep) {
      goToStep(stepNumber);
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <OrganizationInfoStep />;
      case 2:
        return <DepartmentManagementStep />;
      case 3:
        return <FloorPlanBuilderStep />;
      case 4:
        return <RoomManagementStep />;
      case 5:
        return <DeviceConfigurationStep />;
      case 6:
        return (
          <ReviewConfirmationStep
            onComplete={onComplete}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Organization (Advanced)</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {state.currentStep} of 6</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center py-4 border-b">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = state.currentStep === step.number;
            const isCompleted = state.completedSteps.has(step.number);
            const isAccessible = isCompleted || step.number <= state.currentStep;

            return (
              <button
                key={step.number}
                onClick={() => handleStepClick(step.number)}
                disabled={!isAccessible}
                className={`flex flex-col items-center gap-2 flex-1 transition-all ${
                  isAccessible ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-40'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        {state.currentStep !== 6 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={state.currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
