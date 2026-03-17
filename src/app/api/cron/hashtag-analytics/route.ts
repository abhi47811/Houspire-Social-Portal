export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import { alertCronFailure } from "@/lib/cron-alert";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabase();

    // Scan published tasks from the last 30 days to compute hashtag usage
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: tasks, error: tasksError } = await supabase
      .from("sm_tasks")
      .select("id, caption, platform, published_at")
      .eq("status", "published")
      .gte("published_at", since.toISOString())
      .not("caption", "is", null);

    if (tasksError) throw tasksError;

    // Parse hashtags from captions and tally usage per platform
    const usage: Record<string, { instagram: number; linkedin: number; lastUsed: string }> = {};

    for (const task of tasks || []) {
      const caption = task.caption as string;
      const matches = caption.match(/#[\w]+/g) || [];
      const platforms =
        task.platform === "both"
          ? ["instagram", "linkedin"]
          : [task.platform as string];

      for (const tag of matches) {
        const normalised = tag.toLowerCase();
        if (!usage[normalised]) {
          usage[normalised] = { instagram: 0, linkedin: 0, lastUsed: task.published_at as string };
        }
        for (const p of platforms) {
          if (p === "instagram") usage[normalised].instagram++;
          if (p === "linkedin") usage[normalised].linkedin++;
        }
        if (
          task.published_at &&
          new Date(task.published_at as string) > new Date(usage[normalised].lastUsed)
        ) {
          usage[normalised].lastUsed = task.published_at as string;
        }
      }
    }

    let updated = 0;

    for (const [hashtag, counts] of Object.entries(usage)) {
      const platforms: Array<"instagram" | "linkedin"> = [];
      if (counts.instagram > 0) platforms.push("instagram");
      if (counts.linkedin > 0) platforms.push("linkedin");

      for (const platform of platforms) {
        const count = platform === "instagram" ? counts.instagram : counts.linkedin;

        const { data: existing } = await supabase
          .from("sm_hashtag_analytics")
          .select("id")
          .eq("hashtag", hashtag)
          .eq("platform", platform)
          .single();

        if (existing) {
          await supabase
            .from("sm_hashtag_analytics")
            .update({ times_used: count, usage_count: count, last_used_at: counts.lastUsed })
            .eq("id", existing.id);
        } else {
          await supabase.from("sm_hashtag_analytics").insert({
            hashtag,
            platform,
            usage_count: count,
            times_used: count,
            last_used_at: counts.lastUsed,
          });
        }
        updated++;
      }
    }

    // Update hashtag set usage counts
    const { data: sets } = await supabase.from("sm_hashtag_sets").select("id, hashtags");
    for (const set of sets || []) {
      const tags = set.hashtags as string[];
      const totalUsed = tags.reduce((sum, tag) => {
        const u = usage[tag.toLowerCase()];
        return sum + (u ? u.instagram + u.linkedin : 0);
      }, 0);
      if (totalUsed > 0) {
        await supabase
          .from("sm_hashtag_sets")
          .update({ times_used: totalUsed, updated_at: new Date().toISOString() })
          .eq("id", set.id);
      }
    }

    return NextResponse.json({
      hashtags_analysed: Object.keys(usage).length,
      records_updated: updated,
      tasks_scanned: tasks?.length || 0,
    });
  } catch (error) {
    console.error("Hashtag analytics cron error:", error);
    await alertCronFailure("hashtag-analytics", error);
    return NextResponse.json({ error: "Failed to collect hashtag analytics" }, { status: 500 });
  }
}
