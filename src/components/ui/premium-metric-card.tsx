import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accent?: "blue" | "orange" | "purple" | "green";
  /** @deprecated Use accent instead */
  gradient?: "primary" | "accent" | "success" | "warm";
  className?: string;
}

const gradientToAccent = {
  primary: "blue",
  accent: "purple",
  success: "green",
  warm: "orange",
} as const;

const accentStyles = {
  blue: {
    icon: "bg-[#0071e3]/10 text-[#0071e3]",
    dot: "bg-[#0071e3]",
  },
  orange: {
    icon: "bg-[#ff9500]/10 text-[#ff9500]",
    dot: "bg-[#ff9500]",
  },
  purple: {
    icon: "bg-[#5856d6]/10 text-[#5856d6]",
    dot: "bg-[#5856d6]",
  },
  green: {
    icon: "bg-[#34c759]/10 text-[#34c759]",
    dot: "bg-[#34c759]",
  },
};

export function PremiumMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  accent: accentProp,
  gradient,
  className,
}: PremiumMetricCardProps) {
  const accent =
    accentProp ?? (gradient ? gradientToAccent[gradient] : "blue");
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "group surface-panel p-5 transition-all duration-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-label mb-2">{title}</p>
          <p className="text-[28px] font-semibold leading-none tracking-tight text-[#1d1d1f] tabular-nums">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                "mt-3 flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-[#34c759]" : "text-[#ff3b30]"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="font-normal text-[#86868b]">vs last period</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-[1.02]",
            styles.icon
          )}
        >
          <Icon className="h-5 w-5 stroke-[1.75]" />
        </div>
      </div>
      <div className={cn("mt-4 h-[3px] w-8 rounded-full opacity-80", styles.dot)} />
    </div>
  );
}
