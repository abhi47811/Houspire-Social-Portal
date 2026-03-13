"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useUser } from "@/hooks/use-user";
import { useNotifications } from "@/hooks/use-notifications";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, authUser, loading, error, signOut } = useUser();
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications(user?.id || null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading && !authUser) {
      router.push("/login");
    }
  }, [loading, authUser, router]);

  // Auto-retry once if authUser exists but user is null
  useEffect(() => {
    if (!loading && authUser && !user && retryCount < 2) {
      const timer = setTimeout(() => {
        console.log("[layout] retrying - reloading page");
        setRetryCount((c) => c + 1);
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, authUser, user, retryCount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gray-100">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md p-6">
          <p className="text-red-600 font-medium mb-2">Something went wrong</p>
          <p className="text-gray-500 text-sm mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (authUser && !user) {
    if (retryCount < 2) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-gray-100">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Setting up your account...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md p-6">
          <p className="text-gray-800 font-medium mb-2">Account Setup Needed</p>
          <p className="text-gray-500 text-sm mb-4">
            Your login works but your user profile is not set up yet. Please contact your administrator.
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user!} onSignOut={signOut} />
      <div className="flex-1 flex flex-col ml-64">
        <Header
          user={user!}
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onSignOut={signOut}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
