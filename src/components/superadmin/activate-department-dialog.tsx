
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

type ActivateDepartmentDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentSQLite | null;
  onConfirm: () => void;
};

export function ActivateDepartmentDialog({
  isOpen,
  onOpenChange,
  department,
  onConfirm,
}: ActivateDepartmentDialogProps) {
  if (!department) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Activate Department?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reactivate the department "{department.departmentName}"?
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
