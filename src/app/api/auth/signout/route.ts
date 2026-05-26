import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { trackActivity } from "@/lib/actions/user";

export async function POST() {
  const supabase = await createClient();

  // Track logout activity
  await trackActivity({
    activity_type: "logout",
    description: "User signed out",
  });

  // Sign out
  await supabase.auth.signOut();

  // Redirect to login
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3003"));
}
