
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
import { buttonVariants } from "@/components/ui/button";
import { AdminUser } from "@/lib/types";

type ActivateAdminDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  onConfirm: () => void;
};

export function ActivateAdminDialog({
  isOpen,
  onOpenChange,
  admin,
  onConfirm,
}: ActivateAdminDialogProps) {
  if (!admin) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Department?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reactivate the department "{admin.departmentName}"?
            They will immediately regain access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: "default" })}
          >
            Activate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    