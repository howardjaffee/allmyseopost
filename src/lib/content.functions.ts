import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Rate limited. Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to your workspace.");
  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const generateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      primaryKeyword: z.string().min(2).max(200),
      secondaryKeywords: z.string().max(500).optional().default(""),
      tone: z.string().max(50).default("professional"),
      wordCount: z.number().int().min(300).max(4000).default(1500),
      targetCountry: z.string().max(80).default("Global"),
      audience: z.string().max(200).default("general readers"),
      searchIntent: z.string().max(80).default("informational"),
      siteId: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const system = `You are an elite SEO content writer. Produce EEAT-optimized, human-like articles with clear structure: H1, intro, H2 sections with H3 subsections, bullet lists, tables where useful, FAQ, and a CTA. Output strictly valid JSON.`;
    const user = `Write a ~${data.wordCount}-word SEO article.
Primary keyword: ${data.primaryKeyword}
Secondary keywords: ${data.secondaryKeywords || "(infer)"}
Tone: ${data.tone}
Target country: ${data.targetCountry}
Audience: ${data.audience}
Search intent: ${data.searchIntent}

Return JSON with this exact shape:
{
  "title": string,
  "slug": string,
  "metaTitle": string (<=60 chars),
  "metaDescription": string (<=160 chars),
  "ogTitle": string,
  "ogDescription": string,
  "outline": [{"heading": string, "subheadings": string[]}],
  "contentHtml": string (full HTML with <h1>,<h2>,<h3>,<p>,<ul>,<ol>,<table>),
  "faq": [{"q": string, "a": string}]
}`;

    const aiRes = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });

    const text = aiRes.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(text); } catch { throw new Error("AI returned invalid JSON"); }

    // Score the article
    const scoreSystem = `You are a strict SEO content quality grader. Output ONLY JSON.`;
    const scoreUser = `Grade this article on the 100-point Seowidpnkj scale.
Categories (max points): seo(25), readability(20), eeat(20), originality(15), keyword_coverage(10), structure(5), grammar(5).
Primary keyword: ${data.primaryKeyword}
Article HTML: ${(parsed.contentHtml as string ?? "").slice(0, 8000)}

Return: {"seo":n,"readability":n,"eeat":n,"originality":n,"keyword_coverage":n,"structure":n,"grammar":n,"strengths":string[],"weaknesses":string[],"recommendations":string[]}`;

    const scoreRes = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: scoreSystem }, { role: "user", content: scoreUser }],
      response_format: { type: "json_object" },
    });
    const scoreText = scoreRes.choices?.[0]?.message?.content ?? "{}";
    const score = JSON.parse(scoreText) as Record<string, number | string[]>;

    const overall =
      (Number(score.seo) || 0) +
      (Number(score.readability) || 0) +
      (Number(score.eeat) || 0) +
      (Number(score.originality) || 0) +
      (Number(score.keyword_coverage) || 0) +
      (Number(score.structure) || 0) +
      (Number(score.grammar) || 0);
    const tier = overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "E";

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        user_id: userId,
        site_id: data.siteId ?? null,
        title: String(parsed.title ?? data.primaryKeyword),
        slug: String(parsed.slug ?? ""),
        primary_keyword: data.primaryKeyword,
        secondary_keywords: data.secondaryKeywords ? data.secondaryKeywords.split(",").map((s) => s.trim()) : [],
        tone: data.tone,
        word_count: data.wordCount,
        target_country: data.targetCountry,
        search_intent: data.searchIntent,
        content_html: String(parsed.contentHtml ?? ""),
        meta_title: String(parsed.metaTitle ?? ""),
        meta_description: String(parsed.metaDescription ?? ""),
        og_title: String(parsed.ogTitle ?? ""),
        og_description: String(parsed.ogDescription ?? ""),
        outline: parsed.outline ?? [],
        faq: parsed.faq ?? [],
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("quality_scores").insert({
      article_id: article.id,
      user_id: userId,
      overall,
      seo: Number(score.seo) || 0,
      readability: Number(score.readability) || 0,
      eeat: Number(score.eeat) || 0,
      originality: Number(score.originality) || 0,
      keyword_coverage: Number(score.keyword_coverage) || 0,
      structure: Number(score.structure) || 0,
      grammar: Number(score.grammar) || 0,
      tier,
      strengths: (score.strengths as string[]) ?? [],
      weaknesses: (score.weaknesses as string[]) ?? [],
      recommendations: (score.recommendations as string[]) ?? [],
    });

    return { articleId: article.id, overall, tier };
  });

export const generateContentPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      siteId: z.string().uuid().optional().nullable(),
      title: z.string().min(2).max(200),
      durationDays: z.union([z.literal(7), z.literal(30), z.literal(60), z.literal(90)]),
      niche: z.string().max(200),
      targetCountry: z.string().max(80),
      audience: z.string().max(300),
      primaryKeywords: z.string().max(1000),
      secondaryKeywords: z.string().max(1000).optional().default(""),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const system = `You are an SEO content strategist. Build a publication-ready content calendar. Output ONLY JSON.`;
    const user = `Build a ${data.durationDays}-day content plan.
Niche: ${data.niche}
Country: ${data.targetCountry}
Audience: ${data.audience}
Primary keywords: ${data.primaryKeywords}
Secondary keywords: ${data.secondaryKeywords || "(infer)"}

Return: {
  "strategy": { "pillars": string[], "frequency": string, "internalLinkingStrategy": string },
  "items": [{ "day": 1, "topic": string, "primaryKeyword": string, "searchIntent": string, "cluster": string }, ... up to ${data.durationDays}]
}`;
    const ai = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(ai.choices?.[0]?.message?.content ?? "{}") as {
      strategy?: unknown; items?: Array<{ day: number; topic: string; primaryKeyword?: string; searchIntent?: string; cluster?: string }>;
    };

    const { data: plan, error } = await supabase.from("content_plans").insert({
      user_id: userId,
      site_id: data.siteId ?? null,
      title: data.title,
      duration_days: data.durationDays,
      niche: data.niche,
      target_country: data.targetCountry,
      target_audience: data.audience,
      primary_keywords: data.primaryKeywords.split(",").map((s) => s.trim()),
      secondary_keywords: data.secondaryKeywords ? data.secondaryKeywords.split(",").map((s) => s.trim()) : [],
      strategy: parsed.strategy ?? {},
    }).select().single();
    if (error) throw new Error(error.message);

    const items = (parsed.items ?? []).slice(0, data.durationDays);
    if (items.length) {
      const today = new Date();
      const rows = items.map((it) => {
        const d = new Date(today); d.setDate(today.getDate() + (it.day - 1));
        return {
          plan_id: plan.id,
          user_id: userId,
          day_number: it.day,
          scheduled_date: d.toISOString().slice(0, 10),
          topic: it.topic,
          primary_keyword: it.primaryKeyword ?? "",
          search_intent: it.searchIntent ?? "informational",
          cluster: it.cluster ?? "",
          status: "pending",
        };
      });
      await supabase.from("content_plan_items").insert(rows);
    }

    return { planId: plan.id, itemCount: items.length };
  });
