
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  organizationName: z.string().min(2, { message: 'Organization Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  departmentName: z.string().min(2, { message: 'Department Name is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  building: z.string().min(1, { message: 'Building is required.' }),
  floor: z.string().min(1, { message: 'Floor is required.' }),
  plan: z.enum(['Free', 'Pro', 'Enterprise']),
  devices: z.coerce.number().min(1, { message: 'Must have at least 1 device.' }),
});

type CreateOrgFormProps = {
  onFinished: () => void;
};

export function CreateOrganizationForm({ onFinished }: CreateOrgFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createOrganization } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      departmentName: '',
      location: '',
      building: '',
      floor: '',
      plan: 'Free',
      devices: 10,
    },
    mode: 'onChange',
  });
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      await createOrganization(values);
      toast({
        title: 'Organization Created',
        description: `Organization "${values.organizationName}" and its first department have been successfully created.`,
      });
      onFinished();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <ScrollArea className="h-[60vh] pr-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-primary">Organization Credentials</h3>
              <p className="text-sm text-muted-foreground">This will be the primary login for the organization's admin.</p>
            </div>
            <div className="space-y-4 rounded-md border p-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quantum Innovations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Login Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@quantuminnovations.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter a strong password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-medium text-primary">Initial Department</h3>
              <p className="text-sm text-muted-foreground">Create the first department for this organization.</p>
            </div>
            <div className="space-y-4 rounded-md border p-4">
               <FormField
                  control={form.control}
                  name="departmentName"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Research & Development" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., New York" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="building"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Building</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Tower 1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="floor"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Floor</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 25" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Subscription Plan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a plan" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Free">Free</SelectItem>
                                        <SelectItem value="Pro">Pro</SelectItem>
                                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="devices"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Device Quota</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 50" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Create Organization
          </Button>
        </div>
      </form>
    </Form>
  );
}
