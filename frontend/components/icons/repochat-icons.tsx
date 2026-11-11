import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type RepoChatIconProps = SVGProps<SVGSVGElement> & {
  variant?: "color" | "mono";
};

export function RepoChatIcon({
  className,
  variant = "color",
  ...props
}: RepoChatIconProps) {
  const mono = variant === "mono";

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect
        width="64"
        height="64"
        rx="16"
        fill={mono ? "currentColor" : "#0D9488"}
      />
      {/* Chat bubble */}
      <path
        d="M18 24c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6v12c0 3.3-2.7 6-6 6H28l-6 5v-5h-4c-3.3 0-6-2.7-6-6V24z"
        fill={mono ? "var(--background)" : "#FFFFFF"}
      />
      {/* Code brackets inside */}
      <path
        d="M26 28l-4 4 4 4M38 28l4 4-4 4"
        stroke={mono ? "var(--foreground)" : "#0D9488"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RepoChatLogo({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 240 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect width="64" height="64" rx="16" fill="#0D9488" />
      <path
        d="M18 24c0-3.3 2.7-6 6-6h16c3.3 0 6 2.7 6 6v12c0 3.3-2.7 6-6 6H28l-6 5v-5h-4c-3.3 0-6-2.7-6-6V24z"
        fill="#FFFFFF"
      />
      <path
        d="M26 28l-4 4 4 4M38 28l4 4-4 4"
        stroke="#0D9488"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="78"
        y="42"
        fill="currentColor"
        fontSize="28"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        RepoChat
      </text>
    </svg>
  );
}