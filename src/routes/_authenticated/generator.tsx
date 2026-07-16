import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2, Sparkles, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateArticle } from "@/lib/content.functions";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/generator")({
  head: () => ({ meta: [{ title: "Article Generator — Seowidpnkj" }] }),
  component: GeneratorPage,
});

function GeneratorPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateArticle);
  const [form, setForm] = useState({
    primaryKeyword: "",
    secondaryKeywords: "",
    tone: "professional",
    wordCount: 1500,
    targetCountry: "United States",
    audience: "general readers",
    searchIntent: "informational",
    siteId: null as string | null,
    minQuality: 75,
    maxAttempts: 3,
  });

  const sites = useQuery({
    queryKey: ["generator-sites"],
    queryFn: async () => (await supabase.from("sites").select("id,name").order("created_at", { ascending: false })).data ?? [],
  });

  const recent = useQuery({
    queryKey: ["recentArticles"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("id,title,status,created_at,quality_scores(overall,tier)").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const mut = useMutation({
    mutationFn: (opts: { autoPublish: boolean }) => gen({ data: { ...form, autoPublish: opts.autoPublish, includeImage: true } }),
    onSuccess: (res) => {
      const attemptNote = res.regenerated ? ` after ${res.attempts} attempts` : "";
      if (res.belowThreshold) {
        toast.warning(`Best score ${res.overall}/100 still below ${res.minQuality} threshold${attemptNote}. Saved best draft.`);
      } else if (res.published) {
        toast.success(`Published to WordPress! Quality ${res.overall}/100 (Tier ${res.tier})${attemptNote}`);
      } else if (res.publishError) {
        toast.error(res.publishError);
      } else {
        toast.success(`Article generated! Quality: ${res.overall}/100 (Tier ${res.tier})${attemptNote}`);
      }
      qc.invalidateQueries({ queryKey: ["recentArticles"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });


  return (
    <div>
      <PageHeader title="Article Generator" subtitle="EEAT-optimized SEO content with built-in quality scoring." />
      <div className="px-8 pb-12 grid lg:grid-cols-3 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate({ autoPublish: false }); }} className="lg:col-span-2 glass rounded-2xl p-6 space-y-4">
          <Field label="Primary keyword *">
            <input required value={form.primaryKeyword} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} placeholder="best hotels in dalhousie" className={input} />
          </Field>
          <Field label="Secondary keywords (comma-separated)">
            <input value={form.secondaryKeywords} onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })} placeholder="luxury hotels, budget stays, hill station resorts" className={input} />
          </Field>
          <Field label="WordPress site">
            <select value={form.siteId ?? ""} onChange={(e) => setForm({ ...form, siteId: e.target.value || null })} className={input}>
              <option value="">No site / draft only</option>
              {(sites.data ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tone"><select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={input}>
              {["professional", "conversational", "authoritative", "friendly", "journalistic"].map((t) => <option key={t}>{t}</option>)}
            </select></Field>
            <Field label="Word count"><input type="number" min={300} max={4000} step={100} value={form.wordCount} onChange={(e) => setForm({ ...form, wordCount: Number(e.target.value) })} className={input} /></Field>
            <Field label="Target country"><input value={form.targetCountry} onChange={(e) => setForm({ ...form, targetCountry: e.target.value })} className={input} /></Field>
            <Field label="Search intent"><select value={form.searchIntent} onChange={(e) => setForm({ ...form, searchIntent: e.target.value })} className={input}>
              {["informational", "commercial", "transactional", "navigational"].map((t) => <option key={t}>{t}</option>)}
            </select></Field>
          </div>
          <Field label="Target audience">
            <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={input} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={`Min quality score (${form.minQuality}/100)`}>
              <input type="range" min={50} max={95} step={5} value={form.minQuality} onChange={(e) => setForm({ ...form, minQuality: Number(e.target.value) })} className="w-full" />
            </Field>
            <Field label="Max regeneration attempts">
              <select value={form.maxAttempts} onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })} className={input}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button type="submit" disabled={mut.isPending} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 py-3 font-medium disabled:opacity-60">
              {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Working…</> : <><Wand2 className="size-4" /> Generate draft</>}
            </button>
            <button type="button" disabled={mut.isPending || !form.siteId} onClick={() => mut.mutate({ autoPublish: true })} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-primary-foreground shadow-glow disabled:opacity-60">
              {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Publishing…</> : <><Rocket className="size-4" /> Generate + Publish to WordPress</>}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">One-click generates article + featured image and publishes to your selected WordPress site. Select a site to enable publishing.</p>
        </form>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold flex items-center gap-2"><Sparkles className="size-4 text-accent" /> Recent</h3>
          <div className="mt-4 space-y-3">
            {(recent.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No articles yet.</p>}
            {(recent.data ?? []).map((a) => {
              const score = (a.quality_scores as Array<{ overall: number; tier: string }> | null)?.[0];
              return (
                <Link key={a.id} to="/history" className="block rounded-lg border border-border/40 p-3 hover:bg-secondary/30">
                  <div className="text-sm font-medium line-clamp-1">{a.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{a.status}</span>
                    {score && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-foreground">{score.overall}/100 · {score.tier}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
