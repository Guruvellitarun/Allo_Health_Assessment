import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto">
    <table
      className={cn("w-full text-left text-sm", className)}
      {...props}
    />
  </div>
);

export const TableHead = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("text-[var(--muted)]", className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={className} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn("border-b border-[var(--line)] last:border-none", className)}
    {...props}
  />
);

export const TableHeaderCell = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("py-2 font-medium", className)} {...props} />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("py-2", className)} {...props} />
);
