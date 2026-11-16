import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full resize-none bg-transparent text-ink placeholder:text-ink-faint",
      "focus:outline-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const UnderlineInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full border-0 border-b-2 border-rule-strong bg-transparent px-0 py-3",
      "font-display text-xl text-ink placeholder:text-ink-faint",
      "focus:border-press focus:outline-none",
      className
    )}
    {...props}
  />
));
UnderlineInput.displayName = "UnderlineInput";
