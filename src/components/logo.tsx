import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("text-primary", className)}
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Shield Outline */}
      <path 
        d="M50 5 C 85 15, 95 45, 95 60 C 95 85, 50 95, 50 95 C 50 95, 5 85, 5 60 C 5 45, 15 15, 50 5 Z"
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
      />
      
      {/* Abstract Lock Body */}
      <path 
        d="M35 50 V 75 H 65 V 50 A 15 15 0 0 0 35 50 Z"
        fill="none"
        stroke="url(#logo-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
       {/* Lock Keyhole */}
      <circle cx="50" cy="62" r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="1.5" />

      {/* Lock Shackle */}
      <path 
        d="M40 50 V 40 C 40 32, 60 32, 60 40 V 50"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Abstract Circuit/Data Lines */}
      <g stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M35 55 H 20" />
        <path d="M65 55 H 80" />
        <path d="M35 65 H 25" />
        <path d="M65 65 H 75" />
        
        {/* Radiating lines from top */}
        <path d="M50 15 L 40 30" />
        <path d="M50 15 L 60 30" />
        <path d="M50 15 L 50 25" />
      </g>

       {/* Corner Dots */}
      <circle cx="20" cy="30" r="2" fill="hsl(var(--primary))" />
      <circle cx="80" cy="30" r="2" fill="hsl(var(--primary))" />
      <circle cx="25" cy="80" r="2" fill="hsl(var(--accent))" />
      <circle cx="75" cy="80" r="2" fill="hsl(var(--accent))" />

    </svg>
  );
}
