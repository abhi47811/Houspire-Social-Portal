"use client";

import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name.split(" ")[0]}!
        </h2>
        <p className="text-gray-600">
          Here's what's happening with your content today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tasks in Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Scheduled Posts</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Published This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Getting Started
        </h3>
        <p className="text-gray-600 mb-6">
          Your dashboard is ready. Start by exploring the navigation menu on the
          left to manage your content, schedule posts, and collaborate with your team.
        </p>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Create and manage tasks in the Tasks section
          </li>
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            View your calendar and scheduled content
          </li>
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Upload and organize media files
          </li>
          <li className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            Track activity and get notifications
          </li>
        </ul>
      </Card>
    </div>
  );
}
