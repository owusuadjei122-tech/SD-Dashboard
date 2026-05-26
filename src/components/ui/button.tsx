import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-[#0071e3] text-white shadow-sm hover:bg-[#0077ed] active:scale-[0.98]": variant === "default",
          "border border-black/[0.1] bg-white text-[#1d1d1f] hover:bg-black/[0.03]": variant === "outline",
          "text-[#424245] hover:bg-black/[0.05]": variant === "ghost",
          "bg-[#ff3b30] text-white hover:bg-[#ff453a]": variant === "destructive",
        },
        {
          "h-10 px-4 text-[14px]": size === "default",
          "h-8 px-3 text-[13px]": size === "sm",
          "h-11 px-6 text-[15px]": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
