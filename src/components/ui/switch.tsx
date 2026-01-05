"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, disabled, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          // Base styles - standard toggle switch appearance
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full",
          // Size: iOS-style proportions - explicit pixel constraints to prevent mobile stretching
          "h-[24px] w-[44px] min-h-[24px] max-h-[24px] min-w-[44px] max-w-[44px]",
          // Padding for thumb
          "p-[2px]",
          // Visual styles
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // State colors
          checked
            ? "bg-primary"
            : "bg-muted dark:bg-muted/60",
          className
        )}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out",
            // Thumb size: 20px (track height 24px minus 4px padding)
            "h-5 w-5",
            // Position based on state (track width 44px - thumb 20px - padding 4px = 20px travel)
            checked
              ? "translate-x-5"
              : "translate-x-0"
          )}
        />
        <input
          type="checkbox"
          ref={ref}
          checked={checked ?? false}
          onChange={() => !disabled && onCheckedChange?.(!checked)}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
