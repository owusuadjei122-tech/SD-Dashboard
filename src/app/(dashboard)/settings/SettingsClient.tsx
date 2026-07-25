"use client";

import { useState, useEffect } from "react";
import { User, Lock, Bell, Palette, Activity, Save, Upload, Trash2, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile, type UserProfile, type UserActivity } from "@/lib/actions/user";
import { SecurityPanel } from "@/components/settings/SecurityPanel";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  SUPPORTED_LOCALES,
  getUserLocale,
  initDisplayLocaleFromPreferences,
  setDisplayLocale,
} from "@/lib/format";

interface SettingsClientProps {
  profile: UserProfile;
  activities: UserActivity[];
  activityStats: {
    totalActivities: number;
    todayActivities: number;
    moduleStats: Record<string, number>;
    lastActivity: string | null;
  } | null;
}

type TabType = "profile" | "security" | "notifications" | "activity";

export function SettingsClient({ profile, activities, activityStats }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [displayLocale, setDisplayLocaleState] = useState(
    (profile.preferences?.locale as string) || getUserLocale()
  );

  useEffect(() => {
    initDisplayLocaleFromPreferences(profile.preferences);
    if (profile.preferences?.locale && typeof profile.preferences.locale === "string") {
      setDisplayLocaleState(profile.preferences.locale);
    }
  }, [profile.preferences]);

  const tabs = [
    { id: "profile" as TabType, name: "Profile", icon: User },
    { id: "security" as TabType, name: "Security & Roles", icon: Lock },
    { id: "notifications" as TabType, name: "Notifications", icon: Bell },
    { id: "activity" as TabType, name: "Activity Log", icon: Activity },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        preferences: {
          ...profile.preferences,
          locale: displayLocale,
        },
      });

      setDisplayLocale(displayLocale);

      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = () => {
    const first = firstName || profile.first_name || "";
    const last = lastName || profile.last_name || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      login: "🔐",
      logout: "👋",
      page_view: "👁️",
      create: "➕",
      update: "✏️",
      delete: "🗑️",
      search: "🔍",
    };
    return icons[type] || "📝";
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-[#22333b] to-[#5e503f] bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account preferences and view activity
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-64 flex flex-col gap-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-slate-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#22333b] to-[#5e503f] flex items-center justify-center text-3xl font-bold text-white">
                        {getInitials()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-gradient-to-br from-[#22333b] to-[#5e503f] text-white hover:opacity-90 shadow-lg h-11 px-6 py-2 text-sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Avatar
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {avatarPreview && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAvatarPreview("");
                          setAvatarUrl("");
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                {/* Regional / display locale */}
                <div className="space-y-2">
                  <Label htmlFor="locale" className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4" />
                    Display language & region
                  </Label>
                  <select
                    id="locale"
                    value={displayLocale}
                    onChange={(e) => setDisplayLocaleState(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {SUPPORTED_LOCALES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Controls how currency, numbers, and dates appear across the dashboard.
                    Save to apply everywhere.
                  </p>
                </div>

                {/* Role Badge */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant={profile.role === "admin" ? "default" : "secondary"} className="text-sm">
                      {profile.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex items-center justify-between">
                  {saveMessage && (
                    <p className={cn(
                      "text-sm font-medium",
                      saveMessage.includes("success") ? "text-green-600" : "text-red-600"
                    )}>
                      {saveMessage}
                    </p>
                  )}
                  <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f]">Your role</h3>
                    <p className="mt-1 text-[13px] text-[#86868b]">
                      {profile.role === "admin"
                        ? "You have full access to every module and the admin console."
                        : "Standard access. Contact an administrator to change your role."}
                    </p>
                  </div>
                  <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                    {profile.role.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-4 text-[12px] text-[#86868b]">
                  Account created {formatDate(profile.created_at)}
                </p>
              </div>

              <SecurityPanel email={profile.email} />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <Card className="card-hover">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-6 text-center">
                  <Bell className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Only security notifications for now
                  </h3>
                  <p className="text-sm text-slate-600">
                    New sign-in alerts are controlled under Security &amp; Roles. Product and
                    activity notifications are coming later.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("security")}
                    className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open security settings
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Log Tab */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Activity Stats */}
              {activityStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-primary">
                        {activityStats.totalActivities}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Total Activities</p>
                    </CardContent>
                  </Card>
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="text-3xl font-bold text-green-600">
                        {activityStats.todayActivities}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Today</p>
                    </CardContent>
                  </Card>
                  <Card className="card-hover">
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-slate-600">
                        Most Active Module
                      </div>
                      <div className="text-xl font-bold text-purple-600 mt-1 capitalize">
                        {Object.entries(activityStats.moduleStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Activity List */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <div className="text-2xl">{getActivityIcon(activity.activity_type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 capitalize">
                              {activity.activity_type.replace("_", " ")}
                              {activity.module && (
                                <span className="text-slate-500"> • {activity.module}</span>
                              )}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No activity recorded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
