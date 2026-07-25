"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BOOTSTRAP_ADMIN_EMAIL = "theolencer@gmail.com";

/**
 * One-time bootstrap: promotes the designated admin email if no admin exists yet,
 * or always ensures that email is admin + approved + has all modules.
 * Safe to call repeatedly.
 */
export async function bootstrapAdminAccount(): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: "Sign in first, then run setup again." };
  }

  if (user.email.toLowerCase() !== BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: `Signed in as ${user.email}. Sign in as ${BOOTSTRAP_ADMIN_EMAIL} to complete admin setup.`,
    };
  }

  // Promote self (allowed by "Users can update own profile" RLS)
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({
      id: user.id,
      email: user.email,
      role: "admin",
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      auth_provider: user.app_metadata?.provider === "google" ? "google" : "email",
      rejection_reason: null,
      first_name: user.user_metadata?.first_name ?? null,
      last_name: user.user_metadata?.last_name ?? null,
    });

  if (profileError) {
    const recursion = profileError.message?.includes("infinite recursion");
    return {
      success: false,
      message: recursion
        ? "Database policies need a fix. Run supabase/migrations/00000000000004_fix_rls_recursion.sql in the Supabase SQL Editor, then try again."
        : `Could not update profile: ${profileError.message}. Run supabase/seed/01_bootstrap_admin.sql in Supabase instead.`,
    };
  }

  const modules = ["workspace", "wear", "library"] as const;
  await supabase.from("user_module_access").delete().eq("user_id", user.id);
  const { error: moduleError } = await supabase.from("user_module_access").insert(
    modules.map((moduleId) => ({
      user_id: user.id,
      module_id: moduleId,
      role_id: "super_admin",
      granted_by: user.id,
    }))
  );

  if (moduleError) {
    return {
      success: false,
      message: `Profile updated, but module grants failed: ${moduleError.message}. Run the seed SQL for modules.`,
    };
  }

  try {
    await supabase.from("auth_providers").upsert(
      {
        user_id: user.id,
        provider: user.app_metadata?.provider === "google" ? "google" : "email",
        email: user.email,
      },
      { onConflict: "user_id,provider" }
    );
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      target_user_id: user.id,
      action: "bootstrap.admin",
      resource_type: "user_profiles",
      metadata: { email: user.email },
    });
  } catch {
    // optional tables
  }

  revalidatePath("/admin/members");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Admin setup complete. You can manage members at /admin/members.",
  };
}
