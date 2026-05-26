"use client";

import { Menu } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="glass-bar sticky top-0 z-30 flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#424245] transition hover:bg-black/[0.05] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationsDropdown />
        <div className="mx-1 hidden h-6 w-px bg-black/[0.08] sm:block" />
        <UserProfileDropdown />
      </div>
    </header>
  );
}
