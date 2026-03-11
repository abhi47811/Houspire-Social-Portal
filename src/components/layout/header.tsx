"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import type { SmUser, SmNotification } from "@/lib/utils";

interface HeaderProps {
  user: SmUser | null;
  unreadCount: number;
  notifications: SmNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSignOut: () => Promise<void>;
}

const pageLabels: Record<string, string> = {
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/media": "Media",
  "/templates": "Templates",
  "/hashtags": "Hashtags",
  "/queue": "Queue",
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/activity": "Activity",
  "/brand-kit": "Brand Kit",
  "/audit": "Audit Log",
  "/automations": "Automations",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  // Check exact match
  if (pageLabels[pathname]) {
    return pageLabels[pathname];
  }

  // Check for nested routes (e.g., /tasks/123)
  const basePath = pathname.split("/").slice(0, 2).join("/");
  if (pageLabels[basePath]) {
    return pageLabels[basePath];
  }

  return "Home";
}

export function Header({
  user,
  unreadCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSignOut,
}: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-8">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>

        {/* Right Section: Notifications & User */}
        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationBell
            unreadCount={unreadCount}
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
          />

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gray-200">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
