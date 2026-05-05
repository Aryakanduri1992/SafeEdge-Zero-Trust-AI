"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizard } from '@/contexts/wizard-context';
import { organizationInfoSchema, OrganizationInfo } from '@/lib/validations/organization-wizard';
import { getPlanDeviceLimit } from '@/lib/wizard-utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizationInfoStep() {
  const { state, setOrganizationData, completeStep, nextStep } = useWizard();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OrganizationInfo>({
    resolver: zodResolver(organizationInfoSchema),
    mode: 'onChange',
    defaultValues: state.organizationData as OrganizationInfo,
  });

  const selectedPlan = watch('plan');

  // Update maxDevices when plan changes
  useEffect(() => {
    if (selectedPlan) {
      const maxDevices = getPlanDeviceLimit(selectedPlan);
      setValue('maxDevices', maxDevices);
    }
  }, [selectedPlan, setValue]);

  const onSubmit = (data: OrganizationInfo) => {
    console.log('Step 1 - Saving organization data:', data);
    setOrganizationData(data);
    completeStep(1);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Organization details and credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., TechCorp Industries"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="admin@techcorp.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter secure password"
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Min 8 characters, 1 uppercase, 1 number, 1 special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan *</Label>
              <Select
                value={watch('plan')}
                onValueChange={(value) => setValue('plan', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic (50 devices)</SelectItem>
                  <SelectItem value="pro">Pro (150 devices)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (500 devices)</SelectItem>
                </SelectContent>
              </Select>
              {errors.plan && (
                <p className="text-sm text-red-500">{errors.plan.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDevices">Max Devices</Label>
              <Input
                id="maxDevices"
                type="number"
                {...register('maxDevices', { valueAsNumber: true })}
                readOnly
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                {...register('contactPerson')}
                placeholder="John Doe"
              />
              {errors.contactPerson && (
                <p className="text-sm text-red-500">{errors.contactPerson.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber')}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="123 Main Street"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="NY"
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  placeholder="10001"
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  {...register('country')}
                  placeholder="USA"
                />
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Departments
        </button>
      </div>
    </form>
  );
}
