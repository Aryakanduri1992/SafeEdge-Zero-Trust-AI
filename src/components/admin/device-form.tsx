
"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, PlusCircle } from 'lucide-react';
import { Device, NewDeviceData, UpdateDeviceData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Device name is required.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  location: z.string().min(1, 'Location is required.'),
  type: z.enum(["Sensor", "Gateway", "Actuator", "Camera"]),
  description: z.string().optional(),
});

type DeviceFormProps = {
  deviceToEdit?: Device | null;
  onFinished: () => void;
};

export function DeviceForm({ deviceToEdit, onFinished }: DeviceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user, departments, devices, createDevice, updateDevice } = useAuth();
  const { toast } = useToast();

  const { totalDeviceQuota, usedDevices } = useMemo(() => {
    const quota = departments.reduce((acc, dept) => acc + dept.devices, 0);
    return {
      totalDeviceQuota: quota,
      usedDevices: devices.length,
    };
  }, [departments, devices]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: deviceToEdit?.name || '',
      departmentId: deviceToEdit?.departmentId || '',
      location: deviceToEdit?.location || '',
      type: deviceToEdit?.type || 'Sensor',
      description: deviceToEdit?.description || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    if (!deviceToEdit && usedDevices >= totalDeviceQuota) {
      toast({
        variant: "destructive",
        title: "Quota Reached",
        description: "You have reached your device limit. Contact admin to upgrade plan.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (deviceToEdit) {
        const updateData: UpdateDeviceData = { ...values };
        await updateDevice(deviceToEdit.id, updateData);
      } else {
        const newData: NewDeviceData = {
          ...values,
          organizationId: user.id,
        };
        await createDevice(newData);
      }
      onFinished();
    } catch (error) {
      console.error("Failed to save device:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Entrance Camera" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="departmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to a department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Physical Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lobby, 1st Floor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Sensor">Sensor</SelectItem>
                  <SelectItem value="Gateway">Gateway</SelectItem>
                  <SelectItem value="Actuator">Actuator</SelectItem>
                  <SelectItem value="Camera">Camera</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional: Add any relevant notes about the device." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : deviceToEdit ? (
              <Save className="mr-2 h-4 w-4" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            {deviceToEdit ? 'Save Changes' : 'Create Device'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
