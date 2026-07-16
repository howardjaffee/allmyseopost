import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { publishPostToWordPress } from "./wordpress.server";

export const publishArticleToWordPress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      articleId: z.string().uuid(),
      siteId: z.string().uuid().optional().nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", data.articleId)
      .single();
    if (articleError || !article) throw new Error(articleError?.message || "Article not found");

    const targetSiteId = data.siteId ?? article.site_id;
    if (!targetSiteId) throw new Error("Select a WordPress site before publishing.");

    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", targetSiteId)
      .single();
    if (siteError || !site) throw new Error(siteError?.message || "WordPress site not found");

    const published = await publishPostToWordPress(article, site);

    const { error: updateError } = await supabase
      .from("articles")
      .update({
        site_id: site.id,
        status: "published",
        wp_post_id: published.id,
        published_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", article.id);
    if (updateError) throw new Error(updateError.message);

    return published;
  });