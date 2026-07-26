import {
  getUserProfile,
  getUserActivities,
  getActivityStats,
  trackActivity,
  type UserActivity,
} from "@/lib/actions/user";
import { SettingsClient } from "./SettingsClient";
import { redirect } from "next/navigation";

const TABS = ["profile", "security", "notifications", "activity"] as const;
type Tab = (typeof TABS)[number];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const initialTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "profile";

  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/login");
  }

  // Get activities and stats, but handle errors gracefully
  let activities: UserActivity[] = [];
  let activityStats: Awaited<ReturnType<typeof getActivityStats>> = null;
  
  try {
    activities = await getUserActivities(50);
  } catch (error) {
    console.error("Error fetching activities:", error);
  }
  
  try {
    activityStats = await getActivityStats();
  } catch (error) {
    console.error("Error fetching activity stats:", error);
  }

  // Track page view
  await trackActivity({
    activity_type: "page_view",
    module: "settings",
    description: "Viewed settings page",
  });

  return (
    <SettingsClient
      profile={profile}
      activities={activities}
      activityStats={activityStats}
      initialTab={initialTab}
    />
  );
}
