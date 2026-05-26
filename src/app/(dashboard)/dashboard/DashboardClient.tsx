"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  Receipt,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { PremiumMetricCard } from "@/components/ui/premium-metric-card";
import type { DashboardMetrics } from "@/types/business";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatChartDate, formatNumber, getUserLocale } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  metrics: DashboardMetrics;
  salesChartData: Array<{ date: string; revenue: number }>;
}

const CHART = {
  blue: "#0071e3",
  orange: "#ff9500",
  green: "#34c759",
  purple: "#5856d6",
  red: "#ff3b30",
  grid: "rgba(0,0,0,0.06)",
  axis: "#86868b",
};

const INVENTORY_COLORS = [CHART.green, CHART.orange, CHART.red];

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.96)",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
  padding: "10px 14px",
  fontSize: "13px",
};

function ChartPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-panel flex flex-col overflow-hidden", className)}>
      <div className="border-b border-black/[0.04] px-6 py-5">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-[13px] text-[#86868b]">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-xl bg-[#f5f5f7]">
      <BarChart3 className="mb-3 h-8 w-8 text-[#c7c7cc]" strokeWidth={1.5} />
      <p className="text-[13px] font-medium text-[#86868b]">{message}</p>
      <p className="mt-1 text-[12px] text-[#aeaeb2]">Data will appear as you add records</p>
    </div>
  );
}

export function DashboardClient({ metrics, salesChartData }: DashboardClientProps) {
  const [locale, setLocale] = useState(getUserLocale);

  useEffect(() => {
    const onLocaleChange = () => setLocale(getUserLocale());
    window.addEventListener("sd-locale-change", onLocaleChange);
    return () => window.removeEventListener("sd-locale-change", onLocaleChange);
  }, []);

  const inventoryData = useMemo(
    () => [
      {
        name: "In Stock",
        value: metrics.totalProducts - metrics.lowStockItems - metrics.outOfStockItems,
      },
      { name: "Low Stock", value: metrics.lowStockItems },
      { name: "Out of Stock", value: metrics.outOfStockItems },
    ],
    [metrics]
  );

  const profitData = useMemo(
    () => [
      { name: "Revenue", value: metrics.totalRevenue, fill: CHART.blue },
      { name: "Expenses", value: metrics.totalExpenses, fill: CHART.orange },
    ],
    [metrics]
  );

  const formattedChartData = useMemo(
    () =>
      salesChartData.map((d) => ({
        ...d,
        label: formatChartDate(d.date),
      })),
    [salesChartData]
  );

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [locale]
  );

  const hasSalesData = formattedChartData.some((d) => d.revenue > 0);
  const hasInventoryData = inventoryData.some((d) => d.value > 0);

  const currencyTooltip = (value: number | string) => [
    formatCurrency(Number(value)),
    "",
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page header — compact, editorial */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-label mb-2">Wear · Overview</p>
          <h1 className="text-[32px] font-semibold leading-[1.1] tracking-tight text-[#1d1d1f] sm:text-[36px]">
            Dashboard
          </h1>
          <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[#86868b]">
            Real-time performance across sales, expenses, and inventory.
          </p>
        </div>
        <div className="surface-subtle flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0071e3]/10">
            <BarChart3 className="h-4 w-4 text-[#0071e3]" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868b]">Today</p>
            <p className="text-[13px] font-semibold text-[#1d1d1f]">{todayLabel}</p>
          </div>
        </div>
      </header>

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          accent="green"
        />
        <PremiumMetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          icon={Receipt}
          accent="orange"
        />
        <PremiumMetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          icon={TrendingUp}
          accent="blue"
        />
        <PremiumMetricCard
          title="Total Products"
          value={formatNumber(metrics.totalProducts)}
          icon={Package}
          accent="purple"
        />
      </section>

      {/* Charts */}
      <section className="grid gap-5 lg:grid-cols-2">
        <ChartPanel title="Sales trend" description="Last 30 days">
          {hasSalesData ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={formattedChartData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fill: CHART.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, { compact: true })}
                  width={56}
                />
                <Tooltip
                  formatter={currencyTooltip}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date
                      ? formatChartDate(payload[0].payload.date)
                      : ""
                  }
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART.blue}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART.blue, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No sales data yet" />
          )}
        </ChartPanel>

        <ChartPanel title="Revenue vs expenses" description="Current period totals">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitData} barCategoryGap="28%">
              <CartesianGrid stroke={CHART.grid} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: CHART.axis, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: CHART.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, { compact: true })}
                width={56}
              />
              <Tooltip formatter={currencyTooltip} contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Inventory status" description="Stock distribution">
          {hasInventoryData ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {inventoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={INVENTORY_COLORS[index % INVENTORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatNumber(Number(value))}
                  contentStyle={tooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="No inventory data yet" />
          )}
          {hasInventoryData && (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {inventoryData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-[12px] text-[#424245]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: INVENTORY_COLORS[i] }}
                  />
                  {item.name} · {formatNumber(item.value)}
                </div>
              ))}
            </div>
          )}
        </ChartPanel>

        <ChartPanel title="Quick stats" description="Operational snapshot">
          <div className="space-y-3">
            {[
              {
                label: "Total sales",
                value: formatNumber(metrics.totalSales),
                icon: ShoppingCart,
                color: "text-[#0071e3]",
                bg: "bg-[#0071e3]/8",
              },
              {
                label: "Low stock items",
                value: formatNumber(metrics.lowStockItems),
                icon: AlertTriangle,
                color: "text-[#ff9500]",
                bg: "bg-[#ff9500]/8",
              },
              {
                label: "Out of stock",
                value: formatNumber(metrics.outOfStockItems),
                icon: Package,
                color: "text-[#ff3b30]",
                bg: "bg-[#ff3b30]/8",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-xl border border-black/[0.04] bg-[#f5f5f7]/80 px-4 py-3.5 transition-colors hover:bg-[#f5f5f7]"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-[10px]", stat.bg)}>
                    <stat.icon className={cn("h-[18px] w-[18px] stroke-[1.75]", stat.color)} />
                  </div>
                  <span className="text-[14px] font-medium text-[#1d1d1f]">{stat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-semibold tabular-nums tracking-tight text-[#1d1d1f]">
                    {stat.value}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-[#c7c7cc]" strokeWidth={1.75} />
                </div>
              </div>
            ))}
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}
