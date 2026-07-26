"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listNotifications, type NotificationItem } from "@/lib/actions/security";

/**
 * Read and dismissed state lives in the browser. The underlying
 * `security_events` table is an append-only audit trail, so per-user read
 * flags there would corrupt it as a security record.
 */
const READ_KEY = "sd.notifications.read";
const DISMISSED_KEY = "sd.notifications.dismissed";

function loadIds(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveIds(key: string, ids: Set<string>) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    // Storage can be unavailable in private mode; read state is expendable
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString();
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(loadIds(READ_KEY));
    setDismissedIds(loadIds(DISMISSED_KEY));

    listNotifications()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
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

  const visible = items.filter((item) => !dismissedIds.has(item.id));
  const unreadCount = visible.filter((item) => !readIds.has(item.id)).length;

  const update = useCallback(
    (key: string, setter: typeof setReadIds, next: Set<string>) => {
      setter(next);
      saveIds(key, next);
    },
    []
  );

  const markAsRead = (id: string) => {
    update(READ_KEY, setReadIds, new Set(readIds).add(id));
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    visible.forEach((item) => next.add(item.id));
    update(READ_KEY, setReadIds, next);
  };

  const dismiss = (id: string) => {
    update(DISMISSED_KEY, setDismissedIds, new Set(dismissedIds).add(id));
  };

  const clearAll = () => {
    const next = new Set(dismissedIds);
    visible.forEach((item) => next.add(item.id));
    update(DISMISSED_KEY, setDismissedIds, next);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className={cn(
          "relative rounded-[10px] p-2 transition-colors",
          isOpen ? "bg-black/[0.05]" : "hover:bg-black/[0.04]"
        )}
      >
        <Bell className="h-[18px] w-[18px] text-[#424245]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-96 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      Recent activity
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {unreadCount} unread
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    {visible.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {visible.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {loaded ? "Nothing new" : "Loading..."}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {visible.map((item) => {
                      const isRead = readIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group",
                            !isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                item.tone === "warning"
                                  ? "bg-amber-500"
                                  : isRead
                                    ? "bg-slate-300 dark:bg-slate-700"
                                    : "bg-blue-500"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 break-words">
                                    {item.message}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                    {relativeTime(item.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!isRead && (
                                    <button
                                      onClick={() => markAsRead(item.id)}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                      title="Mark as read"
                                    >
                                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => dismiss(item.id)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                    title="Dismiss"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
