const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const LOCALE_STORAGE_KEY = "sd-display-locale";

export const SUPPORTED_LOCALES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "fr-FR", label: "Français" },
  { value: "de-DE", label: "Deutsch" },
  { value: "es-ES", label: "Español" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "ja-JP", label: "日本語" },
  { value: "zh-CN", label: "中文 (简体)" },
  { value: "ar-SA", label: "العربية" },
  { value: "hi-IN", label: "हिन्दी" },
] as const;

let cachedLocale: string | null = null;

export function setDisplayLocale(locale: string): void {
  cachedLocale = locale;
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent("sd-locale-change", { detail: locale }));
  }
}

export function getStoredLocale(): string | null {
  if (cachedLocale) return cachedLocale;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      cachedLocale = stored;
      return stored;
    }
  }
  return null;
}

export function initDisplayLocaleFromPreferences(preferences?: Record<string, unknown>): void {
  const prefLocale =
    preferences && typeof preferences.locale === "string" ? preferences.locale : null;
  if (prefLocale) {
    setDisplayLocale(prefLocale);
  }
}

export function getUserLocale(): string {
  return getStoredLocale() ?? (typeof navigator !== "undefined" ? navigator.language : DEFAULT_LOCALE);
}

export function formatCurrency(
  value: number,
  options?: { locale?: string; currency?: string; compact?: boolean }
): string {
  const locale = options?.locale ?? getUserLocale();
  const currency = options?.currency ?? DEFAULT_CURRENCY;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: options?.compact ? "compact" : "standard",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale ?? getUserLocale()).format(value);
}

export function formatDate(
  value: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(getUserLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatChartDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getUserLocale(), {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat(getUserLocale(), {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}
