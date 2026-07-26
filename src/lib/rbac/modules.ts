import type { ModuleId } from "./types";

/** Map URL prefixes to platform modules for access control. */
export const MODULE_ROUTE_PREFIXES: { module: ModuleId; prefixes: string[] }[] = [
  {
    module: "workspace",
    prefixes: ["/planning", "/workspace", "/projects"],
  },
  {
    module: "wear",
    prefixes: [
      "/dashboard",
      "/product-costing",
      "/sales",
      "/expenses",
      "/inventory",
      "/profit-loss",
      "/wear",
    ],
  },
  {
    module: "library",
    prefixes: ["/library"],
  },
];

export const SECTION_MODULE_MAP: Record<string, ModuleId> = {
  "Team Workspace": "workspace",
  "SelfDiscovery Wear": "wear",
  "SelfDiscovery Library": "library",
};

export function moduleForPath(pathname: string): ModuleId | null {
  for (const entry of MODULE_ROUTE_PREFIXES) {
    if (entry.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return entry.module;
    }
  }
  return null;
}

export function isProtectedAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/product-costing") ||
    pathname.startsWith("/sales") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/profit-loss") ||
    pathname.startsWith("/planning") ||
    pathname.startsWith("/wear") ||
    pathname.startsWith("/library") ||
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/content") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin")
  );
}

export function isOnboardingPath(pathname: string): boolean {
  return (
    pathname.startsWith("/pending-approval") ||
    pathname.startsWith("/access-denied") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/no-modules") ||
    pathname.startsWith("/admin-setup")
  );
}

export function isAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password")
  );
}

/** Default home route for a set of allowed modules. */
export function homePathForModules(modules: ModuleId[]): string {
  if (modules.includes("wear")) return "/dashboard";
  if (modules.includes("workspace")) return "/planning";
  if (modules.includes("library")) return "/library/dashboard";
  return "/no-modules";
}
