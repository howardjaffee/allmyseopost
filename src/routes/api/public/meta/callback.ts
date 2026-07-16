import { createFileRoute } from "@tanstack/react-router";
import { exchangeCodeForToken, fetchPagesAndIG, verifyState } from "@/lib/meta.server";

export const Route = createFileRoute("/api/public/meta/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error_description") ?? url.searchParams.get("error");
        const origin = `${url.protocol}//${url.host}`;
        const redirectTo = (msg: string, ok = false) => {
          const params = new URLSearchParams({ [ok ? "meta_ok" : "meta_error"]: msg });
          return new Response(null, { status: 302, headers: { Location: `/social-schedule?${params.toString()}` } });
        };
        if (errorParam) return redirectTo(errorParam);
        if (!code || !state) return redirectTo("Missing code or state");
        const userId = verifyState(state);
        if (!userId) return redirectTo("Invalid state");
        try {
          const token = await exchangeCodeForToken(code, origin);
          const info = await fetchPagesAndIG(token.access_token);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
          const { error } = await supabaseAdmin.from("social_accounts").upsert({
            user_id: userId,
            fb_user_id: info.fb_user_id,
            fb_user_token: token.access_token,
            fb_page_id: info.fb_page_id,
            fb_page_name: info.fb_page_name,
            fb_page_token: info.fb_page_token,
            ig_user_id: info.ig_user_id,
            ig_username: info.ig_username,
            token_expires_at: expiresAt,
          }, { onConflict: "user_id" });
          if (error) throw error;
          return redirectTo(info.ig_username ? `Connected ${info.fb_page_name} + @${info.ig_username}` : `Connected ${info.fb_page_name}`, true);
        } catch (e) {
          return redirectTo(e instanceof Error ? e.message : "OAuth failed");
        }
      },
    },
  },
});
