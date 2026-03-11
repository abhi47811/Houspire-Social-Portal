"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SmNotification } from "@/lib/utils";

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: SmNotification[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SmNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchNotifications = async () => {
      try {
        setLoading(true);

        // Fetch unread notifications
        const { data, error } = await supabase
          .from("sm_notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("is_read", false)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.length || 0);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sm_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as SmNotification;
          if (!newNotification.is_read) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sm_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotification = payload.new as SmNotification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );

          // Update unread count
          const wasUnread = !payload.old.is_read;
          const isNowUnread = !updatedNotification.is_read;

          if (wasUnread && !isNowUnread) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } else if (!wasUnread && isNowUnread) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sm_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sm_notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      throw err;
    }
  };

  return {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
  };
}
