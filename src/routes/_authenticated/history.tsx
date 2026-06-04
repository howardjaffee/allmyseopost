import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "Content History — Seowidpnkj" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await supabase.from("articles").select("id,title,status,created_at,primary_keyword,word_count").order("created_at", { ascending: false })).data ?? [],
  });
  const detail = useQuery({
    queryKey: ["article", selected],
    enabled: !!selected,
    queryFn: async () => (await supabase.from("articles").select("*").eq("id", selected!).single()).data,
  });

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
          {detail.data ? (
            <article className="prose prose-invert max-w-none">
              <h2>{detail.data.title}</h2>
              <p className="text-sm text-muted-foreground">{detail.data.meta_description}</p>
              <div dangerouslySetInnerHTML={{ __html: detail.data.content_html ?? "" }} />
            </article>
          ) : (
            <div className="grid place-items-center h-full text-muted-foreground text-sm gap-3"><FileText className="size-8" />Select an article to preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
