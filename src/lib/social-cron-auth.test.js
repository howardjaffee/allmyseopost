import { test, expect } from "bun:test";
import { authenticateCronRequest } from "../integrations/supabase/cron-auth";

test("a public API key cannot authorize automatic social publishing", async () => {
  const result = await authenticateCronRequest(new Request("https://example.test/api/public/hooks/social-autopost", {
    method: "POST", headers: { apikey: "public-test-key" },
  }));
  expect(result?.status).toBe(process.env.LOVABLE_CRON_SECRET ? 401 : 500);
});

test("the managed scheduler credential authorizes the publishing callback", async () => {
  const configured = process.env.LOVABLE_CRON_SECRET;
  if (!configured) throw new Error("Managed scheduling is not configured");
  const result = await authenticateCronRequest(new Request("https://example.test/api/public/hooks/social-autopost", {
    method: "POST", headers: { authorization: `Bearer ${configured}` },
  }));
  expect(result).toBeNull();
});