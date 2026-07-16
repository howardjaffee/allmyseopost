import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildAuthUrl, signState } from "./meta.server";

function originFromRequest(): string {
  const explicit = process.env.PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const proto = getRequestHeader("x-forwarded-proto") ?? "https";
  const host = getRequestHeader("x-forwarded-host") ?? getRequestHeader("host");
  return `${proto}://${host}`;
}

export const getMetaAuthUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      throw new Error("Meta app credentials not configured. Add META_APP_ID and META_APP_SECRET.");
    }
    const origin = originFromRequest();
    const state = signState(context.userId);
    return { url: buildAuthUrl(origin, state), redirectUri: `${origin}/api/public/meta/callback` };
  });

export const getSocialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: account }, { data: schedule }, { data: recent }] = await Promise.all([
      context.supabase.from("social_accounts").select("fb_page_id,fb_page_name,ig_user_id,ig_username,token_expires_at,connected_at").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("social_schedules").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("social_post_log").select("id,platform,status,error,external_id,created_at,topic").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(10),
    ]);
    return { account, schedule, recent: recent ?? [] };
  });

export const disconnectMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("social_accounts").delete().eq("user_id", context.userId);
    await context.supabase.from("social_schedules").update({ enabled: false }).eq("user_id", context.userId);
    return { ok: true };
  });

export const saveSocialSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      enabled: z.boolean(),
      post_time_utc: z.string().regex(/^\d{2}:\d{2}$/),
      topics: z.array(z.string().min(2).max(300)).min(1).max(50),
      tone: z.string().max(50).default("engaging"),
      audience: z.string().max(200).default("general audience"),
      cta: z.string().max(200).default(""),
      platforms: z.array(z.enum(["instagram", "facebook"])).min(1),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("social_schedules").upsert({
      user_id: context.userId,
      enabled: data.enabled,
      post_time_utc: data.post_time_utc,
      topics: data.topics,
      tone: data.tone,
      audience: data.audience,
      cta: data.cta,
      platforms: data.platforms,
    }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const runScheduleNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { runAutopostForUser } = await import("./social-autopost.server");
    const result = await runAutopostForUser(context.userId);
    return result;
  });
