"use client";

import React, { useState } from 'react';
import { useWizard } from '@/contexts/wizard-context';
import { FloorWithRooms } from '@/lib/validations/organization-wizard';
import { generateId } from '@/lib/wizard-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FloorPlanBuilderStep() {
  const { state, setFloors, completeStep, nextStep } = useWizard();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorWithRooms | null>(null);
  const [formData, setFormData] = useState({
    floorNumber: state.floors.length + 1,
    floorName: '',
    totalArea: 1000,
    description: '',
  });

  const handleAddFloor = () => {
    if (!formData.floorName || formData.totalArea <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    const newFloor: FloorWithRooms = {
      id: editingFloor?.id || generateId(),
      floorNumber: formData.floorNumber,
      floorName: formData.floorName,
      totalArea: formData.totalArea,
      description: formData.description,
      rooms: editingFloor?.rooms || [],
    };

    if (editingFloor) {
      setFloors(state.floors.map(f => f.id === editingFloor.id ? newFloor : f));
    } else {
      setFloors([...state.floors, newFloor]);
    }

    setFormData({
      floorNumber: state.floors.length + 2,
      floorName: '',
      totalArea: 1000,
      description: '',
    });
    setEditingFloor(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (floor: FloorWithRooms) => {
    setEditingFloor(floor);
    setFormData({
      floorNumber: floor.floorNumber,
      floorName: floor.floorName,
      totalArea: floor.totalArea,
      description: floor.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure? This will delete all rooms on this floor.')) {
      setFloors(state.floors.filter(f => f.id !== id));
    }
  };

  const handleContinue = () => {
    if (state.floors.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one floor',
      });
      return;
    }
    completeStep(3);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Floors ({state.floors.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFloor(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Floor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFloor ? 'Edit Floor' : 'Add Floor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Floor Number *</Label>
                <Input
                  type="number"
                  value={formData.floorNumber}
                  onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Floor Name *</Label>
                <Input
                  value={formData.floorName}
                  onChange={(e) => setFormData({ ...formData, floorName: e.target.value })}
                  placeholder="e.g., Ground Floor, First Floor"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Area (sq ft) *</Label>
                <Input
                  type="number"
                  value={formData.totalArea}
                  onChange={(e) => setFormData({ ...formData, totalArea: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <Button onClick={handleAddFloor} className="w-full">
                {editingFloor ? 'Update Floor' : 'Add Floor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {state.floors.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No floors added yet. Click "Add Floor" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {state.floors.sort((a, b) => a.floorNumber - b.floorNumber).map((floor) => (
            <Card key={floor.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">Floor {floor.floorNumber}: {floor.floorName}</h4>
                    <p className="text-sm text-muted-foreground">{floor.description}</p>
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Total Area:</span> {floor.totalArea} sq ft
                      <span className="ml-4 text-muted-foreground">Rooms:</span> {floor.rooms.length}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(floor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(floor.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={state.floors.length === 0}>
          Continue to Rooms
        </Button>
      </div>
    </div>
  );
}
