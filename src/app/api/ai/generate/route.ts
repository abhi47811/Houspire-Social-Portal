import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";
import { getAnthropicClient, type GenerateRequest } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    // Verify caller is authenticated
    const serverSupabase = createServerSupabase();
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      ? `You are a social media content writer for Houspire, a real estate brand.

Brand voice: ${brandKit.voice_style || "professional and friendly"}
${brandKit.voice_description ? `Voice description: ${brandKit.voice_description}` : ""}
${brandKit.dos?.length ? `Do: ${(brandKit.dos as string[]).join(", ")}` : ""}
${brandKit.donts?.length ? `Don't: ${(brandKit.donts as string[]).join(", ")}` : ""}
${brandKit.cta_phrases?.length ? `Use CTAs like: ${(brandKit.cta_phrases as string[]).slice(0, 3).join(" | ")}` : ""}
${brandKit.sample_captions?.length ? `Sample captions for reference:\n${(brandKit.sample_captions as string[]).slice(0, 2).map((c: string) => `- ${c}`).join("\n")}` : ""}

Always write for real estate / property content. Be concise, engaging, and on-brand.`
      : "You are a social media content writer for Houspire, a real estate brand. Be professional, friendly, and engaging.";

    const anthropic = getAnthropicClient();

    let userPrompt = "";

    if (type === "caption") {
      const platform = context.platform || "instagram";
      userPrompt = `Write a ${platform} caption for the following content:

Title: ${context.title || "Untitled"}
${context.category ? `Category: ${context.category}` : ""}
${context.topic ? `Topic: ${context.topic}` : ""}
${context.existingCaption ? `Existing draft to improve: ${context.existingCaption}` : ""}

Requirements:
- ${platform === "instagram" ? "Max 2200 characters, use emojis naturally, end with a CTA" : "Professional tone, max 700 characters for LinkedIn"}
- Include 3–5 relevant hashtags inline
- Match the brand voice exactly

Return ONLY the caption text, nothing else.`;
    } else if (type === "hashtags") {
      userPrompt = `Suggest 25 highly relevant hashtags for this real estate content:

Topic: ${context.topic || context.title || "real estate"}
Platform: ${context.platform || "instagram"}
Category: ${context.category || "general"}

Requirements:
- Mix of high-volume (#realestate, #property) and niche tags (#houstonrealestate)
- Include location-specific tags where relevant
- No banned hashtags
- Return ONLY a space-separated list of hashtags (e.g. #realestate #houspire ...), nothing else.`;
    } else if (type === "script") {
      userPrompt = `Write a short-form video script outline for this real estate content:

Title: ${context.title || "Untitled"}
Platform: ${context.platform || "instagram"}
${context.topic ? `Topic: ${context.topic}` : ""}

Structure:
- Hook (0–3 sec): attention-grabbing opening line
- Problem/Context (3–10 sec): what pain point or insight you're addressing
- Value/Content (10–45 sec): 3–4 key talking points (bullet format)
- CTA (45–60 sec): what to do next

Return a clean script outline. Be punchy and conversational. No filler.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: brandSystem,
      messages: [{ role: "user", content: userPrompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ result, type });
  } catch (err) {
    console.error("AI generate error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
