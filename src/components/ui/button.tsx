import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "press" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "press", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-press/50",
        "disabled:cursor-not-allowed disabled:opacity-45",
        variant === "press" && "bg-press text-paper-raised hover:bg-press-deep",
        variant === "outline" &&
          "border border-rule-strong bg-paper-raised text-ink hover:bg-paper-sunk",
        variant === "ghost" && "text-ink-soft hover:bg-paper-sunk hover:text-ink",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
