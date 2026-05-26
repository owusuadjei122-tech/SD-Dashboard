"use client";

import { useState, useEffect, useRef } from "react";
import { User, Settings, Bell, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getUserProfile, type UserProfile } from "@/lib/actions/user";

export function UserProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserProfile().then(setProfile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const getInitials = () => {
    if (!profile) return "U";
    const first = profile.first_name || "";
    const last = profile.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (!profile) return "User";
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email.split("@")[0];
  };

  const handleSignOut = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors",
          isOpen ? "bg-black/[0.05]" : "hover:bg-black/[0.04]"
        )}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-black/[0.08]"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d1d1f] text-[12px] font-semibold text-white">
            {getInitials()}
          </div>
        )}
        <div className="hidden text-left sm:block">
          <p className="text-[13px] font-semibold leading-none text-[#1d1d1f]">{getDisplayName()}</p>
          <p className="mt-0.5 text-[11px] capitalize text-[#86868b]">{profile?.role || "User"}</p>
        </div>
        <ChevronDown
          className={cn(
            "hidden h-3.5 w-3.5 text-[#86868b] transition-transform sm:block",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />
          <div className="absolute right-0 z-50 mt-2 w-64 animate-fade-in">
            <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
              <div className="border-b border-black/[0.06] px-4 py-4">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-black/[0.08]"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">
                      {getInitials()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#1d1d1f]">
                      {getDisplayName()}
                    </p>
                    <p className="truncate text-[12px] text-[#86868b]">{profile?.email}</p>
                  </div>
                </div>
              </div>

              <div className="py-1.5">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#424245] transition-colors hover:bg-black/[0.03]"
                >
                  <User className="h-4 w-4" strokeWidth={1.75} />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#424245] transition-colors hover:bg-black/[0.03]"
                >
                  <Settings className="h-4 w-4" strokeWidth={1.75} />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-[#424245] transition-colors hover:bg-black/[0.03]"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.75} />
                  Notifications
                </button>
              </div>

              <div className="border-t border-black/[0.06] py-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-[#ff3b30] transition-colors hover:bg-[#ff3b30]/5"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
