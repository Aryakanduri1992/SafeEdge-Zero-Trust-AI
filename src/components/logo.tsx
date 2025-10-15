"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-16 w-16 text-primary", className)}
      aria-labelledby="logo-title"
    >
      <title id="logo-title">SafeEdge Cyber System Logo</title>
      
      {/* Shield (Cybersecurity) */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      
      {/* AI/ML Brain (left side) */}
      <path d="M8 10c0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1-0.5 1.5-1 2s-1 1-1 2" strokeWidth="1.5" />
      <circle cx="9" cy="14" r="0.5" fill="currentColor" />
      
      {/* Circuit/IoT connections (right side) */}
      <circle cx="15" cy="9" r="1" strokeWidth="1.5" />
      <circle cx="17" cy="12" r="0.5" fill="currentColor" />
      <circle cx="15" cy="15" r="0.5" fill="currentColor" />
      <path d="M15 8v1m0 2v1m0 2v1" strokeWidth="1.5" />
      <path d="M14 9h2m-2 3h2" strokeWidth="1.5" />
      
      {/* WiFi/IoT signal (top right) */}
      <path d="M16 6c1.5 0 2.5 1 2.5 2.5" strokeWidth="1" opacity="0.7" />
      <path d="M17 7c0.5 0 1 0.5 1 1" strokeWidth="1" opacity="0.7" />
      
      {/* Lock (security emphasis) */}
      <rect x="10.5" y="11" width="3" height="2.5" rx="0.5" strokeWidth="1.5" />
      <path d="M11.5 11v-1c0-0.5 0.5-1 1-1s1 0.5 1 1v1" strokeWidth="1.5" />
    </svg>
  );
}