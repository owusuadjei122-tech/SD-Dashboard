"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  TrendingUp,
  Library,
  BookOpen,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  Shirt,
  LogOut,
} from "lucide-react";

interface NavSection {
  title: string;
  icon: any;
  items: {
    name: string;
    href: string;
    icon: any;
  }[];
}

const navigation: NavSection[] = [
  {
    title: "SelfDiscovery Wear",
    icon: Shirt,
    items: [
      { name: "Dashboard", href: "/wear/dashboard", icon: LayoutDashboard },
      { name: "Product Costing", href: "/wear/product-costing", icon: DollarSign },
      { name: "Sales Record", href: "/wear/sales", icon: ShoppingCart },
      { name: "Expenses", href: "/wear/expenses", icon: Receipt },
      { name: "Inventory", href: "/wear/inventory", icon: Package },
      { name: "Profit & Loss", href: "/wear/profit-loss", icon: TrendingUp },
    ],
  },
  {
    title: "SelfDiscovery Library",
    icon: Library,
    items: [
      { name: "Library Dashboard", href: "/library/dashboard", icon: LayoutDashboard },
      { name: "Add Books", href: "/library/books", icon: Plus },
      { name: "Inventory", href: "/library/inventory", icon: Package },
      { name: "Expenses", href: "/library/expenses", icon: Receipt },
      { name: "Reports", href: "/library/reports", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "SelfDiscovery Wear",
    "SelfDiscovery Library",
  ]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <div className="flex flex-col w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl">
      {/* Logo */}
      <div className="flex h-20 items-center px-6 border-b border-white/10">
        <Link href="/wear/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300">
            <div className="w-5 h-5 bg-white rounded-md" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">SelfDiscovery</h1>
            <p className="text-xs text-slate-400">Business Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-2">
          {navigation.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const SectionIcon = section.icon;

            return (
              <div key={section.title} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                  )}
                </button>

                {/* Section Items */}
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const ItemIcon = item.icon;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 ml-8 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <ItemIcon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mt-4",
              pathname === "/settings"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
