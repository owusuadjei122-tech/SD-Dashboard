"use client";

import { DollarSign, TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumMetricCard } from "@/components/ui/premium-metric-card";
import type { ProfitLossMetrics } from "@/types/business";
import { formatCurrency, formatPercent } from "@/lib/format";

interface ProfitLossClientProps {
  metrics: ProfitLossMetrics;
}

export function ProfitLossClient({ metrics }: ProfitLossClientProps) {
  const profitMarginValue =
    metrics.totalRevenue > 0 ? (metrics.netProfit / metrics.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-emerald-50/30 to-indigo-50/40 p-8 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-emerald-950/20 dark:to-indigo-950/20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Profit & Loss Summary
        </h1>
        <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">
          Comprehensive financial overview and performance metrics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumMetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          gradient="success"
        />
        <PremiumMetricCard
          title="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          icon={TrendingDown}
          gradient="warm"
        />
        <PremiumMetricCard
          title="Gross Profit"
          value={formatCurrency(metrics.grossProfit)}
          icon={TrendingUp}
          gradient="primary"
        />
        <PremiumMetricCard
          title="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          icon={TrendingUp}
          gradient="accent"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total Revenue</span>
              </div>
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-medium">Total Expenses</span>
              </div>
              <span className="text-xl font-bold tabular-nums text-red-600">
                {formatCurrency(metrics.totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-emerald-900 dark:text-emerald-100">
                  Net Profit
                </span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-emerald-600">
                {formatCurrency(metrics.netProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900 dark:text-blue-100">Profit Margin</span>
              </div>
              <span className="text-2xl font-bold tabular-nums text-blue-600">
                {formatPercent(profitMarginValue)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="mb-2 flex items-center gap-3">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Best Selling Product</span>
              </div>
              <p className="ml-8 text-2xl font-bold">{metrics.bestSellingProduct}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="mb-2 flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Highest Expense Category</span>
              </div>
              <p className="ml-8 text-2xl font-bold">{metrics.highestExpenseCategory}</p>
            </div>

            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/30">
              <div className="mb-2 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                <span className="font-medium text-violet-900 dark:text-violet-100">
                  Gross Profit
                </span>
              </div>
              <p className="ml-8 text-2xl font-bold tabular-nums text-violet-600">
                {formatCurrency(metrics.grossProfit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-muted-foreground">Metric</span>
              <span className="text-muted-foreground">Value</span>
            </div>

            <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium">Total Revenue</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(metrics.totalRevenue)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium">Total Expenses</span>
              <span className="font-semibold tabular-nums text-red-600">
                −{formatCurrency(metrics.totalExpenses)}
              </span>
            </div>

            <div className="my-2 h-px bg-border" />

            <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium">Gross Profit</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(metrics.grossProfit)}
              </span>
            </div>

            <div className="my-2 h-px bg-border" />

            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <span className="text-lg font-bold">Net Profit</span>
              <span className="text-2xl font-bold tabular-nums text-emerald-600">
                {formatCurrency(metrics.netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
              Automatic Calculations
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              All metrics are calculated automatically from your sales and expenses.
              Gross Profit = Revenue − Expenses. Net Profit = Gross Profit.
              Profit Margin = (Net Profit ÷ Revenue) × 100.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
