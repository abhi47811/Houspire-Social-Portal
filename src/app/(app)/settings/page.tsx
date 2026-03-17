"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import {
  cn,
  ROLE_LABELS,
  type SmUser,
} from "@/lib/utils";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NotificationPreferences {
  task_assigned?: boolean;
  status_changes?: boolean;
  comments?: boolean;
  mentions?: boolean;
  review_requests?: boolean;
  publish_results?: boolean;
}

const NOTIFICATION_OPTIONS = [
  { key: "task_assigned", label: "Task Assigned" },
  { key: "status_changes", label: "Status Changes" },
  { key: "comments", label: "Comments" },
  { key: "mentions", label: "Mentions" },
  { key: "review_requests", label: "Review Requests" },
  { key: "publish_results", label: "Publish Results" },
];

interface IntegrationStatus {
  platform: string;
  is_connected: boolean;
  account_id: string | null;
  token_issued_at: string | null;
  days_until_expiry: number | null;
}

const PLATFORM_META: Record<string, { icon: string; label: string; tokenLabel: string; accountLabel: string; accountPlaceholder: string; docs: string }> = {
  instagram: {
    icon: "📷",
    label: "Instagram",
    tokenLabel: "Long-Lived Access Token",
    accountLabel: "Instagram User ID",
    accountPlaceholder: "e.g. 17841400000000000",
    docs: "https://developers.facebook.com/tools/explorer/",
  },
  linkedin: {
    icon: "💼",
    label: "LinkedIn",
    tokenLabel: "OAuth Access Token",
    accountLabel: "Organization ID",
    accountPlaceholder: "e.g. 123456789",
    docs: "https://www.linkedin.com/developers/tools/oauth",
  },
};

export default function SettingsPage() {
  const { user } = useUser();
  const supabase = createClient();

  // Profile state
  const [editingName, setEditingName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications state
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>({});
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Integration state
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({});
  const [configuringPlatform, setConfiguringPlatform] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [accountIdInput, setAccountIdInput] = useState("");
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);

  // Team state
  const [teamMembers, setTeamMembers] = useState<SmUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("script_writer");
  const [inviting, setInviting] = useState(false);

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setEditingName(user.name || "");
      setNotificationPrefs(
        (user.notification_prefs as NotificationPreferences) || {}
      );
    }
  }, [user]);

  // Fetch team members (admin only)
  useEffect(() => {
    if (user?.role === "admin") {
      const fetchTeam = async () => {
        try {
          setLoadingTeam(true);
          const { data, error } = await supabase
            .from("sm_users")
            .select("*")
            .order("created_at", { ascending: true });

          if (error) throw error;
          setTeamMembers(data || []);
        } catch (err) {
          console.error("Error fetching team members:", err);
        } finally {
          setLoadingTeam(false);
        }
      };

      fetchTeam();
    }
  }, [user?.role, supabase]);

  // Load integration statuses
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const results = await Promise.allSettled([
        fetch("/api/integrations/instagram").then((r) => r.json()),
        fetch("/api/integrations/linkedin").then((r) => r.json()),
      ]);
      const map: Record<string, IntegrationStatus> = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value?.platform) {
          map[result.value.platform] = result.value;
        }
      }
      setIntegrations(map);
    };
    load();
  }, [user]);

  const handleOpenConfigure = (platform: string) => {
    setTokenInput("");
    setAccountIdInput(integrations[platform]?.account_id || "");
    setConfiguringPlatform(platform);
  };

  const handleSaveIntegration = async (platform: string) => {
    if (!tokenInput.trim() || !accountIdInput.trim()) {
      alert("Both token and account ID are required.");
      return;
    }
    try {
      setSavingIntegration(true);
      const res = await fetch(`/api/integrations/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokenInput,
          account_id: accountIdInput,
          token_issued_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      // Refresh status
      const updated = await fetch(`/api/integrations/${platform}`).then((r) => r.json());
      setIntegrations((prev) => ({ ...prev, [platform]: updated }));
      setConfiguringPlatform(null);
      setTokenInput("");
      setAccountIdInput("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save integration");
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${PLATFORM_META[platform]?.label}? Publishing to this platform will stop.`)) return;
    try {
      setDisconnectingPlatform(platform);
      const res = await fetch(`/api/integrations/${platform}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Disconnect failed");
      setIntegrations((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], is_connected: false, account_id: null, token_issued_at: null, days_until_expiry: null },
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from("sm_users")
        .update({ name: editingName })
        .eq("id", user.id);

      if (error) throw error;

      // Show toast
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;

    try {
      setSavingNotifications(true);
      const { error } = await supabase
        .from("sm_users")
        .update({ notification_prefs: notificationPrefs as import("@/lib/supabase/database.types").Json })
        .eq("id", user.id);

      if (error) throw error;
      alert("Notification preferences saved!");
    } catch (err) {
      console.error("Error saving notifications:", err);
      alert("Failed to save preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleToggleNotification = (key: string) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key as keyof NotificationPreferences],
    }));
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    try {
      setInviting(true);
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invite");

      alert(`Invite sent to ${inviteEmail}! They'll receive an email to set their password.`);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("script_writer");
      setShowInviteDialog(false);
      // Refresh team list
      const { data: updated } = await supabase.from("sm_users").select("*").order("created_at", { ascending: true });
      setTeamMembers(updated || []);
    } catch (err) {
      console.error("Error inviting member:", err);
      alert(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("sm_users").update({ role: newRole }).eq("id", memberId);
      if (error) throw error;
      setTeamMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole as SmUser["role"] } : m));
    } catch (err) {
      console.error("Role update failed:", err);
      alert("Failed to update role");
    }
  };

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("sm_users").update({ is_active: !isActive }).eq("id", memberId);
      if (error) throw error;
      setTeamMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, is_active: !isActive } : m));
    } catch (err) {
      console.error("Toggle active failed:", err);
      alert("Failed to update member status");
    }
  };

  if (!user) {
    return (
      <div className="p-8">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          {user.role === "admin" && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback>
                    {(user.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Profile Picture</h3>
                  <p className="text-sm text-gray-600">
                    Avatar placeholder - update coming soon
                  </p>
                </div>
              </div>

              {/* User Info Section */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-600">
                      Email cannot be changed here
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={ROLE_LABELS[user.role] || user.role}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="w-full sm:w-auto"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">
                Notification Preferences
              </h3>
              <p className="text-sm text-gray-600">
                Choose what notifications you want to receive
              </p>

              <div className="space-y-3">
                {NOTIFICATION_OPTIONS.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      id={option.key}
                      checked={
                        notificationPrefs[
                          option.key as keyof NotificationPreferences
                        ] || false
                      }
                      onCheckedChange={() => handleToggleNotification(option.key)}
                    />
                    <Label
                      htmlFor={option.key}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={savingNotifications}
                className="w-full sm:w-auto"
              >
                {savingNotifications ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Platform Connections</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your social accounts so Houspire can publish content automatically.
              {user.role !== "admin" && " Contact an admin to update connection tokens."}
            </p>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {["instagram", "linkedin"].map((platform) => {
              const meta = PLATFORM_META[platform];
              const status = integrations[platform];
              const days = status?.days_until_expiry;
              const isConfiguring = configuringPlatform === platform;

              return (
                <Card key={platform} className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.icon}</span>
                      <div>
                        <h4 className="font-semibold">{meta.label}</h4>
                        {status?.account_id && (
                          <p className="text-xs text-gray-500">ID: {status.account_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {status?.is_connected ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200" variant="outline">
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-200" variant="outline">
                          Not Connected
                        </Badge>
                      )}
                      {status?.is_connected && days !== null && days !== undefined && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            days <= 0
                              ? "bg-red-50 text-red-700 border-red-200"
                              : days <= 10
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          )}
                        >
                          {days <= 0 ? "Token expired" : `Token expires in ${days}d`}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Configure form (admin only) */}
                  {user.role === "admin" && isConfiguring && (
                    <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">{meta.tokenLabel}</Label>
                        <Input
                          type="password"
                          placeholder="Paste token here..."
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="font-mono text-xs"
                        />
                        <a
                          href={meta.docs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          How to get a token →
                        </a>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">{meta.accountLabel}</Label>
                        <Input
                          placeholder={meta.accountPlaceholder}
                          value={accountIdInput}
                          onChange={(e) => setAccountIdInput(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={savingIntegration || !tokenInput.trim() || !accountIdInput.trim()}
                          onClick={() => handleSaveIntegration(platform)}
                          className="flex-1"
                        >
                          {savingIntegration ? "Saving..." : "Save & Connect"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfiguringPlatform(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Admin actions */}
                  {user.role === "admin" && !isConfiguring && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenConfigure(platform)}
                      >
                        {status?.is_connected ? "Reconfigure" : "Connect"}
                      </Button>
                      {status?.is_connected && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={disconnectingPlatform === platform}
                          onClick={() => handleDisconnect(platform)}
                        >
                          {disconnectingPlatform === platform ? "..." : "Disconnect"}
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Info banner */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>How publishing works:</strong> When a task reaches &quot;Scheduled&quot; status and its scheduled time arrives, the publish cron automatically posts to the connected platforms. Tokens are valid for 60 days — Instagram tokens auto-refresh weekly, LinkedIn tokens require manual re-authorization.
            </p>
          </Card>
        </TabsContent>

        {/* Team Tab (Admin Only) */}
        {user.role === "admin" && (
          <TabsContent value="team" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Manage your team and their roles
                    </p>
                  </div>

                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button>Invite Member</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                          They'll receive an email to set their password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-name">Full Name</Label>
                          <Input
                            id="invite-name"
                            placeholder="Jane Smith"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="member@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <select
                            id="invite-role"
                            className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                          >
                            <option value="script_writer">Script Writer</option>
                            <option value="reviewer_editor">Reviewer / Editor</option>
                            <option value="shooter">Shooter</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <Button
                          onClick={handleInviteMember}
                          className="w-full"
                          disabled={inviting}
                        >
                          {inviting ? "Sending..." : "Send Invite"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {loadingTeam ? (
                  <p className="text-gray-600">Loading team members...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={member.avatar_url || ""} />
                                <AvatarFallback>
                                  {(member.name || "U")
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {member.name}
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {ROLE_LABELS[member.role] || member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                member.is_active ? "default" : "secondary"
                              }
                            >
                              {member.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <select
                                className="border rounded px-2 py-1 text-xs"
                                value={member.role}
                                onChange={(e) => handleChangeRole(member.id, e.target.value)}
                                disabled={member.auth_user_id === user.auth_user_id}
                              >
                                <option value="script_writer">Script Writer</option>
                                <option value="reviewer_editor">Reviewer / Editor</option>
                                <option value="shooter">Shooter</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={member.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                onClick={() => handleToggleActive(member.id, member.is_active)}
                                disabled={member.auth_user_id === user.auth_user_id}
                              >
                                {member.is_active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
