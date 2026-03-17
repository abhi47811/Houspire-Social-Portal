export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { getPostInsights } from "@/lib/social/instagram";
import { getPostStatistics } from "@/lib/social/linkedin";

interface PlatformMetrics {
  posts_published: number;
  total_impressions: number;
  total_reach: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();

    // Target: yesterday's published tasks
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, platform, ig_post_id, linkedin_urn, published_at")
      .eq("status", "published")
      .gte("published_at", dayStart)
      .lte("published_at", dayEnd);

    if (error) throw error;

    const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const liToken = process.env.LINKEDIN_ACCESS_TOKEN;

    // Aggregate metrics per platform
    const platformData: Record<string, PlatformMetrics> = {
      instagram: { posts_published: 0, total_impressions: 0, total_reach: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_saves: 0 },
      linkedin: { posts_published: 0, total_impressions: 0, total_reach: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_saves: 0 },
    };

    for (const task of tasks || []) {
      // Instagram
      if ((task.platform === "instagram" || task.platform === "both") && task.ig_post_id && igToken) {
        try {
          const insights = await getPostInsights(igToken, task.ig_post_id);
          platformData.instagram.posts_published++;
          platformData.instagram.total_impressions += insights.impressions;
          platformData.instagram.total_reach += insights.reach;
          platformData.instagram.total_likes += insights.likes;
          platformData.instagram.total_comments += insights.comments;
          platformData.instagram.total_saves += insights.saves;

          // Store per-task metrics
          await supabase.from("sm_task_metrics").upsert({
            task_id: task.id,
            platform: "instagram",
            impressions: insights.impressions,
            reach: insights.reach,
            likes: insights.likes,
            comments: insights.comments,
            saves: insights.saves,
            recorded_at: new Date().toISOString(),
          }, { onConflict: "task_id,platform" });
        } catch (err) {
          console.error(`IG insights failed for task ${task.id}:`, err);
        }
      }

      // LinkedIn
      if ((task.platform === "linkedin" || task.platform === "both") && task.linkedin_urn && liToken) {
        try {
          const stats = await getPostStatistics(liToken, task.linkedin_urn);
          platformData.linkedin.posts_published++;
          platformData.linkedin.total_impressions += stats.impressions;
          platformData.linkedin.total_reach += stats.impressions; // LI doesn't separate reach from impressions
          platformData.linkedin.total_likes += stats.likes;
          platformData.linkedin.total_comments += stats.comments;
          platformData.linkedin.total_shares += stats.shares;

          // Store per-task metrics
          await supabase.from("sm_task_metrics").upsert({
            task_id: task.id,
            platform: "linkedin",
            impressions: stats.impressions,
            reach: stats.impressions,
            likes: stats.likes,
            comments: stats.comments,
            shares: stats.shares,
            recorded_at: new Date().toISOString(),
          }, { onConflict: "task_id,platform" });
        } catch (err) {
          console.error(`LI stats failed for task ${task.id}:`, err);
        }
      }
    }

    // Upsert daily metrics rows — one per platform
    const rows = [];
    for (const [platform, metrics] of Object.entries(platformData)) {
      if (metrics.posts_published > 0) {
        const engagementRate =
          metrics.total_reach > 0
            ? ((metrics.total_likes + metrics.total_comments + metrics.total_saves + metrics.total_shares) /
                metrics.total_reach) *
              100
            : 0;

        const { error: upsertError } = await supabase.from("sm_daily_metrics").upsert({
          date: dateStr,
          platform,
          posts_published: metrics.posts_published,
          total_impressions: metrics.total_impressions,
          total_reach: metrics.total_reach,
          total_likes: metrics.total_likes,
          total_comments: metrics.total_comments,
          total_shares: metrics.total_shares,
          total_saves: metrics.total_saves,
          avg_engagement_rate: parseFloat(engagementRate.toFixed(2)),
        }, { onConflict: "date,platform" });

        if (upsertError) {
          console.error(`Failed to upsert daily metrics for ${platform}:`, upsertError);
        } else {
          rows.push({ date: dateStr, platform, posts: metrics.posts_published });
        }
      }
    }

    return NextResponse.json({
      date: dateStr,
      tasks_processed: tasks?.length || 0,
      daily_metrics_written: rows,
    });
  } catch (error) {
    console.error("Metrics cron error:", error);
    return NextResponse.json({ error: "Failed to run metrics cron" }, { status: 500 });
  }
}
