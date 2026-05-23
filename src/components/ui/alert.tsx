import * as React from "react";
import { cn } from "@/lib/utils";

export const Alert = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-sm",
      className
    )}
    {...props}
  />
);

export const AlertTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5 className={cn("text-sm font-semibold", className)} {...props} />
);

export const AlertDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-[var(--muted)]", className)} {...props} />
);
