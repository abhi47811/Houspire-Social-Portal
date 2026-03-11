"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  CalendarDays,
  Image,
  FileText,
  Hash,
  ListOrdered,
  BarChart3,
  TrendingUp,
  Bell,
  Palette,
  Shield,
  Zap,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SmUser } from "@/lib/utils";

interface SidebarProps {
  user: SmUser | null;
  onSignOut: () => Promise<void>;
}

const navItems = [
  { label: "Tasks", icon: CheckSquare, href: "/tasks" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Media", icon: Image, href: "/media" },
  { label: "Templates", icon: FileText, href: "/templates" },
  { label: "Hashtags", icon: Hash, href: "/hashtags" },
  { label: "Queue", icon: ListOrdered, href: "/queue" },
  { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { label: "Analytics", icon: TrendingUp, href: "/analytics" },
  { label: "Activity", icon: Bell, href: "/activity" },
];

const adminItems = [
  { label: "Brand Kit", icon: Palette, href: "/brand" },
  { label: "Audit Log", icon: Shield, href: "/audit" },
  { label: "Automations", icon: Zap, href: "/automations" },
];

const settingsItems = [{ label: "Settings", icon: Settings, href: "/settings" }];

export function Sidebar({ user, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  const isAdmin = user?.role === "admin";

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col border-r border-gray-800">
      {/* Logo/Brand */}
      <div className="px-6 py-8 border-b border-gray-800">
        <Link href="/" className="text-2xl font-bold text-white">
          Houspire
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {/* Main Items */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded",
                    active && "bg-gray-800 text-white"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Admin Items */}
        {isAdmin && (
          <>
            <div className="px-2 py-3 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </p>
            </div>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded",
                        active && "bg-gray-800 text-white"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Settings Items */}
        <div className="space-y-1 mt-4">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded",
                    active && "bg-gray-800 text-white"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile Section */}
      {user && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
              <AvatarFallback className="bg-gray-800 text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name}
              </p>
              <Badge
                variant="secondary"
                className="mt-1 text-xs capitalize bg-gray-800 text-gray-200"
              >
                {user.role.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </Button>
        </div>
      )}
    </aside>
  );
}
