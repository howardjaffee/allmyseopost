import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import {
  addRelatedLinks,
  callContentModel,
  generateFeaturedImage,
  generateImageMetadata,
  normalizeArticleDraft,
  normalizePlanDraft,
  normalizeQualityScore,
  parseJsonResponse,
  scoreLocally,
  splitKeywords,
  type ArticleDraft,
  type ContentPlanDraft,
  type ImageMetadata,
  type QualityScore,
} from "./ai-content.server";
import { publishPostToWordPress, uploadImageToWordPress } from "./wordpress.server";

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
      autoPublish: z.boolean().optional().default(false),
      includeImage: z.boolean().optional().default(true),
      minQuality: z.number().int().min(0).max(100).optional().default(75),
      maxAttempts: z.number().int().min(1).max(5).optional().default(3),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const system = `You are an elite SEO content writer. Produce EEAT-optimized, human-like articles with clear structure: H1, intro, H2 sections with H3 subsections, bullet lists, tables where useful, FAQ, and a CTA. Output strictly valid JSON.`;
    const buildUserPrompt = (attempt: number, prevWeaknesses: string[]) => `Write a ~${data.wordCount}-word SEO article.
Primary keyword: ${data.primaryKeyword}
Secondary keywords: ${data.secondaryKeywords || "(infer)"}
Tone: ${data.tone}
Target country: ${data.targetCountry}
Audience: ${data.audience}
Search intent: ${data.searchIntent}
${attempt > 1 && prevWeaknesses.length ? `\nPREVIOUS ATTEMPT FELL BELOW QUALITY THRESHOLD. Fix these weaknesses:\n- ${prevWeaknesses.slice(0, 8).join("\n- ")}\nAim for stronger EEAT signals, richer structure, and complete keyword coverage.\n` : ""}
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

    // Generation + scoring loop — auto-regenerate when below quality threshold.
    let parsed!: ArticleDraft;
    let contentHtml = "";
    let score!: QualityScore;
    let overall = 0;
    let tier = "E";
    let attempts = 0;
    let best: { parsed: ArticleDraft; contentHtml: string; score: QualityScore; overall: number; tier: string } | null = null;
    let prevWeaknesses: string[] = [];
    const attemptSummaries: AttemptSummary[] = [];

    for (let attempt = 1; attempt <= data.maxAttempts; attempt++) {
      attempts = attempt;
      const aiText = await callContentModel({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: buildUserPrompt(attempt, prevWeaknesses) },
        ],
        response_format: { type: "json_object" },
      });

      parsed = normalizeArticleDraft(parseJsonResponse<Partial<ArticleDraft>>(aiText), data.primaryKeyword);
      contentHtml = parsed.contentHtml;

      if (data.siteId) {
        const { data: site } = await supabase.from("sites").select("url").eq("id", data.siteId).single();
        const { data: relatedArticles } = await supabase
          .from("articles")
          .select("title,slug")
          .eq("site_id", data.siteId)
          .eq("status", "published")
          .not("slug", "is", null)
          .order("created_at", { ascending: false })
          .limit(5);
        const siteUrl = site?.url ? site.url.replace(/\/$/, "") : "";
        const related = (relatedArticles ?? [])
          .filter((item) => item.slug)
          .map((item) => ({ title: item.title, url: `${siteUrl}/${item.slug}` }));
        contentHtml = addRelatedLinks(contentHtml, related);
      }

      // Score
      const scoreSystem = `You are a strict SEO content quality grader. Output ONLY JSON.`;
      const scoreUser = `Grade this article on the 100-point Seowidpnkj scale.
Categories (max points): seo(25), readability(20), eeat(20), originality(15), keyword_coverage(10), structure(5), grammar(5).
Primary keyword: ${data.primaryKeyword}
Article HTML: ${contentHtml.slice(0, 8000)}

Return: {"seo":n,"readability":n,"eeat":n,"originality":n,"keyword_coverage":n,"structure":n,"grammar":n,"strengths":string[],"weaknesses":string[],"recommendations":string[]}`;

      try {
        const scoreText = await callContentModel({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: scoreSystem }, { role: "user", content: scoreUser }],
          response_format: { type: "json_object" },
        });
        score = normalizeQualityScore(parseJsonResponse<Partial<QualityScore>>(scoreText), contentHtml, data.primaryKeyword);
      } catch {
        score = scoreLocally(contentHtml, data.primaryKeyword);
      }

      overall =
        (Number(score.seo) || 0) +
        (Number(score.readability) || 0) +
        (Number(score.eeat) || 0) +
        (Number(score.originality) || 0) +
        (Number(score.keyword_coverage) || 0) +
        (Number(score.structure) || 0) +
        (Number(score.grammar) || 0);
      tier = overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "E";

      if (!best || overall > best.overall) {
        best = { parsed, contentHtml, score, overall, tier };
      }
      if (overall >= data.minQuality) break;
      prevWeaknesses = score.weaknesses ?? [];
    }

    // Keep the best-scoring attempt (may equal the last one).
    if (best) {
      parsed = best.parsed;
      contentHtml = best.contentHtml;
      score = best.score;
      overall = best.overall;
      tier = best.tier;
    }
    const regenerated = attempts > 1;
    const belowThreshold = overall < data.minQuality;


    // Generate featured image (best-effort) + SEO metadata
    let featuredImage: { base64: string; mimeType: string } | null = null;
    let imageMeta: ImageMetadata | null = null;
    if (data.includeImage) {
      [featuredImage, imageMeta] = await Promise.all([
        generateFeaturedImage(`${parsed.title}. ${data.primaryKeyword}`),
        generateImageMetadata({
          articleTitle: parsed.title,
          primaryKeyword: data.primaryKeyword,
          metaDescription: parsed.metaDescription,
          slug: parsed.slug,
        }),
      ]);
    }

    // Optional: upload image + publish to WordPress in one shot
    let wpMediaId: number | undefined;
    let featuredImageUrl: string | null = null;
    let wpPostId: number | null = null;
    let publishedAt: string | null = null;
    let publishError: string | null = null;
    let site: Database["public"]["Tables"]["sites"]["Row"] | null = null;

    if (data.autoPublish && data.siteId) {
      const { data: siteRow, error: siteErr } = await supabase
        .from("sites").select("*").eq("id", data.siteId).single();
      if (siteErr || !siteRow) throw new Error(siteErr?.message || "Site not found");
      site = siteRow;
      try {
        if (featuredImage && imageMeta) {
          const uploaded = await uploadImageToWordPress(site, {
            base64: featuredImage.base64,
            mimeType: featuredImage.mimeType,
            filename: imageMeta.filename,
            altText: imageMeta.altText,
            title: imageMeta.title,
            caption: imageMeta.caption,
            description: imageMeta.description,
          });
          wpMediaId = uploaded.id;
          featuredImageUrl = uploaded.source_url || null;
          if (featuredImageUrl && !/<img\s/i.test(contentHtml)) {
            contentHtml = `<figure><img src="${featuredImageUrl}" alt="${imageMeta.altText.replace(/"/g, "&quot;")}" /><figcaption>${imageMeta.caption.replace(/</g, "&lt;")}</figcaption></figure>\n${contentHtml}`;
          }
        }
      } catch (e) {
        publishError = `Image upload failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    const { data: article, error } = await supabase
      .from("articles")
      .insert({
        user_id: userId,
        site_id: data.siteId ?? null,
        title: parsed.title,
        slug: parsed.slug,
        primary_keyword: data.primaryKeyword,
        secondary_keywords: splitKeywords(data.secondaryKeywords),
        tone: data.tone,
        word_count: data.wordCount,
        target_country: data.targetCountry,
        search_intent: data.searchIntent,
        content_html: contentHtml,
        meta_title: parsed.metaTitle,
        meta_description: parsed.metaDescription,
        og_title: parsed.ogTitle,
        og_description: parsed.ogDescription,
        outline: parsed.outline,
        faq: parsed.faq,
        featured_image_url: featuredImageUrl,
        status: "draft",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.autoPublish && site) {
      try {
        const published = await publishPostToWordPress(article, site, { featuredMediaId: wpMediaId });
        wpPostId = published.id;
        publishedAt = new Date().toISOString();
        await supabase.from("articles").update({
          status: "published",
          wp_post_id: wpPostId,
          published_at: publishedAt,
          error: null,
        }).eq("id", article.id);
      } catch (e) {
        publishError = `Publish failed: ${e instanceof Error ? e.message : String(e)}`;
        await supabase.from("articles").update({ error: publishError }).eq("id", article.id);
      }
    }

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
      strengths: score.strengths,
      weaknesses: score.weaknesses,
      recommendations: score.recommendations,
    });

    return {
      articleId: article.id,
      overall,
      tier,
      published: !!wpPostId,
      wpPostId,
      featuredImageUrl,
      publishError,
      attempts,
      regenerated,
      belowThreshold,
      minQuality: data.minQuality,
    };
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
    const aiText = await callContentModel({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    });
    const parsed = normalizePlanDraft(parseJsonResponse<Partial<ContentPlanDraft>>(aiText), data.durationDays, splitKeywords(data.primaryKeywords)[0] ?? data.niche);

    const { data: plan, error } = await supabase.from("content_plans").insert({
      user_id: userId,
      site_id: data.siteId ?? null,
      title: data.title,
      duration_days: data.durationDays,
      niche: data.niche,
      target_country: data.targetCountry,
      target_audience: data.audience,
      primary_keywords: splitKeywords(data.primaryKeywords),
      secondary_keywords: splitKeywords(data.secondaryKeywords),
      strategy: parsed.strategy,
    }).select().single();
    if (error) throw new Error(error.message);

    const items = parsed.items.slice(0, data.durationDays);
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
