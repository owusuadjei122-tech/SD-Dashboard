import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-[10px] border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-[14px] text-[#1d1d1f] outline-none transition",
        "focus:border-[#0071e3]/50 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
