import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { KEYWORD_MARKETS, mergeKeywordReports, parseKeywordReport, type KeywordMarket, type KeywordMetric } from "./keyword-metrics";

const input = z.object({
  phrase: z.string().trim().min(1).max(200).refine((s) => !/[;\n\r]/.test(s), "Enter one keyword or topic."),
  database: z.string().refine((s) => s in KEYWORD_MARKETS).transform((s) => s as KeywordMarket),
});

export const researchKeywords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(input)
  .handler(async ({ data }) => {
    const gatewayKey = process.env.LOVABLE_API_KEY;
    const connectionKey = process.env.SEMRUSH_API_KEY;
    const empty: KeywordMetric[] = [];
    if (!gatewayKey || !connectionKey) return { rows: empty, error: "Connect Semrush to retrieve keyword metrics.", warning: null as string | null };
    const GATEWAY_URL = "https://connector-gateway.lovable.dev/semrush";
    const report = async (method: string, phrase: string, columns: string) => {
      const url = new URL(`${GATEWAY_URL}/keywords/${method}`);
      url.search = new URLSearchParams({ phrase, database: data.database, export_columns: columns, display_limit: "10" }).toString();
      const response = await fetch(url, { headers: { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": connectionKey }, signal: AbortSignal.timeout(30000) });
      const text = await response.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
      if (!response.ok || record.error || (typeof record.status === "number" && record.status >= 400)) {
        console.error(`Semrush request failed [${response.status}]: ${text}`);
        if (text.includes("134") || text.includes("TOTAL LIMIT EXCEEDED")) throw new Error("Semrush API quota is exhausted. Upgrade your Semrush plan or wait for your quota to reset.");
        if (/refresh|access_denied|invalid.*token|unauthorized/i.test(text)) throw new Error("Semrush needs reauthorization. Reconnect your Semrush account to retrieve live keyword metrics.");
        if (/ERROR 50|NOTHING FOUND/i.test(text)) return [];
        throw new Error(`Semrush could not return this report (${response.status}). Try again or check your Semrush account limits.`);
      }
      return parseKeywordReport(body);
    };
    try {
      const related = await report("phrase_related", data.phrase, "Ph,Nq,Co");
      let rows = related;
      let warning: string | null = null;
      try { rows = mergeKeywordReports([await report("phrase_this", data.phrase, "Ph,Nq,Co"), related]); }
      catch (error) { warning = error instanceof Error ? error.message : "The exact keyword report is unavailable."; }
      if (rows.length) {
        try { rows = mergeKeywordReports([rows, await report("phrase_kdi", rows.map((r) => r.keyword).join(";"), "Ph,Kd")]); }
        catch (error) { warning = `${error instanceof Error ? error.message : "Difficulty report unavailable."} Missing difficulty is shown as unknown.`; }
      }
      return { rows, error: null as string | null, warning };
    } catch (error) {
      return { rows: empty, error: error instanceof Error ? error.message : "Keyword research is temporarily unavailable.", warning: null as string | null };
    }
  });