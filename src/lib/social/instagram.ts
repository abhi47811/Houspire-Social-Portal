/**
 * Instagram Graph API v18+ client
 *
 * Requirements:
 * - A Facebook App with `instagram_content_publish` permission approved
 * - An Instagram Business/Creator account connected to a Facebook Page
 * - INSTAGRAM_ACCESS_TOKEN: Long-lived Page access token (valid 60 days, refreshable)
 * - INSTAGRAM_USER_ID: The numeric Instagram Business account ID
 *
 * Get these from: https://developers.facebook.com/tools/explorer/
 */

const IG_GRAPH = "https://graph.instagram.com/v18.0";

export interface IGPublishResult {
  ig_post_id: string;
}

/** Poll until container status is FINISHED or ERROR (max ~30s) */
async function waitForContainer(
  accessToken: string,
  igUserId: string,
  creationId: string
): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(
      `${IG_GRAPH}/${creationId}?fields=status_code&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR" || data.error) {
      throw new Error(`Instagram container error: ${JSON.stringify(data)}`);
    }
  }
  throw new Error("Instagram media container timed out");
}

export async function publishInstagramPhoto(
  accessToken: string,
  igUserId: string,
  imageUrl: string,
  caption: string
): Promise<IGPublishResult> {
  // Step 1: Create media container
  const containerRes = await fetch(`${IG_GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: accessToken,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(`IG container error: ${containerData.error.message}`);
  const creationId: string = containerData.id;

  // Step 2: Wait for processing
  await waitForContainer(accessToken, igUserId, creationId);

  // Step 3: Publish
  const publishRes = await fetch(`${IG_GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG publish error: ${publishData.error.message}`);

  return { ig_post_id: publishData.id };
}

export async function publishInstagramReel(
  accessToken: string,
  igUserId: string,
  videoUrl: string,
  caption: string,
  coverUrl?: string
): Promise<IGPublishResult> {
  // Step 1: Create reel container
  const containerRes = await fetch(`${IG_GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      ...(coverUrl ? { cover_url: coverUrl } : {}),
      access_token: accessToken,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(`IG reel container error: ${containerData.error.message}`);
  const creationId: string = containerData.id;

  // Step 2: Wait for video processing (videos take longer)
  await waitForContainer(accessToken, igUserId, creationId);

  // Step 3: Publish
  const publishRes = await fetch(`${IG_GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG reel publish error: ${publishData.error.message}`);

  return { ig_post_id: publishData.id };
}

/** Fetch basic insights for a published post */
export async function getPostInsights(
  accessToken: string,
  igPostId: string
): Promise<{ impressions: number; reach: number; likes: number; comments: number; saves: number }> {
  const fields = "impressions,reach,like_count,comments_count,saved";
  const res = await fetch(
    `${IG_GRAPH}/${igPostId}?fields=${fields}&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(`IG insights error: ${data.error.message}`);
  return {
    impressions: data.impressions || 0,
    reach: data.reach || 0,
    likes: data.like_count || 0,
    comments: data.comments_count || 0,
    saves: data.saved || 0,
  };
}
