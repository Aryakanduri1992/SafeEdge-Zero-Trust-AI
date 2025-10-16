
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

type DeactivateAdminDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminUser | null;
  onConfirm: () => void;
};

export function DeactivateAdminDialog({
  isOpen,
  onOpenChange,
  admin,
  onConfirm,
}: DeactivateAdminDialogProps) {
  if (!admin) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Admin Account?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate the account for "{admin.departmentName}"?
            They will immediately lose access to their dashboard. This can be undone later if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: "destructive" })}
          >
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
