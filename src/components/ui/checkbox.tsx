"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, id, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        id={id}
        className={cn(
          // Force square dimensions with aspect-ratio as backup
          "peer shrink-0 rounded border-2 transition-all duration-150",
          "h-[18px] w-[18px] min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]",
          "flex items-center justify-center",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-primary bg-primary text-white"
            : "border-muted-foreground/50 bg-transparent hover:border-primary/50",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {checked && (
          <Check className="h-3 w-3" strokeWidth={3} />
        )}
        <input
          type="checkbox"
          ref={ref}
          checked={checked ?? false}
          onChange={() => onCheckedChange?.(!checked)}
          className="sr-only"
          {...props}
        />
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
