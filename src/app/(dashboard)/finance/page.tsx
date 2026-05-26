"use client";

import { Download, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, CreditCard } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance & Analytics</h1>
          <p className="text-muted-foreground mt-1">Monitor your financial health and business metrics.</p>
        </div>
        <button className="bg-secondary text-foreground border border-border px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Net Revenue", value: "$424,500.00", change: "+14.5%", trend: "up", icon: DollarSign },
          { title: "Operating Expenses", value: "$112,400.00", change: "-2.4%", trend: "down", icon: Wallet },
          { title: "Net Profit", value: "$312,100.00", change: "+22.4%", trend: "up", icon: CreditCard },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="flex items-center gap-1 text-sm">
              <span className={`font-medium flex items-center ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {stat.change}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-xl border border-border bg-card flex flex-col min-h-[400px]">
          <h2 className="font-semibold text-lg mb-4">Cash Flow Overview</h2>
          <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg bg-secondary/20">
            <span className="text-muted-foreground text-sm">Chart Placeholder</span>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Recent Transactions</h2>
            <button className="text-sm text-muted-foreground hover:text-foreground">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { desc: "Stripe Payout", category: "Income", amount: "+$12,450.00", date: "Today, 9:00 AM", type: "income" },
              { desc: "AWS Hosting", category: "Infrastructure", amount: "-$450.00", date: "Yesterday", type: "expense" },
              { desc: "Marketing Agency", category: "Marketing", amount: "-$2,400.00", date: "Oct 24", type: "expense" },
              { desc: "Book Sales Royalties", category: "Income", amount: "+$3,200.00", date: "Oct 22", type: "income" },
            ].map((tx, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{tx.desc}</div>
                    <div className="text-xs text-muted-foreground">{tx.category} • {tx.date}</div>
                  </div>
                </div>
                <div className={`font-semibold ${tx.type === 'income' ? 'text-green-500' : ''}`}>
                  {tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
