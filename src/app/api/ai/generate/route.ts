import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";
import { getAnthropicClient, type GenerateRequest } from "@/lib/ai/claude";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Verify caller is authenticated
    const serverSupabase = await createServerSupabase();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 AI requests per hour per user
    const rateLimit = await checkRateLimit(user.id, "ai/generate", 20);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can make 20 AI requests per hour. Resets at ${rateLimit.resetAt.toLocaleTimeString()}.`,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    const body = (await request.json()) as GenerateRequest;
    const { type, context } = body;

    if (!type || !["caption", "hashtags", "script"].includes(type)) {
      return NextResponse.json({ error: "Invalid type. Must be caption, hashtags, or script" }, { status: 400 });
    }

    // Fetch brand kit for on-brand generation
    const serviceSupabase = createServiceSupabase();
    const { data: brandKit } = await serviceSupabase
      .from("sm_brand_kit")
      .select("voice_style, voice_description, sample_captions, cta_phrases, hashtag_bank, dos, donts")
      .single();

    // Build system prompt from brand kit
    const brandSystem = brandKit
      ? `You are a social media content writer for Houspire, a home improvement platform that helps homeowners plan, manage, and execute renovation and DIY projects using AI.

Brand voice: ${brandKit.voice_style || "Friendly Expert"}
${brandKit.voice_description ? `Voice description: ${brandKit.voice_description}` : ""}
${Array.isArray(brandKit.dos) && brandKit.dos.length ? `Do: ${(brandKit.dos as string[]).join(", ")}` : ""}
${Array.isArray(brandKit.donts) && brandKit.donts.length ? `Don't: ${(brandKit.donts as string[]).join(", ")}` : ""}
${Array.isArray(brandKit.cta_phrases) && brandKit.cta_phrases.length ? `Use CTAs like: ${(brandKit.cta_phrases as string[]).slice(0, 3).join(" | ")}` : ""}
${Array.isArray(brandKit.sample_captions) && brandKit.sample_captions.length ? `Sample captions for reference:\n${(brandKit.sample_captions as string[]).slice(0, 2).map((c: string) => `- ${c}`).join("\n")}` : ""}

Always write for home improvement, renovation, and DIY content. Be practical, inspiring, and on-brand.`
      : "You are a social media content writer for Houspire, a home improvement platform. Be friendly, practical, and inspiring.";

    const anthropic = getAnthropicClient();

    let userPrompt = "";

    if (type === "caption") {
      const platform = context.platform || "instagram";
      userPrompt = `Write a ${platform} caption for the following home improvement content:

Title: ${context.title || "Untitled"}
${context.category ? `Category: ${context.category}` : ""}
${context.topic ? `Topic: ${context.topic}` : ""}
${context.existingCaption ? `Existing draft to improve: ${context.existingCaption}` : ""}

Requirements:
- ${platform === "instagram" ? "Max 2200 characters, use emojis naturally, end with a CTA" : "Professional tone, max 700 characters for LinkedIn"}
- Include 3–5 relevant home improvement hashtags inline
- Match the brand voice exactly
- Focus on practical value, before/after results, or DIY inspiration

Return ONLY the caption text, nothing else.`;
    } else if (type === "hashtags") {
      userPrompt = `Suggest 25 highly relevant hashtags for this home improvement content:

Topic: ${context.topic || context.title || "home improvement"}
Platform: ${context.platform || "instagram"}
Category: ${context.category || "general"}

Requirements:
- Mix of high-volume (#homeimprovement, #DIY, #renovation) and niche tags (#kitchenremodel, #bathroomreno)
- Include project-type specific tags
- Include community tags (#beforeandafter, #homemakeover)
- No banned hashtags
- Return ONLY a space-separated list of hashtags (e.g. #homeimprovement #houspire ...), nothing else.`;
    } else if (type === "script") {
      userPrompt = `Write a short-form video script outline for this home improvement content:

Title: ${context.title || "Untitled"}
Platform: ${context.platform || "instagram"}
${context.topic ? `Topic: ${context.topic}` : ""}

Structure:
- Hook (0–3 sec): attention-grabbing opening line (show the transformation or pose the problem)
- Problem/Context (3–10 sec): the pain point or before state
- Value/Content (10–45 sec): 3–4 key steps or tips (bullet format, action-oriented)
- CTA (45–60 sec): what to do next (save, follow, DM for estimate)

Return a clean script outline. Be punchy, practical, and conversational. No filler.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: brandSystem,
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json(
      { result, type, remaining: rateLimit.remaining },
      {
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
        },
      }
    );
  } catch (err) {
    console.error("AI generate error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
