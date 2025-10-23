
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Users, ShieldAlert, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/use-auth";
import type { Organization } from "@/lib/types";


export const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Organization" },
  { href: "/admin/departments", icon: Users, label: "Departments" },
  { href: "/admin/devices", icon: HardDrive, label: "Devices" },
  { href: "/admin/alerts", icon: ShieldAlert, label: "Alerts" },
  { href: "/admin/profile", icon: User, label: "Profile" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const orgUser = user as Organization;

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8" />
            <span className="font-headline text-xl text-primary">{orgUser?.organizationName || "Dashboard"}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  pathname === item.href && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
