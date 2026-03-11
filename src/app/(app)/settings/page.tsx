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

const INTEGRATIONS = [
  {
    name: "Instagram",
    icon: "📷",
    description: "Connect your Instagram account",
  },
  {
    name: "LinkedIn",
    icon: "💼",
    description: "Connect your LinkedIn profile",
  },
  {
    name: "Google Sheets",
    icon: "📊",
    description: "Sync with Google Sheets",
  },
];

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

  // Team state
  const [teamMembers, setTeamMembers] = useState<SmUser[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

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
        .update({ notification_prefs: notificationPrefs })
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

  const handleIntegrationConnect = () => {
    alert("Coming soon");
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;

    try {
      // This would typically call a backend API to send an invite
      alert(`Invite dialog would send invite to: ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteDialog(false);
    } catch (err) {
      console.error("Error inviting member:", err);
      alert("Failed to send invite");
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
                    {user.name
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((integration) => (
              <Card key={integration.name} className="p-6">
                <div className="space-y-4">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {integration.description}
                    </p>
                  </div>

                  <div className="py-3">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Not Connected
                    </Badge>
                  </div>

                  <Button
                    onClick={handleIntegrationConnect}
                    className="w-full"
                    variant="outline"
                  >
                    Connect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
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
                          Send an invitation to a new team member
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
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
                        <Button
                          onClick={handleInviteMember}
                          className="w-full"
                        >
                          Send Invite
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
                                  {member.name
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
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
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
