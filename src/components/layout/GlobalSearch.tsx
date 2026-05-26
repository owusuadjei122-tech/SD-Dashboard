"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  Package,
  DollarSign,
  Book,
  Receipt,
  Boxes,
  Command,
} from "lucide-react";
import { globalSearch, type SearchResult } from "@/lib/actions/search";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const typeIcons = {
  product: Package,
  sale: DollarSign,
  expense: Receipt,
  book: Book,
  library_expense: Receipt,
  inventory: Boxes,
};

const typeColors = {
  product: "text-blue-600 bg-blue-50",
  sale: "text-emerald-600 bg-emerald-50",
  expense: "text-orange-600 bg-orange-50",
  book: "text-purple-600 bg-purple-50",
  library_expense: "text-pink-600 bg-pink-50",
  inventory: "text-cyan-600 bg-cyan-50",
};

const typeLabels: Record<SearchResult["type"], string> = {
  product: "Product",
  sale: "Sale",
  expense: "Expense",
  book: "Book",
  library_expense: "Library expense",
  inventory: "Inventory",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const searchDebounce = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) {
        setIsLoading(true);
        setError(null);
        try {
          const searchResults = await globalSearch(trimmed);
          setResults(searchResults);
          setIsOpen(true);
          setActiveIndex(searchResults.length > 0 ? 0 : -1);
        } catch (err) {
          console.error("Search error:", err);
          setResults([]);
          setError("Search failed. Please try again.");
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setError(null);
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }, 280);

    return () => clearTimeout(searchDebounce);
  }, [query]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      router.push(result.url);
      setQuery("");
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [router]
  );

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setError(null);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleResultClick(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#86868b]" strokeWidth={1.75} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          className="h-10 w-full rounded-[10px] border border-black/[0.08] bg-black/[0.04] pl-10 pr-20 text-[14px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition focus:border-[#0071e3]/40 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/15"
        />
        <div className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border border-black/[0.08] bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-[#86868b] sm:flex">
          <Command className="h-3 w-3" />
          K
        </div>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] transition hover:text-[#1d1d1f]"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute top-full z-50 mt-2 max-h-[min(24rem,70vh)] w-full overflow-y-auto rounded-2xl border border-black/[0.08] bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-fade-in"
        >
          {isLoading ? (
            <div className="p-8 text-center text-[#86868b]">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#0071e3] border-t-transparent" />
              <p className="mt-2 text-[13px]">Searching...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-[13px] text-[#ff3b30]">{error}</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-label">
                {results.length} {results.length === 1 ? "result" : "results"}
              </div>
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                const colorClass = typeColors[result.type];
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      isActive ? "bg-[#0071e3]/[0.06]" : "hover:bg-black/[0.03]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        colorClass
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-[#1d1d1f]">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-[12px] text-[#86868b]">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-[#86868b]">
                      {typeLabels[result.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-[#c7c7cc]" strokeWidth={1.5} />
              <p className="text-[14px] font-medium text-[#1d1d1f]">No results found</p>
              <p className="mt-1 text-[12px] text-[#86868b]">Try a product, category, or book title</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
