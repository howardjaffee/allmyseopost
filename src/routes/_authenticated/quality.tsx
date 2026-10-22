import { pageHead } from "@/lib/page-head";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/quality")({
  head: () => pageHead("Quality Scores", "Review article quality scores for SEO, readability and content structure."),
  component: QualityPage,
});

const TIER_COLORS: Record<string, string> = {
  A: "bg-success/20 text-success",
  B: "bg-accent/20 text-accent",
  C: "bg-warning/20 text-warning",
  D: "bg-destructive/20 text-destructive",
  E: "bg-destructive/30 text-destructive",
};

function QualityPage() {
  const scores = useQuery({
    queryKey: ["scores"],
    queryFn: async () => (await supabase.from("quality_scores").select("*,articles(title)").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div>
      <PageHeader title="Quality Scores" subtitle="100-point AI evaluation for every article." />
      <div className="px-8 pb-12 space-y-3">
        {(scores.data ?? []).map((s) => {
          const title = (s.articles as { title?: string } | null)?.title ?? "Untitled";
          return (
            <div key={s.id} className="glass rounded-2xl p-5 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium">{title}</div>
                <div className="text-xs text-muted-foreground mt-1">SEO {s.seo}/25 · UX {s.readability}/20 · EEAT {s.eeat}/20 · Original {s.originality}/15 · Keywords {s.keyword_coverage}/10 · Structure {s.structure}/5 · Grammar {s.grammar}/5</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-display font-bold text-gradient">{s.overall}<span className="text-base text-muted-foreground">/100</span></div>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_COLORS[s.tier] ?? ""}`}>Tier {s.tier}</span>
              </div>
            </div>
          );
        })}
        {(scores.data ?? []).length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No scores yet — generate an article to see its quality breakdown.</p>}
      </div>
    </div>
  );
}
