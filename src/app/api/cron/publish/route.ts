export const dynamic = "force-dynamic";
import { createServiceSupabase } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";
import {
  publishInstagramPhoto,
  publishInstagramReel,
} from "@/lib/social/instagram";
import { publishLinkedInPost } from "@/lib/social/linkedin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://houspire-social-portal.vercel.app";

interface PublishResult {
  id: string;
  status: "published" | "failed";
  ig_post_id?: string;
  linkedin_urn?: string;
  error?: string;
}

async function sendPublishEmail(
  to: string,
  name: string,
  taskTitle: string,
  platform: string,
  taskId: string
) {
  try {
    await fetch(`${APP_URL}/api/email/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        to,
        type: "publish_success",
        data: {
          recipientName: name,
          taskTitle,
          platform,
          actionUrl: `${APP_URL}/tasks?id=${taskId}`,
        },
      }),
    });
  } catch (err) {
    console.error("Failed to send publish email:", err);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = authHeader?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const now = new Date().toISOString();

    const { data: tasks, error } = await supabase
      .from("sm_tasks")
      .select("id, title, platform, scheduled_at, caption, cover_image_url, final_video_url, created_by")
      .eq("status", "scheduled")
      .lte("scheduled_at", now);

    if (error) throw error;

    const igToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const liToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const liOrgId = process.env.LINKEDIN_ORGANIZATION_ID;

    const results: PublishResult[] = [];
    const emailPromises: Promise<void>[] = [];

    for (const task of tasks || []) {
      let ig_post_id: string | undefined;
      let linkedin_urn: string | undefined;
      const errors: string[] = [];

      // --- Instagram Publishing ---
      if ((task.platform === "instagram" || task.platform === "both") && igToken && igUserId) {
        try {
          const caption = task.caption || task.title;
          if (task.final_video_url) {
            const res = await publishInstagramReel(igToken, igUserId, task.final_video_url, caption, task.cover_image_url || undefined);
            ig_post_id = res.ig_post_id;
          } else if (task.cover_image_url) {
            const res = await publishInstagramPhoto(igToken, igUserId, task.cover_image_url, caption);
            ig_post_id = res.ig_post_id;
          } else {
            errors.push("Instagram: no image or video URL on task");
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Instagram publish failed for task ${task.id}:`, msg);
          errors.push(`Instagram: ${msg}`);
        }
      }

      // --- LinkedIn Publishing ---
      if ((task.platform === "linkedin" || task.platform === "both") && liToken && liOrgId) {
        try {
          const text = task.caption || task.title;
          const res = await publishLinkedInPost(liToken, liOrgId, text, task.cover_image_url || undefined, task.title);
          linkedin_urn = res.linkedin_urn;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`LinkedIn publish failed for task ${task.id}:`, msg);
          errors.push(`LinkedIn: ${msg}`);
        }
      }

      // --- Determine if at least one platform published successfully ---
      const igRequired = task.platform === "instagram" || task.platform === "both";
      const liRequired = task.platform === "linkedin" || task.platform === "both";
      const igSuccess = !igRequired || !!ig_post_id;
      const liSuccess = !liRequired || !!linkedin_urn;
      const atLeastOneSuccess = ig_post_id || linkedin_urn;
      const allFailed = igRequired && !ig_post_id && liRequired && !linkedin_urn;

      if (allFailed && errors.length > 0) {
        // Both platforms failed — mark as failed, don't change status
        console.error(`All platforms failed for task ${task.id}:`, errors);
        results.push({ id: task.id, status: "failed", error: errors.join("; ") });
        continue;
      }

      // --- Update DB (at least one platform succeeded) ---
      const { error: updateError } = await supabase
        .from("sm_tasks")
        .update({
          status: "published",
          published_at: now,
          updated_at: now,
          ...(ig_post_id ? { ig_post_id } : {}),
          ...(linkedin_urn ? { linkedin_urn } : {}),
        })
        .eq("id", task.id);

      if (!updateError) {
        await supabase.from("sm_activity").insert({
          action: "published",
          entity_type: "task",
          entity_id: task.id,
          entity_title: task.title,
          details: {
            platform: task.platform,
            auto_published: true,
            ig_post_id: ig_post_id || null,
            linkedin_urn: linkedin_urn || null,
            partial_failure: errors.length > 0,
            errors: errors.length ? errors : undefined,
          },
        });

        // Send email to creator
        if (task.created_by) {
          const { data: creator } = await supabase
            .from("sm_users")
            .select("email, name")
            .eq("id", task.created_by)
            .single();

          if (creator?.email) {
            emailPromises.push(
              sendPublishEmail(creator.email, creator.name || "Team Member", task.title, task.platform, task.id)
            );
          }
        }

        results.push({ id: task.id, status: "published", ig_post_id, linkedin_urn });
      } else {
        results.push({ id: task.id, status: "failed", error: updateError.message });
      }
    }

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ published: results.filter((r) => r.status === "published").length, tasks: results });
  } catch (error) {
    console.error("Publish cron error:", error);
    const { alertCronFailure } = await import("@/lib/cron-alert");
    await alertCronFailure("publish", error);
    return NextResponse.json({ error: "Failed to run publish cron" }, { status: 500 });
  }
}
