import type { Database } from "@/integrations/supabase/types";

type Article = Database["public"]["Tables"]["articles"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];

function wpAuth(site: Site) {
  if (!site.wp_username || !site.wp_app_password) {
    throw new Error("WordPress username and application password are required for this site.");
  }
  return "Basic " + btoa(`${site.wp_username}:${site.wp_app_password.replace(/\s+/g, "")}`);
}

function normalizeSiteUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export async function uploadImageToWordPress(
  site: Site,
  image: {
    base64: string;
    mimeType: string;
    filename: string;
    altText?: string;
    title?: string;
    caption?: string;
    description?: string;
  },
): Promise<{ id: number; source_url: string }> {
  const baseUrl = normalizeSiteUrl(site.url);
  const bin = Uint8Array.from(atob(image.base64), (c) => c.charCodeAt(0));
  const res = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: wpAuth(site),
      "Content-Type": image.mimeType,
      "Content-Disposition": `attachment; filename="${image.filename}"`,
    },
    body: bin,
  });
  const raw = await res.text();
  let json: Record<string, unknown> = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch { json = { message: raw }; }
  if (!res.ok) throw new Error(String(json.message || `WordPress media upload failed (${res.status})`));
  const id = Number(json.id);
  const source_url = typeof json.source_url === "string" ? json.source_url : "";
  if (id) {
    const meta: Record<string, string> = {};
    if (image.altText) meta.alt_text = image.altText;
    if (image.title) meta.title = image.title;
    if (image.caption) meta.caption = image.caption;
    if (image.description) meta.description = image.description;
    if (Object.keys(meta).length) {
      await fetch(`${baseUrl}/wp-json/wp/v2/media/${id}`, {
        method: "POST",
        headers: { Authorization: wpAuth(site), "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      }).catch(() => {});
    }
  }
  return { id, source_url };
}

export async function publishPostToWordPress(
  article: Article,
  site: Site,
  options: { featuredMediaId?: number } = {},
) {
  const baseUrl = normalizeSiteUrl(site.url);
  const metaTitle = article.meta_title || article.title;
  const metaDesc = article.meta_description || "";
  const seoMeta: Record<string, string> = {
    // Yoast SEO
    _yoast_wpseo_title: metaTitle,
    _yoast_wpseo_metadesc: metaDesc,
    _yoast_wpseo_opengraph_title: article.og_title || metaTitle,
    _yoast_wpseo_opengraph_description: article.og_description || metaDesc,
    _yoast_wpseo_twitter_title: article.og_title || metaTitle,
    _yoast_wpseo_twitter_description: article.og_description || metaDesc,
    // Rank Math
    rank_math_title: metaTitle,
    rank_math_description: metaDesc,
    rank_math_facebook_title: article.og_title || metaTitle,
    rank_math_facebook_description: article.og_description || metaDesc,
    rank_math_twitter_title: article.og_title || metaTitle,
    rank_math_twitter_description: article.og_description || metaDesc,
  };
  const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: { Authorization: wpAuth(site), "Content-Type": "application/json" },
    body: JSON.stringify({
      title: article.title,
      slug: article.slug || undefined,
      content: article.content_html || "",
      excerpt: article.meta_description || undefined,
      status: "publish",
      featured_media: options.featuredMediaId || undefined,
      meta: seoMeta,
    }),
  });
  const raw = await res.text();
  let json: Record<string, unknown> = {};
  try { json = raw ? JSON.parse(raw) : {}; } catch { json = { message: raw }; }
  if (!res.ok) throw new Error(String(json.message || json.code || `WordPress returned ${res.status}`));
  return {
    id: Number(json.id),
    link: typeof json.link === "string" ? json.link : `${baseUrl}/${article.slug ?? ""}`,
  };
}
