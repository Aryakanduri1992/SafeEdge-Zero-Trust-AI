"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ArrowRight, Building } from 'lucide-react';
import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';

const formSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  description: z.string().optional(),
});

interface OrganizationBasicInfoProps {
  data: Partial<OrganizationWizardData>;
  onUpdate: (data: Partial<OrganizationWizardData>) => void;
  onNext: () => void;
  canProceed?: boolean;
}

export function OrganizationBasicInfo({ data, onUpdate, onNext, canProceed = true }: OrganizationBasicInfoProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: data.organizationName || '',
      email: data.email || '',
      password: data.password || '',
      description: data.description || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onUpdate(values);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Organization Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter the basic details for the new organization
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., TechCorp Industries" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This will be the display name for the organization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="admin@techcorp.com" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This will be the primary login email for the organization admin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Password *</FormLabel>
                <FormControl>
                  <Input 
                    type="password"
                    placeholder="Enter a secure password" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The organization admin can change this password after first login
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of the organization..."
                    className="resize-none"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Optional description for internal reference
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit">
              Next: Building Structure
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}