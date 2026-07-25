import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent } from "@/lib/security/events";

/**
 * OAuth / magic-link / recovery callback.
 * Configure this URL in Supabase Auth redirect allow-list:
 *   http://localhost:3000/auth/callback
 *   https://YOUR_DOMAIN/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const providerError = searchParams.get("error");
  const errorCode = searchParams.get("error_code");

  const failureTarget = next.startsWith("/reset-password")
    ? `/reset-password?error=${errorCode || "link_invalid"}`
    : `/login?error=${errorCode || "auth_callback_failed"}`;

  if (providerError || !code) {
    return NextResponse.redirect(`${origin}${failureTarget}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${failureTarget}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const provider = user.app_metadata?.provider === "google" ? "google" : "email";
    const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
    const parts = fullName.split(" ").filter(Boolean);
    const first_name = parts[0] || user.user_metadata?.first_name || null;
    const last_name = parts.slice(1).join(" ") || user.user_metadata?.last_name || null;

    const { data: existing } = await supabase
      .from("user_profiles")
      .select("id, approval_status")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("user_profiles").insert({
        id: user.id,
        email: user.email,
        first_name,
        last_name,
        role: "user",
        approval_status: "pending",
        auth_provider: provider,
        google_avatar_url: provider === "google" ? avatar : null,
        avatar_source_preference: provider === "google" ? "google" : "platform",
      });
    } else {
      await supabase
        .from("user_profiles")
        .update({
          first_name: first_name || undefined,
          last_name: last_name || undefined,
          auth_provider: provider,
          google_avatar_url: provider === "google" ? avatar : undefined,
          last_login_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    try {
      await supabase.from("auth_providers").upsert(
        {
          user_id: user.id,
          provider,
          provider_user_id: user.id,
          email: user.email,
        },
        { onConflict: "user_id,provider" }
      );
    } catch {
      // optional
    }

    // A recovery link is not a normal sign-in; do not log it as one.
    if (!next.startsWith("/reset-password")) {
      await recordSecurityEvent({
        userId: user.id,
        type: "login",
        request,
        metadata: { provider },
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
