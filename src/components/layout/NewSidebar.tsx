"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import {
  ChevronDown,
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  TrendingUp,
  Plus,
  FileText,
  Settings,
  LogOut,
  Shirt,
  Library as LibraryIcon,
  ClipboardList,
  UsersRound,
  FolderOpen,
} from "lucide-react";

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
  }[];
}

const navigation: NavSection[] = [
  {
    title: "Team Workspace",
    icon: ClipboardList,
    items: [
      { name: "Plans", href: "/planning", icon: ClipboardList },
      { name: "Documents", href: "/planning/documents", icon: FolderOpen },
      { name: "Team Members", href: "/planning/team", icon: UsersRound },
    ],
  },
  {
    title: "SelfDiscovery Wear",
    icon: Shirt,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Product Costing & Pricing", href: "/product-costing", icon: DollarSign },
      { name: "Sales Record", href: "/sales", icon: ShoppingCart },
      { name: "Expenses Tracker", href: "/expenses", icon: Receipt },
      { name: "Inventory Tracker", href: "/inventory", icon: Package },
      { name: "Profit & Loss", href: "/profit-loss", icon: TrendingUp },
    ],
  },
  {
    title: "SelfDiscovery Library",
    icon: LibraryIcon,
    items: [
      { name: "Library Dashboard", href: "/library/dashboard", icon: LayoutDashboard },
      { name: "Add Books", href: "/library/books", icon: Plus },
      { name: "Inventory", href: "/library/inventory", icon: Package },
      { name: "Expenses", href: "/library/expenses", icon: Receipt },
      { name: "Reports", href: "/library/reports", icon: FileText },
    ],
  },
];

interface NewSidebarProps {
  onNavigate?: () => void;
}

export function NewSidebar({ onNavigate }: NewSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Team Workspace",
    "SelfDiscovery Wear",
    "SelfDiscovery Library",
  ]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-r border-black/[0.06] bg-white shadow-xl lg:shadow-none">
      <div className="flex h-[60px] items-center px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#1d1d1f] shadow-sm">
            <div className="h-3.5 w-3.5 rounded-[3px] bg-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold leading-none tracking-tight text-[#1d1d1f]">
              {BRAND_NAME}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-[#86868b]">{BRAND_TAGLINE}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navigation.map((section) => {
          const isOpen = expandedSections.includes(section.title);
          const SectionIcon = section.icon;
          const hasActiveItem = section.items.some((item) => pathname.startsWith(item.href));

          return (
            <div key={section.title} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors",
                  hasActiveItem ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <SectionIcon className="h-4 w-4 stroke-[1.75]" />
                  {section.title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-[#86868b] transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "space-y-0.5 overflow-hidden transition-all duration-200 ease-out",
                  isOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg py-2 pl-9 pr-2.5 text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-[#0071e3]/[0.08] text-[#0071e3]"
                          : "text-[#424245] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-3 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#0071e3]" />
                      )}
                      <ItemIcon
                        className={cn(
                          "h-[15px] w-[15px] stroke-[1.75]",
                          isActive ? "text-[#0071e3]" : "text-[#86868b] group-hover:text-[#1d1d1f]"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-black/[0.06] p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[#0071e3]/[0.08] text-[#0071e3]"
              : "text-[#424245] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
          )}
        >
          <Settings className="h-[15px] w-[15px] stroke-[1.75]" />
          Settings
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#424245] transition-colors hover:bg-black/[0.04] hover:text-[#1d1d1f]"
          >
            <LogOut className="h-[15px] w-[15px] stroke-[1.75]" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
