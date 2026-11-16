import * as React from "react";
import { cn } from "@/lib/utils";

export const Badge = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md border border-rule px-2 py-0.5",
      "font-mono text-[11px] uppercase tracking-wider text-ink-soft",
      className
    )}
    {...props}
  />
);
