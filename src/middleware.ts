import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  homePathForModules,
  isAuthPath,
  isOnboardingPath,
  isProtectedAppPath,
  moduleForPath,
} from "@/lib/rbac/modules";
import type { ApprovalStatus, ModuleId } from "@/lib/rbac/types";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  // Unauthenticated users cannot enter protected app or onboarding routes
  if ((isProtectedAppPath(pathname) || isOnboardingPath(pathname)) && !user) {
    return redirectTo("/login");
  }

  // Authenticated users on auth pages → post-auth destination
  if (user && isAuthPath(pathname)) {
    const destination = await resolvePostAuthPath(supabase, user.id);
    return redirectTo(destination);
  }

  // One-time admin bootstrap page — always reachable when signed in
  if (user && pathname.startsWith("/admin-setup")) {
    return supabaseResponse;
  }

  // Authenticated users on protected / onboarding routes need approval checks
  if (user && (isProtectedAppPath(pathname) || isOnboardingPath(pathname))) {
    const access = await loadAccessSnapshot(supabase, user.id);

    if (
      access.approvalStatus === "pending" &&
      !pathname.startsWith("/pending-approval")
    ) {
      return redirectTo("/pending-approval");
    }

    if (
      (access.approvalStatus === "rejected" || access.approvalStatus === "suspended") &&
      !pathname.startsWith("/access-denied")
    ) {
      return redirectTo("/access-denied");
    }

    if (access.approvalStatus === "approved") {
      if (pathname.startsWith("/pending-approval") || pathname.startsWith("/access-denied")) {
        return redirectTo(homePathForModules(access.modules));
      }

      // Only /admin and /admin/* (not /admin-setup)
      if (
        (pathname === "/admin" || pathname.startsWith("/admin/")) &&
        !access.isAdmin
      ) {
        return redirectTo("/unauthorized");
      }

      const requiredModule = moduleForPath(pathname);
      if (
        requiredModule &&
        !access.modules.includes(requiredModule) &&
        !pathname.startsWith("/unauthorized") &&
        !pathname.startsWith("/no-modules")
      ) {
        return redirectTo("/unauthorized");
      }

      if (
        access.modules.length === 0 &&
        !pathname.startsWith("/no-modules") &&
        !pathname.startsWith("/settings") &&
        pathname !== "/admin" &&
        !pathname.startsWith("/admin/")
      ) {
        return redirectTo("/no-modules");
      }
    }
  }

  return supabaseResponse;
}

async function loadAccessSnapshot(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ approvalStatus: ApprovalStatus; modules: ModuleId[]; isAdmin: boolean }> {
  const ALL: ModuleId[] = ["workspace", "wear", "library"];

  try {
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("role, approval_status, modules_configured")
      .eq("id", userId)
      .maybeSingle();

    // Schema not ready — allow full access (pre-migration)
    if (error) {
      return { approvalStatus: "approved", modules: ALL, isAdmin: false };
    }

    const role = profile?.role || "user";
    const isAdmin = role === "admin";
    const approvalStatus = (profile?.approval_status as ApprovalStatus | undefined) || "approved";

    if (isAdmin) {
      return { approvalStatus, modules: ALL, isAdmin: true };
    }

    // Accounts an admin has never configured stay unrestricted so the RBAC
    // rollout cannot lock out anyone who signed up before it.
    if (profile?.modules_configured === false) {
      return { approvalStatus, modules: ALL, isAdmin: false };
    }

    const { data: accessRows, error: accessError } = await supabase
      .from("user_module_access")
      .select("module_id")
      .eq("user_id", userId);

    if (accessError) {
      return { approvalStatus, modules: ALL, isAdmin: false };
    }

    const modules = (accessRows || []).map((r) => r.module_id as ModuleId);

    return { approvalStatus, modules, isAdmin: false };
  } catch {
    return { approvalStatus: "approved", modules: ALL, isAdmin: false };
  }
}

async function resolvePostAuthPath(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<string> {
  const access = await loadAccessSnapshot(supabase, userId);
  switch (access.approvalStatus) {
    case "pending":
      return "/pending-approval";
    case "rejected":
    case "suspended":
      return "/access-denied";
    default:
      return homePathForModules(access.modules);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
