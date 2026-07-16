// Runs the autopost pipeline for one user. Server-only; uses admin client.
import { generateSocialImage } from "./ai-content.server";
import { publishFacebookPhoto, publishInstagramImage } from "./meta.server";

type Platform = "instagram" | "facebook";

async function generateCaption(topic: string, tone: string, audience: string, cta: string, platforms: Platform[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const system = "You are a viral social media copywriter. Output ONLY JSON.";
  const user = `Write scroll-stopping ${platforms.join(" and ")} post(s) about: ${topic}
Tone: ${tone}. Audience: ${audience}. ${cta ? `CTA: ${cta}` : ""}

Return JSON:
{"posts":[{"platform":"instagram"|"facebook","caption":"hook + body + CTA with emojis","hashtags":["no hash symbol"],"imagePrompt":"vivid one-sentence visual description"}]}`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI caption failed: ${res.status}`);
  const json = await res.json();
  const raw = json?.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed.posts) ? parsed.posts : [];
}

export async function runAutopostForUser(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: schedule, error: schedErr } = await supabaseAdmin
    .from("social_schedules").select("*").eq("user_id", userId).maybeSingle();
  if (schedErr) throw schedErr;
  if (!schedule) throw new Error("No schedule configured");

  const { data: account } = await supabaseAdmin
    .from("social_accounts").select("*").eq("user_id", userId).maybeSingle();
  if (!account?.fb_page_token) throw new Error("Meta not connected");

  const topics = Array.isArray(schedule.topics) ? (schedule.topics as string[]) : [];
  if (topics.length === 0) throw new Error("No topics configured");
  const platforms = (Array.isArray(schedule.platforms) ? schedule.platforms : ["instagram", "facebook"]) as Platform[];
  const idx = ((schedule.next_topic_index ?? 0) % topics.length + topics.length) % topics.length;
  const topic = topics[idx];

  const posts = await generateCaption(topic, schedule.tone, schedule.audience, schedule.cta ?? "", platforms);

  const results: Array<{ platform: Platform; ok: boolean; externalId?: string; error?: string }> = [];

  for (const platform of platforms) {
    const match = posts.find((p: any) => p.platform === platform) ?? posts[0] ?? {};
    const caption = String(match.caption ?? topic).trim();
    const hashtags: string[] = Array.isArray(match.hashtags) ? match.hashtags.map((h: any) => String(h).replace(/^#/, "")).filter(Boolean) : [];
    const fullCaption = hashtags.length ? `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}` : caption;
    const imagePrompt = String(match.imagePrompt ?? topic);

    let imageUrl = "";
    try {
      const img = await generateSocialImage(imagePrompt, platform);
      if (!img) throw new Error("Image generation failed");
      const bytes = Uint8Array.from(atob(img.base64), (c) => c.charCodeAt(0));
      const path = `${userId}/${Date.now()}-${platform}.png`;
      const { error: upErr } = await supabaseAdmin.storage.from("social-media").upload(path, bytes, { contentType: img.mimeType, upsert: false });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabaseAdmin.storage.from("social-media").createSignedUrl(path, 60 * 60 * 24);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Signed URL failed");
      imageUrl = signed.signedUrl;
    } catch (e) {
      results.push({ platform, ok: false, error: e instanceof Error ? e.message : String(e) });
      await supabaseAdmin.from("social_post_log").insert({ user_id: userId, platform, topic, caption: fullCaption, image_url: null, status: "failed", error: String(e instanceof Error ? e.message : e) });
      continue;
    }

    try {
      let externalId = "";
      if (platform === "facebook") {
        externalId = await publishFacebookPhoto(account.fb_page_id!, account.fb_page_token!, imageUrl, fullCaption);
      } else {
        if (!account.ig_user_id) throw new Error("Instagram Business account not linked to this Page");
        externalId = await publishInstagramImage(account.ig_user_id, account.fb_page_token!, imageUrl, fullCaption);
      }
      results.push({ platform, ok: true, externalId });
      await supabaseAdmin.from("social_post_log").insert({ user_id: userId, platform, topic, caption: fullCaption, image_url: imageUrl, external_id: externalId, status: "published" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ platform, ok: false, error: msg });
      await supabaseAdmin.from("social_post_log").insert({ user_id: userId, platform, topic, caption: fullCaption, image_url: imageUrl, status: "failed", error: msg });
    }
  }

  const anyOk = results.some((r) => r.ok);
  await supabaseAdmin.from("social_schedules").update({
    next_topic_index: (idx + 1) % topics.length,
    last_run_at: new Date().toISOString(),
    last_status: anyOk ? "success" : "failed",
    last_error: anyOk ? null : results.map((r) => `${r.platform}: ${r.error}`).join(" | "),
  }).eq("user_id", userId);

  return { topic, results };
}
