import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Calendar as CalIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateContentPlan } from "@/lib/content.functions";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => pageHead("Content Calendar", "Plan SEO article topics and publishing calendars for your audience."),
  component: CalendarPage,
});

function CalendarPage() {
  const qc = useQueryClient();
  const gen = useServerFn(generateContentPlan);
  const [form, setForm] = useState({
    title: "", durationDays: 30 as 7 | 30 | 60 | 90, niche: "", targetCountry: "United States",
    audience: "", primaryKeywords: "", secondaryKeywords: "",
  });

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await supabase.from("content_plans").select("id,title,duration_days,created_at,content_plan_items(id,day_number,topic,scheduled_date,status)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const mut = useMutation({
    mutationFn: () => gen({ data: form }),
    onSuccess: (r) => { toast.success(`Plan created with ${r.itemCount} topics`); qc.invalidateQueries({ queryKey: ["plans"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader title="Content Calendar" subtitle="AI-generated multi-day publishing plans." />
      <div className="px-8 pb-12 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="glass rounded-2xl p-6 grid md:grid-cols-2 gap-4">
          <Field label="Plan name *"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} placeholder="Q1 Travel Calendar" /></Field>
          <Field label="Duration"><select value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) as 7 | 30 | 60 | 90 })} className={input}>
            {[7, 30, 60, 90].map((d) => <option key={d} value={d}>{d} days</option>)}
          </select></Field>
          <Field label="Niche *"><input required value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className={input} placeholder="hill station travel" /></Field>
          <Field label="Target country"><input value={form.targetCountry} onChange={(e) => setForm({ ...form, targetCountry: e.target.value })} className={input} /></Field>
          <Field label="Audience"><input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={input} placeholder="Indian families & couples" /></Field>
          <Field label="Primary keywords"><input value={form.primaryKeywords} onChange={(e) => setForm({ ...form, primaryKeywords: e.target.value })} className={input} placeholder="dalhousie, dharamshala, shimla" /></Field>
          <Field label="Secondary keywords"><input value={form.secondaryKeywords} onChange={(e) => setForm({ ...form, secondaryKeywords: e.target.value })} className={input} placeholder="hotels, weather, things to do" /></Field>
          <div className="md:col-span-2">
            <button disabled={mut.isPending} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-medium text-primary-foreground shadow-glow disabled:opacity-60">
              {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Building plan…</> : <><CalIcon className="size-4" /> Generate calendar</>}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {(plans.data ?? []).map((p) => {
            const items = (p.content_plan_items as Array<{ id: string; day_number: number; topic: string; scheduled_date: string; status: string }>) ?? [];
            return (
              <div key={p.id} className="glass rounded-2xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">{p.duration_days}-day plan · {items.length} topics</p>
                  </div>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {items.sort((a, b) => a.day_number - b.day_number).map((it) => (
                    <div key={it.id} className="rounded-lg border border-border/40 p-3 bg-background/30">
                      <div className="text-xs text-accent font-medium">Day {it.day_number} · {it.scheduled_date}</div>
                      <div className="mt-1 text-sm font-medium line-clamp-2">{it.topic}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {(plans.data ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No plans yet — generate your first calendar above.</p>}
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
