import type { Database } from "@/integrations/supabase/types";

type Article = Database["public"]["Tables"]["articles"]["Row"];
type Site = Database["public"]["Tables"]["sites"]["Row"];

export async function publishPostToWordPress(article: Article, site: Site) {
  if (!site.wp_username || !site.wp_app_password) {
    throw new Error("WordPress username and application password are required for this site.");
  }

  const baseUrl = normalizeSiteUrl(site.url);
  const endpoint = `${baseUrl}/wp-json/wp/v2/posts`;
  const auth = btoa(`${site.wp_username}:${site.wp_app_password.replace(/\s+/g, "")}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: article.title,
      slug: article.slug || undefined,
      content: article.content_html || "",
      excerpt: article.meta_description || undefined,
      status: "publish",
      meta: {
        _seowidpnkj_meta_title: article.meta_title || article.title,
        _seowidpnkj_meta_description: article.meta_description || "",
      },
    }),
  });

  const raw = await response.text();
  let json: Record<string, unknown> = {};
  try {
    json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    json = { message: raw };
  }

  if (!response.ok) {
    const message = String(json.message || json.code || `WordPress returned ${response.status}`);
    throw new Error(message);
  }

  return {
    id: Number(json.id),
    link: typeof json.link === "string" ? json.link : `${baseUrl}/${article.slug ?? ""}`,
  };
}

function normalizeSiteUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}