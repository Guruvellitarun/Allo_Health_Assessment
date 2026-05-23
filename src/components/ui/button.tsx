import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]",
  outline: "border border-[var(--line)] text-[var(--ink)] hover:bg-white",
  ghost: "text-[var(--ink)] hover:bg-white/60",
  destructive: "bg-[#b42318] text-white hover:bg-[#7a1b12]",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3",
  md: "h-9 px-4",
  lg: "h-10 px-5",
};

export const Button = ({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) => (
  <button
    className={cn(base, variants[variant], sizes[size], className)}
    {...props}
  />
);
