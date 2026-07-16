// Meta (Facebook + Instagram) Graph API helpers. Server-only.
import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v20.0";
const OAUTH = "https://www.facebook.com/v20.0/dialog/oauth";

export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export function metaRedirectUri(origin: string) {
  return `${origin}/api/public/meta/callback`;
}

function stateSecret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.LOVABLE_API_KEY || "dev-secret";
  return s;
}

export function signState(userId: string) {
  const nonce = Math.random().toString(36).slice(2, 10);
  const payload = `${userId}.${nonce}`;
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
}

export function verifyState(state: string): string | null {
  const parts = state.split(".");
  if (parts.length !== 3) return null;
  const [userId, nonce, sig] = parts;
  const expected = createHmac("sha256", stateSecret()).update(`${userId}.${nonce}`).digest("hex").slice(0, 32);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? userId : null;
  } catch {
    return null;
  }
}

export function buildAuthUrl(origin: string, state: string) {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID is not configured");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: metaRedirectUri(origin),
    state,
    scope: META_SCOPES,
    response_type: "code",
  });
  return `${OAUTH}?${params.toString()}`;
}

async function graphGet<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Graph GET ${path} failed`);
  return json as T;
}

async function graphPost<T = any>(path: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams(params);
  const res = await fetch(`${GRAPH}${path}`, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Graph POST ${path} failed`);
  return json as T;
}

export async function exchangeCodeForToken(code: string, origin: string) {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const short = await graphGet<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: metaRedirectUri(origin),
    code,
  });
  // Exchange for long-lived (~60 day) user token
  const long = await graphGet<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: short.access_token,
  });
  return long;
}

export async function fetchPagesAndIG(userToken: string) {
  const me = await graphGet<{ id: string }>("/me", { access_token: userToken, fields: "id" });
  const pages = await graphGet<{ data: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }> }>(
    "/me/accounts",
    { access_token: userToken, fields: "id,name,access_token,instagram_business_account" },
  );
  const first = pages.data?.[0];
  if (!first) throw new Error("No Facebook Page found. Create a Page and link an Instagram Business account first.");
  let igUserId: string | null = null;
  let igUsername: string | null = null;
  if (first.instagram_business_account?.id) {
    igUserId = first.instagram_business_account.id;
    try {
      const ig = await graphGet<{ username: string }>(`/${igUserId}`, {
        access_token: first.access_token,
        fields: "username",
      });
      igUsername = ig.username;
    } catch {}
  }
  return {
    fb_user_id: me.id,
    fb_page_id: first.id,
    fb_page_name: first.name,
    fb_page_token: first.access_token,
    ig_user_id: igUserId,
    ig_username: igUsername,
  };
}

export async function publishFacebookPhoto(pageId: string, pageToken: string, imageUrl: string, caption: string) {
  const res = await graphPost<{ id?: string; post_id?: string }>(`/${pageId}/photos`, {
    url: imageUrl,
    caption,
    access_token: pageToken,
  });
  return res.post_id ?? res.id ?? "";
}

export async function publishInstagramImage(igUserId: string, pageToken: string, imageUrl: string, caption: string) {
  const container = await graphPost<{ id: string }>(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: pageToken,
  });
  const publish = await graphPost<{ id: string }>(`/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: pageToken,
  });
  return publish.id;
}
