import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Wand2, Sparkles } from "lucide-react";
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
  });

  const recent = useQuery({
    queryKey: ["recentArticles"],
    queryFn: async () => {
      const { data } = await supabase.from("articles").select("id,title,status,created_at,quality_scores(overall,tier)").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const mut = useMutation({
    mutationFn: () => gen({ data: form }),
    onSuccess: (res) => {
      toast.success(`Article generated! Quality: ${res.overall}/100 (Tier ${res.tier})`);
      qc.invalidateQueries({ queryKey: ["recentArticles"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  return (
    <div>
      <PageHeader title="Article Generator" subtitle="EEAT-optimized SEO content with built-in quality scoring." />
      <div className="px-8 pb-12 grid lg:grid-cols-3 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="lg:col-span-2 glass rounded-2xl p-6 space-y-4">
          <Field label="Primary keyword *">
            <input required value={form.primaryKeyword} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} placeholder="best hotels in dalhousie" className={input} />
          </Field>
          <Field label="Secondary keywords (comma-separated)">
            <input value={form.secondaryKeywords} onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })} placeholder="luxury hotels, budget stays, hill station resorts" className={input} />
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
          <button disabled={mut.isPending} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Generating & scoring…</> : <><Wand2 className="size-4" /> Generate article</>}
          </button>
          <p className="text-xs text-muted-foreground">Powered by Lovable AI. Article + quality score are saved to your library.</p>
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
