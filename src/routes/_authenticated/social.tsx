import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Share2, Copy, Download, Instagram, Facebook } from "lucide-react";
import { generateSocialPost } from "@/lib/content.functions";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/social")({
  head: () => ({ meta: [{ title: "Social Post Generator — Seowidpnkj" }] }),
  component: SocialPage,
});

type Result = Awaited<ReturnType<typeof generateSocialPost>>;

function SocialPage() {
  const gen = useServerFn(generateSocialPost);
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState({
    topic: "",
    platform: "both" as "both" | "instagram" | "facebook",
    tone: "engaging",
    audience: "general audience",
    cta: "",
    includeImage: true,
  });

  const mut = useMutation({
    mutationFn: () => gen({ data: form }),
    onSuccess: (r) => { setResult(r); toast.success(`Generated ${r.posts.length} post(s)`); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Generation failed"),
  });

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div>
      <PageHeader title="Social Post Generator" subtitle="Viral-ready Instagram & Facebook captions, hashtags, and images." />
      <div className="px-8 pb-12 grid lg:grid-cols-3 gap-6">
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="lg:col-span-1 glass rounded-2xl p-6 space-y-4 h-fit">
          <Field label="Topic / product / message *">
            <textarea required rows={3} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Launching our new eco-friendly water bottle" className={input} />
          </Field>
          <Field label="Platform">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as typeof form.platform })} className={input}>
              <option value="both">Instagram + Facebook</option>
              <option value="instagram">Instagram only</option>
              <option value="facebook">Facebook only</option>
            </select>
          </Field>
          <Field label="Tone">
            <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={input}>
              {["engaging", "playful", "professional", "inspirational", "bold", "witty"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Audience">
            <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={input} />
          </Field>
          <Field label="Call-to-action (optional)">
            <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Drive traffic to landing page" className={input} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.includeImage} onChange={(e) => setForm({ ...form, includeImage: e.target.checked })} /> Generate matching image
          </label>
          <button type="submit" disabled={mut.isPending} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            {mut.isPending ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Share2 className="size-4" /> Generate posts</>}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {!result && <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">Fill the form and generate your first post.</div>}
          {result?.posts.map((p, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                {p.platform === "instagram" ? <Instagram className="size-4 text-pink-400" /> : <Facebook className="size-4 text-blue-400" />}
                <div className="font-semibold capitalize">{p.platform}</div>
              </div>
              {p.imageDataUrl && (
                <div className="relative rounded-xl overflow-hidden border border-border/40">
                  <img src={p.imageDataUrl} alt={p.imagePrompt} className={p.platform === "instagram" ? "w-full aspect-square object-cover" : "w-full aspect-[1.91/1] object-cover"} />
                  <a href={p.imageDataUrl} download={`${p.platform}-${i + 1}.png`} className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur px-3 py-1.5 text-xs text-white hover:bg-black/80">
                    <Download className="size-3" /> Download
                  </a>
                </div>
              )}
              <div>
                <div className="mb-1 flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Caption</span>
                  <button onClick={() => copy(p.caption)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Copy className="size-3" /> Copy</button>
                </div>
                <div className="whitespace-pre-wrap text-sm rounded-lg bg-secondary/30 p-3">{p.caption}</div>
              </div>
              {p.hashtags.length > 0 && (
                <div>
                  <div className="mb-1 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Hashtags ({p.hashtags.length})</span>
                    <button onClick={() => copy(p.hashtags.map((h) => `#${h}`).join(" "))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Copy className="size-3" /> Copy all</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.hashtags.map((h) => <span key={h} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs">#{h}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
