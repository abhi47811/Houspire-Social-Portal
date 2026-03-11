"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils";
import type { SmNotification } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount: number;
  notifications: SmNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationBell({
  unreadCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
              onClick={() => onMarkAllAsRead()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 transition-colors ${
                  notification.is_read
                    ? "border-transparent bg-white"
                    : "border-blue-500 bg-blue-50"
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    onMarkAsRead(notification.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="px-4 py-3">
          <Link href="/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
