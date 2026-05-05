
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Device, NewDeviceData, UpdateDeviceData, Room } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Device name is required.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  roomId: z.string().min(1, 'Please select a room.'),
  location: z.string().min(1, 'Location is required.'),
  type: z.enum(["Sensor", "Gateway", "Actuator", "Camera", "PIR", "LDR", "DHT22_Temp", "DHT22_Humidity"]),
  description: z.string().optional(),
});

type DeviceFormProps = {
  deviceToEdit?: Device | null;
  onFinished: () => void;
};

export function DeviceForm({ deviceToEdit, onFinished }: DeviceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
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
      roomId: deviceToEdit?.roomId || '',
      location: deviceToEdit?.location || '',
      type: deviceToEdit?.type || 'Sensor',
      description: deviceToEdit?.description || '',
    },
  });

  // Load available rooms when component mounts or user changes
  useEffect(() => {
    const loadRooms = async () => {
      if (!user) return;
      
      setIsLoadingRooms(true);
      try {
        // Use API endpoint to get rooms from current floor plan
        const response = await fetch(`/api/floor-plans/current/rooms?organizationId=${user.id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setAvailableRooms(result.data);
        } else {
          setAvailableRooms([]);
          if (result.error) {
            toast({
              variant: "destructive",
              title: "Error Loading Rooms",
              description: result.error,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load rooms:", error);
        setAvailableRooms([]);
        toast({
          variant: "destructive",
          title: "Error Loading Rooms",
          description: "Failed to load available rooms. Please try again.",
        });
      } finally {
        setIsLoadingRooms(false);
      }
    };

    loadRooms();
  }, [user, toast]);


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

    // Validate that a room is selected
    if (!values.roomId) {
      toast({
        variant: "destructive",
        title: "Room Required",
        description: "Please select a room for the device.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (deviceToEdit) {
        // When editing, we don't change the dbPath, just the other details.
        const updateData: UpdateDeviceData = { ...values };
        await updateDevice(deviceToEdit.id, updateData);
      } else {
        const newData: NewDeviceData = {
          ...values,
          organizationId: user.id,
          // The dbPath is now derived from the name.
          dbPath: `devices/${values.name.replace(/\s+/g, '_')}`
        };
        await createDevice(newData);
      }
      onFinished();
    } catch (error) {
      console.error("Failed to save device:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save device. Please try again.",
      });
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
                <Input placeholder="e.g., PIR_Sensor or DHT22_Sensor" {...field} />
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
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Assignment</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingRooms}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRooms.length === 0 && !isLoadingRooms ? (
                    <div className="p-2 text-sm text-gray-500">
                      No rooms available - Create a floor plan first
                    </div>
                  ) : (
                    availableRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} ({room.identifier})
                      </SelectItem>
                    ))
                  )}
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
                  <SelectItem value="Sensor">Generic Sensor</SelectItem>
                  <SelectItem value="Gateway">Gateway</SelectItem>
                  <SelectItem value="Actuator">Actuator</SelectItem>
                  <SelectItem value="Camera">Camera</SelectItem>
                  <SelectItem value="PIR">PIR Motion Sensor</SelectItem>
                  <SelectItem value="LDR">Light Sensor</SelectItem>
                  <SelectItem value="DHT22_Temp">DHT22 Temp/Humidity</SelectItem>
                  <SelectItem value="DHT22_Humidity">DHT22 Temp/Humidity</SelectItem>
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
