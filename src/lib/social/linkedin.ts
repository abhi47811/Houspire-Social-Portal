/**
 * LinkedIn UGC Posts API v2 client
 *
 * Requirements:
 * - A LinkedIn Developer App with `w_organization_social` permission
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token (valid 60 days)
 * - LINKEDIN_ORGANIZATION_ID: Numeric organization ID (e.g. "12345678")
 *   Find this in the LinkedIn admin URL: linkedin.com/company/SLUG/admin/ -> check URL for org ID
 *
 * Get token via: https://www.linkedin.com/developers/tools/oauth
 */

const LI_API = "https://api.linkedin.com/v2";

export interface LIPublishResult {
  linkedin_urn: string;
}

interface UGCPost {
  author: string;
  lifecycleState: "PUBLISHED";
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: { text: string };
      shareMediaCategory: "NONE" | "IMAGE" | "VIDEO" | "ARTICLE";
      media?: Array<{
        status: "READY";
        originalUrl?: string;
        media?: string;
        title?: { text: string };
      }>;
    };
  };
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC";
  };
}

export async function publishLinkedInPost(
  accessToken: string,
  organizationId: string,
  text: string,
  mediaUrl?: string,
  mediaTitle?: string
): Promise<LIPublishResult> {
  const author = `urn:li:organization:${organizationId}`;

  const content: UGCPost["specificContent"]["com.linkedin.ugc.ShareContent"] = {
    shareCommentary: { text },
    shareMediaCategory: mediaUrl ? "ARTICLE" : "NONE",
    ...(mediaUrl
      ? {
          media: [
            {
              status: "READY",
              originalUrl: mediaUrl,
              ...(mediaTitle ? { title: { text: mediaTitle } } : {}),
            },
          ],
        }
      : {}),
  };

  const body: UGCPost = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": content,
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await fetch(`${LI_API}/ugcPosts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn publish failed (${res.status}): ${err}`);
  }

  // LinkedIn returns the post URN in the x-restli-id header
  const urn = res.headers.get("x-restli-id") || res.headers.get("X-RestLi-Id");
  if (!urn) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`LinkedIn post created but URN not returned. Response: ${JSON.stringify(data)}`);
  }

  return { linkedin_urn: urn };
}

/** Fetch share statistics for a LinkedIn post */
export async function getPostStatistics(
  accessToken: string,
  postUrn: string
): Promise<{ likes: number; comments: number; shares: number; impressions: number }> {
  const encoded = encodeURIComponent(postUrn);
  const res = await fetch(
    `${LI_API}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encoded}&shares[0]=${encoded}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    }
  );

  if (!res.ok) {
    console.error("LinkedIn stats error:", await res.text());
    return { likes: 0, comments: 0, shares: 0, impressions: 0 };
  }

  const data = await res.json();
  const stats = data.elements?.[0]?.totalShareStatistics || {};
  return {
    likes: stats.likeCount || 0,
    comments: stats.commentCount || 0,
    shares: stats.shareCount || 0,
    impressions: stats.impressionCount || 0,
  };
}
