import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { trackActivity } from "@/lib/actions/user";
import { recordSecurityEvent } from "@/lib/security/events";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Track logout activity
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await trackActivity({
      activity_type: "logout",
      description: "User signed out",
    });

    if (user) {
      await recordSecurityEvent({ userId: user.id, type: "logout", request });
    }
  } catch {
    // Non-blocking if activity tracking fails
  }

  // Sign out
  await supabase.auth.signOut();

  // Redirect to login using the request origin (avoids wrong localhost port)
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin || "http://localhost:3000";
  return NextResponse.redirect(new URL("/login", origin));
}
