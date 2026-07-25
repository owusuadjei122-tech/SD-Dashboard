"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Mail, Send, ShieldCheck, Users } from "lucide-react";

const TABS = [
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/invitations", label: "Invitations", icon: Mail },
  { href: "/admin/roles", label: "Roles & Permissions", icon: ShieldCheck },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList },
  { href: "/admin/email", label: "Email", icon: Send },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-black/[0.06] bg-white p-1 shadow-sm">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition ${
              active
                ? "bg-[#1d1d1f] text-white"
                : "text-[#424245] hover:bg-black/[0.04] hover:text-[#1d1d1f]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
