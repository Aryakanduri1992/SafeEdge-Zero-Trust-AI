import { cn } from "@/lib/utils";

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 120"
      className={cn("text-primary", className)}
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Shield */}
      <path
        d="M80 10C80 10 130 20 130 55C130 90 80 110 80 110C80 110 30 90 30 55C30 20 80 10 80 10Z"
        stroke="hsl(var(--primary))"
        strokeWidth="4"
        fill="hsl(var(--background))"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Brain - Left Side (Detailed) */}
      <g stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M80 40V85" />
        <path d="M72 45C68 45 65 48 65 52C65 58 70 60 70 65C70 70 65 72 65 78" />
        <path d="M65 60C62 60 60 62 60 65C60 68 62 70 65 70" />
        <path d="M75 50C78 50 80 48 80 45" />
        <path d="M75 80C78 80 80 82 80 85" />
      </g>

      {/* Brain - Right Side (Circuit) */}
      <g fill="hsl(var(--primary))">
        <circle cx="88" cy="55" r="4" />
        <circle cx="88" cy="70" r="4" />
        <circle cx="80" cy="40" r="2.5" />
        <circle cx="80" cy="85" r="2.5" />
        <path d="M80 40H95" stroke="hsl(var(--primary))" strokeWidth="2" />
        <path d="M88 55H105" stroke="hsl(var(--primary))" strokeWidth="2" />
        <path d="M88 70H105" stroke="hsl(var(--primary))" strokeWidth="2" />
      </g>
      
      {/* Lock */}
      <g transform="translate(105 62)">
        <rect x="0" y="2" width="14" height="10" rx="2" stroke="hsl(var(--primary))" fill="hsl(var(--background))" strokeWidth="2" />
        <path d="M7 2V-2C7 -5 3 -5 3 -2V2" stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="7" cy="7" r="1" fill="hsl(var(--primary))"/>
      </g>

      {/* Globe */}
      <g transform="translate(108 30)">
        <circle cx="0" cy="0" r="8" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
        <path d="M-8 0H8" stroke="hsl(var(--primary))" strokeWidth="2" />
        <path d="M-5 -6C-2 -4 2 -4 5 -6" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
        <path d="M-5 6C-2 4 2 4 5 6" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
      </g>

      {/* Wifi Signal */}
      <g transform="translate(45 75)" stroke="hsl(var(--primary))" fill="none" strokeWidth="2.5" strokeLinecap="round">
         <path d="M-10 -5C-5 -10 5 -10 10 -5" />
         <path d="M-6 -1C-3 -4 3 -4 6 -1" />
         <circle cx="0" cy="3" r="1.5" fill="hsl(var(--primary))" stroke="none" />
      </g>
    </svg>
  );
}
