"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16", className)}>
      <Image
        src="/logo.png"
        alt="Blackshield-X Cyber System Logo"
        fill
        className="object-contain drop-shadow-lg"
        priority
        style={{ background: 'transparent' }}
      />
    </div>
  );
}
