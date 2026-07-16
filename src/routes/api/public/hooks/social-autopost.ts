import { createFileRoute } from "@tanstack/react-router";

// Cron endpoint: pg_cron hits this every 5 minutes. For each enabled schedule
// where post_time_utc is within the last 5 UTC minutes AND we haven't already
// run today (UTC), invoke the autopost pipeline.
export const Route = createFileRoute("/api/public/hooks/social-autopost")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!auth || !expected || auth !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runAutopostForUser } = await import("@/lib/social-autopost.server");

        const now = new Date();
        const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
        const todayUtc = now.toISOString().slice(0, 10);

        const { data: schedules, error } = await supabaseAdmin
          .from("social_schedules")
          .select("user_id,post_time_utc,last_run_at,enabled")
          .eq("enabled", true);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        const due = (schedules ?? []).filter((s) => {
          const [h, m] = String(s.post_time_utc ?? "").split(":").map(Number);
          if (Number.isNaN(h) || Number.isNaN(m)) return false;
          const target = h * 60 + m;
          // 6-minute window (cron runs every 5)
          if (nowMin < target || nowMin - target > 6) return false;
          if (s.last_run_at && String(s.last_run_at).slice(0, 10) === todayUtc) return false;
          return true;
        });

        const results = [];
        for (const s of due) {
          try {
            const r = await runAutopostForUser(s.user_id);
            results.push({ user_id: s.user_id, ok: true, topic: r.topic });
          } catch (e) {
            results.push({ user_id: s.user_id, ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        return Response.json({ ran: results.length, results });
      },
    },
  },
});
