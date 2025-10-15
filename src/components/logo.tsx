"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("h-16 w-16 text-primary", className)}
      aria-labelledby="logo-title"
    >
      <title id="logo-title">SafeEdge Cyber System Logo</title>
      <defs>
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Shield Outline */}
      <path
        d="M50 2.5 C 50 2.5, 95 15, 95 40 L 95 60 C 95 85, 50 97.5, 50 97.5 C 50 97.5, 5 85, 5 60 L 5 40 C 5 15, 50 2.5, 50 2.5 Z"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        fill="hsl(var(--background))"
      />
      {/* AI/Neural Network side (left) */}
      <circle cx="25" cy="40" r="3" fill="url(#shieldGradient)" />
      <circle cx="35" cy="55" r="2.5" fill="url(#shieldGradient)" />
      <circle cx="20" cy="65" r="2" fill="url(#shieldGradient)" />
      <path d="M 25 40 Q 30 50, 35 55" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" fill="none" />
      <path d="M 35 55 Q 25 60, 20 65" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" fill="none" />
      <path d="M 25 40 C 15 50, 15 60, 20 65" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" fill="none" />

      {/* IoT/Circuit side (right) */}
      <path d="M 70 30 L 70 45 L 80 45" stroke="url(#shieldGradient)" strokeWidth="2" fill="none" />
      <path d="M 60 55 L 80 55 L 80 70" stroke="url(#shieldGradient)" strokeWidth="2" fill="none" />
      <path d="M 70 45 L 60 55" stroke="url(#shieldGradient)" strokeWidth="2" fill="none" />
      <circle cx="70" cy="30" r="2.5" fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth="1"/>
      <circle cx="80" cy="45" r="2.5" fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth="1"/>
      <circle cx="60" cy="55" r="2.5" fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth="1"/>
      <circle cx="80" cy="70" r="2.5" fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth="1"/>

      {/* Central dividing line / lock element */}
      <path
        d="M50 25 V 75 M 42 50 H 58 M 50 50 V 60"
        stroke="hsl(var(--primary) / 0.7)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
       <path
        d="M 42 45 a 8 8 0 1 1 16 0 V 50"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  );
}
