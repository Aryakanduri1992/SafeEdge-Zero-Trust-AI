"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Device } from "@/lib/types";

type DeleteDeviceDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  device: Device | null;
  onConfirm: () => void;
};

export function DeleteDeviceDialog({
  isOpen,
  onOpenChange,
  device,
  onConfirm,
}: DeleteDeviceDialogProps) {
  if (!device) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Device?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove the device "{device.name}"? This
            action cannot be undone and all associated data will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: "destructive" })}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
