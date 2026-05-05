
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
import { DepartmentSQLite } from "@/lib/types";

type DeactivateDepartmentDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentSQLite | null;
  onConfirm: () => void;
};

export function DeactivateDepartmentDialog({
  isOpen,
  onOpenChange,
  department,
  onConfirm,
}: DeactivateDepartmentDialogProps) {
  if (!department) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Department?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate the department "{department.departmentName}"?
            This will prevent access for this department but will not affect the rest of the organization. This can be undone later.
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
