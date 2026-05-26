import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b]",
        "outline-none transition focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
