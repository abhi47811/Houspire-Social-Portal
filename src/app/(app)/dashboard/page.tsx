"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/kpi-card";
import {
  CheckCircle2,
  Clock,
  ListChecks,
  Eye,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SmTask, SmActivity, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PlatformData {
  platform: string;
  count: number;
}

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState({
    totalTasks: 0,
    publishedThisMonth: 0,
    pendingReview: 0,
    scheduled: 0,
  });

  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [recentActivity, setRecentActivity] = useState<SmActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const client = createClient();

      // Fetch KPI data
      const { data: tasksData } = await client.from("sm_tasks").select("*");
      const allTasks = (tasksData || []) as SmTask[];

      // Total Tasks
      const totalTasks = allTasks.length;

      // Published This Month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const publishedThisMonth = allTasks.filter((task) => {
        if (!task.published_at) return false;
        const publishedDate = new Date(task.published_at);
        return (
          publishedDate >= monthStart &&
          publishedDate <= now &&
          task.status === "published"
        );
      }).length;

      // Pending Review
      const pendingReview = allTasks.filter(
        (task) =>
          task.status === "pending_script_review" ||
          task.status === "pending_final_review"
      ).length;

      // Scheduled
      const scheduled = allTasks.filter(
        (task) => task.status === "scheduled"
      ).length;

      setKpiData({
        totalTasks,
        publishedThisMonth,
        pendingReview,
        scheduled,
      });

      // Fetch platform distribution
      const instagramCount = allTasks.filter(
        (task) => task.platform === "instagram"
      ).length;
      const linkedinCount = allTasks.filter(
        (task) => task.platform === "linkedin"
      ).length;
      const bothCount = allTasks.filter(
        (task) => task.platform === "both"
      ).length;

      setPlatformData([
        { platform: "Instagram", count: instagramCount },
        { platform: "LinkedIn", count: linkedinCount },
        { platform: "Both", count: bothCount },
      ]);

      // Fetch Recent Activity
      const { data: activityData } = await client
        .from("sm_activity")
        .select(
          `
          *,
          actor:sm_users!actor_id(id, name, avatar_url)
        `
        )
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentActivity(
        ((activityData || []) as unknown as SmActivity[]) || []
      );
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your content pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Tasks"
          value={kpiData.totalTasks}
          icon={ListChecks}
          color="border-blue-500"
        />
        <KPICard
          title="Published This Month"
          value={kpiData.publishedThisMonth}
          icon={CheckCircle2}
          color="border-green-500"
        />
        <KPICard
          title="Pending Review"
          value={kpiData.pendingReview}
          icon={Eye}
          color="border-yellow-500"
        />
        <KPICard
          title="Scheduled"
          value={kpiData.scheduled}
          icon={Calendar}
          color="border-purple-500"
        />
      </div>

      {/* Platform Chart */}
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold">Posts by Platform</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={platformData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis
              dataKey="platform"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "14px" }}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "14px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <Link href="/activity" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground">No activity yet</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 border-b pb-4 last:border-b-0"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={activity.actor?.avatar_url || ""}
                    alt={activity.actor?.name || "User"}
                  />
                  <AvatarFallback>
                    {(activity.actor?.name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.actor?.name}</span>{" "}
                    {activity.action}{" "}
                    {activity.entity_title && (
                      <span className="font-medium">'{activity.entity_title}'</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
