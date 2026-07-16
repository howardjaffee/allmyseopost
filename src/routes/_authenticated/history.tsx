import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { publishArticleToWordPress } from "@/lib/wordpress.functions";
import { FileText, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Content History — Seowidpnkj" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const publish = useServerFn(publishArticleToWordPress);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const list = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await supabase.from("articles").select("id,title,status,created_at,primary_keyword,word_count,wp_post_id").order("created_at", { ascending: false })).data ?? [],
  });
  const detail = useQuery({
    queryKey: ["article", selected],
    enabled: !!selected,
    queryFn: async () => (await supabase.from("articles").select("*").eq("id", selected!).single()).data,
  });
  const sites = useQuery({
    queryKey: ["wp-sites"],
    queryFn: async () => (await supabase.from("sites").select("id,name,url,wp_connected").order("created_at", { ascending: false })).data ?? [],
  });
  const publishMutation = useMutation({
    mutationFn: () => publish({ data: { articleId: detail.data!.id, siteId: selectedSiteId || detail.data!.site_id } }),
    onSuccess: (res) => {
      toast.success("Published to WordPress");
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["article", selected] });
      if (res.link) window.open(res.link, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Publishing failed"),
  });

  const activeArticle = detail.data;
  const publishSiteId = selectedSiteId || activeArticle?.site_id || "";

  return (
    <div>
      <PageHeader title="Content History" subtitle="Every article you've generated." />
      <div className="px-8 pb-12 grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 space-y-1 max-h-[70vh] overflow-y-auto">
          {(list.data ?? []).map((a) => (
            <button key={a.id} onClick={() => setSelected(a.id)} className={`w-full text-left rounded-lg p-3 ${selected === a.id ? "bg-brand-soft" : "hover:bg-secondary/40"}`}>
              <div className="text-sm font-medium line-clamp-1">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{a.primary_keyword} · {a.word_count} words · {a.status}</div>
            </button>
          ))}
          {(list.data ?? []).length === 0 && <p className="text-sm text-muted-foreground p-6 text-center">No content yet.</p>}
        </div>
        <div className="lg:col-span-2 glass rounded-2xl p-6 max-h-[70vh] overflow-y-auto">
          {activeArticle ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-border/50 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{activeArticle.status}{activeArticle.wp_post_id ? ` · WP #${activeArticle.wp_post_id}` : ""}</div>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{activeArticle.title}</h2>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select value={publishSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="rounded-lg border border-border bg-input/40 px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="">Choose WordPress site</option>
                    {(sites.data ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  </select>
                  <button disabled={!publishSiteId || publishMutation.isPending} onClick={() => publishMutation.mutate()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50">
                    {publishMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Publish
                  </button>
                </div>
              </div>
              <article className="prose prose-invert max-w-none">
                <p className="text-sm text-muted-foreground">{activeArticle.meta_description}</p>
                <div dangerouslySetInnerHTML={{ __html: activeArticle.content_html ?? "" }} />
              </article>
            </div>
          ) : (
            <div className="grid place-items-center h-full text-muted-foreground text-sm gap-3"><FileText className="size-8" />Select an article to preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
