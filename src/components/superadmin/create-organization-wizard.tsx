"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { OrganizationBasicInfo } from './organization-basic-info';
import { BuildingStructureSetup } from './building-structure-setup';
import { FloorRoomsSetup } from './floor-rooms-setup';
import { DepartmentSetup } from './department-setup';
import { OrganizationReview } from './organization-review';
import { useToast } from '@/hooks/use-toast';
import { FloorPlanPreview } from './floor-plan-preview';
import { useOrganizationWizard } from '@/hooks/use-organization-wizard';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';

const STEPS = [
  { id: 1, title: 'Organization Info', description: 'Basic organization details' },
  { id: 2, title: 'Building Structure', description: 'Define floors and layout' },
  { id: 3, title: 'Rooms Setup', description: 'Configure rooms for each floor' },
  { id: 4, title: 'Department Setup', description: 'Create initial department' },
  { id: 5, title: 'Review & Create', description: 'Review and finalize setup' },
];

interface CreateOrganizationWizardProps {
  onFinished: () => void;
}

export function CreateOrganizationWizard({ onFinished }: CreateOrganizationWizardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Enhanced wizard with validation and preview
  const {
    data: wizardData,
    currentStep,
    updateData: updateWizardData,
    nextStep,
    prevStep,
    validateCurrentStep,
    floorPlanValidation,
    canProceedToNext,
    completionPercentage
  } = useOrganizationWizard();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Call the integrated setup API
      const response = await fetch('/api/superadmin/organizations/complete-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      toast({
        title: 'Organization Created Successfully',
        description: `${wizardData.organizationName} has been set up with complete floor plan and department.`,
      });
      
      onFinished();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Setup Failed',
        description: error.message || 'An unexpected error occurred during setup.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OrganizationBasicInfo
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            canProceed={canProceedToNext}
          />
        );
      case 2:
        return (
          <BuildingStructureSetup
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
            canProceed={canProceedToNext}
          />
        );
      case 3:
        return (
          <FloorRoomsSetup
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
            canProceed={canProceedToNext}
          />
        );
      case 4:
        return (
          <DepartmentSetup
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={nextStep}
            onPrev={prevStep}
            canProceed={canProceedToNext}
          />
        );
      case 5:
        return (
          <OrganizationReview
            data={wizardData}
            onComplete={handleComplete}
            onPrev={prevStep}
            isLoading={isLoading}
            canProceed={canProceedToNext}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Create New Organization</h2>
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>
        
        <Progress value={completionPercentage} className="w-full" />
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep > step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : currentStep === step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>
        
        {/* Current Step Info */}
        <div className="text-center">
          <h3 className="font-semibold">{STEPS[currentStep - 1].title}</h3>
          <p className="text-sm text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Validation Feedback */}
      {(() => {
        const validation = validateCurrentStep();
        if (!validation.isValid && validation.errors.length > 0) {
          return (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          );
        }
        return null;
      })()}

      {/* Floor Plan Validation for Step 3 */}
      {currentStep === 3 && !floorPlanValidation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Floor Plan Issues:</div>
              {floorPlanValidation.errors.slice(0, 3).map((error, index) => (
                <div key={index}>• {error.message}</div>
              ))}
              {floorPlanValidation.errors.length > 3 && (
                <div>• +{floorPlanValidation.errors.length - 3} more issues</div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
          
          {/* Floor Plan Preview for Steps 3+ */}
          {currentStep >= 3 && wizardData.floors && wizardData.floors.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Floor Plan Preview</h4>
              <FloorPlanPreview floors={wizardData.floors} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}