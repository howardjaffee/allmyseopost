import type { Json } from "@/integrations/supabase/types";

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_IMAGE_GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

export async function generateFeaturedImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(LOVABLE_IMAGE_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Create a high-quality, photorealistic blog featured image (16:9) for an article about: ${prompt}. No text overlay.` }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) return null;
    return { base64: b64, mimeType: "image/png" };
  } catch {
    return null;
  }
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type ChatBody = { model: string; messages: ChatMessage[]; response_format?: { type: "json_object" }; temperature?: number };

export type ArticleDraft = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  outline: Json;
  contentHtml: string;
  faq: Json;
};

export type QualityScore = {
  seo: number;
  readability: number;
  eeat: number;
  originality: number;
  keyword_coverage: number;
  structure: number;
  grammar: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

export type ContentPlanDraft = {
  strategy: Json;
  items: Array<{ day: number; topic: string; primaryKeyword?: string; searchIntent?: string; cluster?: string }>;
};

export async function callContentModel(body: ChatBody) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;
  const errors: string[] = [];

  if (lovableKey) {
    try {
      const res = await fetch(LOVABLE_GATEWAY, {
        method: "POST",
        headers: { "Lovable-API-Key": lovableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ temperature: 0.45, ...body }),
      });
      if (res.ok) {
        const json = await res.json();
        return String(json.choices?.[0]?.message?.content ?? "");
      }
      errors.push(await explainAiError("Lovable AI", res));
    } catch (error) {
      errors.push(`Lovable AI: ${error instanceof Error ? error.message : "request failed"}`);
    }
  } else {
    errors.push("Lovable AI: missing key");
  }

  if (googleKey) {
    try {
      const prompt = body.messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(googleKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: body.temperature ?? 0.45, responseMimeType: "application/json" },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return String(json.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
      }
      errors.push(await explainAiError("Google AI", res));
    } catch (error) {
      errors.push(`Google AI: ${error instanceof Error ? error.message : "request failed"}`);
    }
  } else {
    errors.push("Google AI: missing key");
  }

  throw new Error(`AI generation failed. ${errors.join(" | ")}`);
}

async function explainAiError(provider: string, res: Response) {
  const raw = await res.text();
  if (res.status === 402) return `${provider}: credits or billing unavailable`;
  if (res.status === 429) return `${provider}: rate limited`;
  return `${provider}: ${res.status} ${raw.slice(0, 240)}`;
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("AI returned no JSON data");

  const endChar = cleaned[start] === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(endChar);
  if (end === -1 || end <= start) throw new Error("AI returned incomplete JSON data");

  const jsonText = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    const repaired = jsonText
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    return JSON.parse(repaired) as T;
  }
}

export function normalizeArticleDraft(raw: Partial<ArticleDraft>, primaryKeyword: string): ArticleDraft {
  const title = cleanText(raw.title) || titleCase(primaryKeyword);
  const slug = slugify(raw.slug || title);
  const contentHtml = String(raw.contentHtml || `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(primaryKeyword)}</p>`);

  return {
    title,
    slug,
    metaTitle: clampText(cleanText(raw.metaTitle) || title, 60),
    metaDescription: clampText(cleanText(raw.metaDescription) || stripHtml(contentHtml).slice(0, 155), 160),
    ogTitle: cleanText(raw.ogTitle) || title,
    ogDescription: clampText(cleanText(raw.ogDescription) || stripHtml(contentHtml).slice(0, 155), 200),
    outline: toJson(raw.outline, []),
    contentHtml,
    faq: toJson(raw.faq, []),
  };
}

export function normalizeQualityScore(raw: Partial<QualityScore>, html: string, primaryKeyword: string): QualityScore {
  const fallback = scoreLocally(html, primaryKeyword);
  return {
    seo: clampScore(raw.seo, 25, fallback.seo),
    readability: clampScore(raw.readability, 20, fallback.readability),
    eeat: clampScore(raw.eeat, 20, fallback.eeat),
    originality: clampScore(raw.originality, 15, fallback.originality),
    keyword_coverage: clampScore(raw.keyword_coverage, 10, fallback.keyword_coverage),
    structure: clampScore(raw.structure, 5, fallback.structure),
    grammar: clampScore(raw.grammar, 5, fallback.grammar),
    strengths: normalizeStringArray(raw.strengths, fallback.strengths),
    weaknesses: normalizeStringArray(raw.weaknesses, fallback.weaknesses),
    recommendations: normalizeStringArray(raw.recommendations, fallback.recommendations),
  };
}

export function scoreLocally(html: string, primaryKeyword: string): QualityScore {
  const text = stripHtml(html).toLowerCase();
  const keyword = primaryKeyword.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  const hasFaq = /<h2[^>]*>\s*faq|frequently asked/i.test(html);
  const keywordUses = keyword ? (text.match(new RegExp(escapeRegExp(keyword), "g")) ?? []).length : 0;
  return {
    seo: Math.min(25, 12 + (keywordUses > 0 ? 5 : 0) + (h2Count >= 3 ? 4 : 0) + (hasFaq ? 4 : 0)),
    readability: Math.min(20, words > 700 ? 16 : 13),
    eeat: Math.min(20, /expert|experience|research|data|example|case/i.test(text) ? 17 : 14),
    originality: 13,
    keyword_coverage: Math.min(10, keywordUses >= 3 ? 9 : keywordUses > 0 ? 7 : 4),
    structure: Math.min(5, h2Count >= 3 ? 5 : 3),
    grammar: 4,
    strengths: ["Clear structure", "Search intent covered", "Ready for editorial review"],
    weaknesses: words < 700 ? ["Article is shorter than ideal for competitive SEO"] : ["Add first-hand examples before publishing if available"],
    recommendations: ["Add internal links to related posts", "Review facts and brand voice before publishing"],
  };
}

export function addRelatedLinks(html: string, related: Array<{ title: string; url: string }>) {
  if (!related.length || /Related reading/i.test(html)) return html;
  const links = related
    .slice(0, 5)
    .map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></li>`)
    .join("");
  return `${html}\n<h2>Related reading</h2><ul>${links}</ul>`;
}

export function normalizePlanDraft(raw: Partial<ContentPlanDraft>, durationDays: number, fallbackKeyword: string): ContentPlanDraft {
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems.slice(0, durationDays).map((item, index) => ({
    day: Number(item.day) || index + 1,
    topic: cleanText(item.topic) || `${titleCase(fallbackKeyword)} guide ${index + 1}`,
    primaryKeyword: cleanText(item.primaryKeyword) || fallbackKeyword,
    searchIntent: cleanText(item.searchIntent) || "informational",
    cluster: cleanText(item.cluster) || "SEO cluster",
  }));
  return {
    strategy: toJson(raw.strategy, { pillars: [], frequency: "Daily", internalLinkingStrategy: "Link related articles by cluster." }),
    items,
  };
}

export function splitKeywords(value: string) {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function toJson(value: unknown, fallback: Json): Json {
  if (value == null) return fallback;
  try {
    JSON.stringify(value);
    return value as Json;
  } catch {
    return fallback;
  }
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 8) : fallback;
}

function clampScore(value: unknown, max: number, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(max, Math.round(n)));
}

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function clampText(value: string, length: number) {
  return value.length > length ? value.slice(0, length - 1).trimEnd() : value;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "article";
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}