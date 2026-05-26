"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  module: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// Get current user profile
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to get profile from database
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // If table doesn't exist or profile not found, return a default profile
    console.error("Error fetching user profile:", error);
    return {
      id: user.id,
      email: user.email || "",
      first_name: user.user_metadata?.first_name || null,
      last_name: user.user_metadata?.last_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      role: "user",
      preferences: {},
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

// Update user profile
export async function updateUserProfile(updates: {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) throw error;

  // Track activity
  await trackActivity({
    activity_type: "update",
    module: "settings",
    description: "Updated profile settings",
  });

  revalidatePath("/settings");
  return { success: true };
}

// Track user activity
export async function trackActivity(activity: {
  activity_type: "login" | "logout" | "page_view" | "create" | "update" | "delete" | "search";
  module?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_activities")
      .insert({
        user_id: user.id,
        ...activity,
      });

    if (error) {
      console.error("Error tracking activity:", error);
    }
  } catch (error) {
    // Silently fail if table doesn't exist
    console.error("Error tracking activity:", error);
  }
}

// Get user activities
export async function getUserActivities(limit = 50): Promise<UserActivity[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching activities:", error);
    return [];
  }

  return data || [];
}

// Get activity stats
export async function getActivityStats() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_activities")
    .select("activity_type, module, created_at")
    .eq("user_id", user.id);

  if (error) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayActivities = data?.filter(a => a.created_at.startsWith(today)).length || 0;

  const moduleStats = data?.reduce((acc: Record<string, number>, activity) => {
    if (activity.module) {
      acc[activity.module] = (acc[activity.module] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  return {
    totalActivities: data?.length || 0,
    todayActivities,
    moduleStats,
    lastActivity: data?.[0]?.created_at || null,
  };
}

// Sign out
export async function signOut() {
  const supabase = await createClient();
  
  // Track logout activity
  await trackActivity({
    activity_type: "logout",
    description: "User signed out",
  });

  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  return { success: true };
}

// Upload avatar (returns URL for storage)
export async function uploadAvatar(file: File) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  await updateUserProfile({ avatar_url: data.publicUrl });

  return { url: data.publicUrl };
}
