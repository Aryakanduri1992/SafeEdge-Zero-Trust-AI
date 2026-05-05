"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Users, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrganizationWizardData } from '@/hooks/use-organization-wizard';

const formSchema = z.object({
  departmentName: z.string().min(2, { message: 'Department name must be at least 2 characters.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  plan: z.enum(['Basic', 'Pro', 'Enterprise']),
  devices: z.coerce.number().min(1, { message: 'Must allow at least 1 device.' }).max(1000, { message: 'Maximum 1000 devices allowed.' }),
});

interface DepartmentSetupProps {
  data: Partial<OrganizationWizardData>;
  onUpdate: (data: Partial<OrganizationWizardData>) => void;
  onNext: () => void;
  onPrev: () => void;
  canProceed?: boolean;
}

const PLAN_FEATURES = {
  Basic: {
    devices: 10,
    features: ['Basic device monitoring', 'Simple floor plans', 'Email support'],
    price: '$0/month',
    color: 'text-green-600',
  },
  Pro: {
    devices: 100,
    features: ['Advanced monitoring', 'Real-time alerts', 'API access', 'Priority support'],
    price: '$49/month',
    color: 'text-blue-600',
  },
  Enterprise: {
    devices: 1000,
    features: ['Unlimited monitoring', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    price: 'Custom pricing',
    color: 'text-purple-600',
  },
};

export function DepartmentSetup({ data, onUpdate, onNext, onPrev, canProceed = true }: DepartmentSetupProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      departmentName: data.departmentName || 'IT Department',
      location: data.location || '',
      plan: data.plan || 'Basic',
      devices: data.devices || 10,
    },
  });

  const selectedPlan = form.watch('plan');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onUpdate(values);
    onNext();
  };

  const getTotalRooms = () => {
    return data.floors?.reduce((total, floor) => total + floor.rooms.length, 0) || 0;
  };

  const getRecommendedDevices = () => {
    const totalRooms = getTotalRooms();
    return Math.max(totalRooms * 2, 10); // Recommend 2 devices per room minimum
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Department Setup</h3>
          <p className="text-sm text-muted-foreground">
            Configure the initial department for this organization
          </p>
        </div>
      </div>

      {/* Building Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Building Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{data.totalFloors}</div>
              <div className="text-sm text-muted-foreground">Floors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{getTotalRooms()}</div>
              <div className="text-sm text-muted-foreground">Rooms</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.floors?.reduce((total, floor) => 
                  total + floor.rooms.reduce((roomTotal, room) => 
                    roomTotal + (room.width * room.height), 0
                  ), 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Area (sq ft)</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{getRecommendedDevices()}</div>
              <div className="text-sm text-muted-foreground">Recommended Devices</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="departmentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., IT Department" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  This will be the first department created for the organization
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., New York, NY" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Physical location or city where this department operates
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan Selection */}
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Plan *</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLAN_FEATURES).map(([plan, details]) => (
                        <SelectItem key={plan} value={plan}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{plan}</span>
                            <span className={`text-sm ${details.color}`}>
                              ({details.price})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan Details */}
          {selectedPlan && (
            <Card>
              <CardHeader>
                <CardTitle className={`text-base ${PLAN_FEATURES[selectedPlan].color}`}>
                  {selectedPlan} Plan - {PLAN_FEATURES[selectedPlan].price}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Up to {PLAN_FEATURES[selectedPlan].devices} devices
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {PLAN_FEATURES[selectedPlan].features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="devices"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Quota *</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    max={PLAN_FEATURES[selectedPlan]?.devices || 1000}
                    placeholder={`e.g., ${getRecommendedDevices()}`}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of devices this department can register 
                  (Recommended: {getRecommendedDevices()} based on {getTotalRooms()} rooms)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrev}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button type="submit">
              Next: Review & Create
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}