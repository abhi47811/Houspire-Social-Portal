export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const today = new Date().toISOString().split("T")[0];

    const { data: taskMetrics, error } = await supabase
      .from("sm_task_metrics")
      .select("platform, impressions, reach, likes, comments, shares, saves")
      .gte("fetched_at", today);

    if (error) throw error;

    const platformAgg: Record<string, { impressions: number; reach: number; likes: number; comments: number; shares: number; saves: number }> = {};

    for (const m of taskMetrics || []) {
      const p = m.platform || "unknown";
      if (!platformAgg[p]) {
        platformAgg[p] = { impressions: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
      }
      platformAgg[p].impressions += m.impressions || 0;
      platformAgg[p].reach += m.reach || 0;
      platformAgg[p].likes += m.likes || 0;
      platformAgg[p].comments += m.comments || 0;
      platformAgg[p].shares += m.shares || 0;
      platformAgg[p].saves += m.saves || 0;
    }

    for (const [platform, agg] of Object.entries(platformAgg)) {
      const totalEngagement = agg.likes + agg.comments + agg.shares + agg.saves;
      const engagementRate = agg.impressions > 0 ? (totalEngagement / agg.impressions) * 100 : 0;
      await supabase.from("sm_daily_metrics").upsert(
        {
          platform, date: today,
          impressions: agg.impressions, reach: agg.reach,
          likes: agg.likes, comments: agg.comments, shares: agg.shares, saves: agg.saves,
          engagement_rate: Math.round(engagementRate * 100) / 100,
        },
        { onConflict: "platform,date" }
      );
    }

    return NextResponse.json({ date: today, platforms_aggregated: Object.keys(platformAgg).length });
  } catch (error) {
    console.error("Aggregate metrics cron error:", error);
    return NextResponse.json({ error: "Failed to aggregate metrics" }, { status: 500 });
  }
}
