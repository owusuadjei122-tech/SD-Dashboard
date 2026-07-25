export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type AuthProvider = "email" | "google" | "invitation";

export type ModuleId = "workspace" | "wear" | "library";

export type RbacRoleId =
  | "super_admin"
  | "admin"
  | "manager"
  | "team_member"
  | "viewer"
  | "guest";

export const ALL_MODULES: ModuleId[] = ["workspace", "wear", "library"];

export const MODULE_LABELS: Record<ModuleId, string> = {
  workspace: "Team Workspace",
  wear: "SelfDiscovery Wear",
  library: "SelfDiscovery Library",
};

export const MODULE_DESCRIPTIONS: Record<ModuleId, string> = {
  workspace: "Plans, documents, and team collaboration",
  wear: "Products, sales, inventory, and finance",
  library: "Books, inventory, and library reporting",
};

export const MODULE_ROLES: Array<{ id: RbacRoleId; name: string; description: string }> = [
  { id: "manager", name: "Manager", description: "Full control of the module" },
  { id: "team_member", name: "Team Member", description: "Create and edit content" },
  { id: "viewer", name: "Viewer", description: "Read-only access" },
  { id: "guest", name: "Guest", description: "Limited, invited access" },
];

export const PLATFORM_ROLES: Array<{ id: "admin" | "manager" | "user"; name: string }> = [
  { id: "admin", name: "Administrator" },
  { id: "manager", name: "Manager" },
  { id: "user", name: "Member" },
];

export interface AccessProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  google_avatar_url: string | null;
  avatar_source_preference: "google" | "platform";
  role: string;
  approval_status: ApprovalStatus;
  auth_provider: AuthProvider;
  department: string | null;
  last_login_at: string | null;
  created_at: string;
  rejection_reason: string | null;
  mfa_enabled: boolean;
  notify_on_new_login: boolean;
  modules: ModuleId[];
  isAdmin: boolean;
}

export function displayName(profile: Pick<AccessProfile, "first_name" | "last_name" | "email">) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || profile.email;
}

export function resolveAvatar(profile: Pick<
  AccessProfile,
  "avatar_url" | "google_avatar_url" | "avatar_source_preference"
>) {
  if (profile.avatar_source_preference === "google" && profile.google_avatar_url) {
    return profile.google_avatar_url;
  }
  return profile.avatar_url || profile.google_avatar_url || null;
}
