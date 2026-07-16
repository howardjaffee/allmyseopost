import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Link2, Unlink, Play, CheckCircle2, XCircle, Instagram, Facebook, Calendar } from "lucide-react";
import { getMetaAuthUrl, getSocialStatus, saveSocialSchedule, disconnectMeta, runScheduleNow } from "@/lib/meta.functions";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/social-schedule")({
  head: () => ({ meta: [{ title: "Autopost Scheduler — Seowidpnkj" }] }),
  component: SchedulePage,
});

const input = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary";

function SchedulePage() {
  const qc = useQueryClient();
  const search = useRouterState({ select: (s) => s.location.search }) as unknown as Record<string, string>;
  const status = useQuery({ queryKey: ["social-status"], queryFn: () => getSocialStatus() });

  const authUrlFn = useServerFn(getMetaAuthUrl);
  const saveFn = useServerFn(saveSocialSchedule);
  const disconnectFn = useServerFn(disconnectMeta);
  const runNowFn = useServerFn(runScheduleNow);

  useEffect(() => {
    if (search.meta_ok) { toast.success(String(search.meta_ok)); qc.invalidateQueries({ queryKey: ["social-status"] }); }
    if (search.meta_error) toast.error(String(search.meta_error));
  }, [search.meta_ok, search.meta_error, qc]);

  const [form, setForm] = useState({
    enabled: false,
    post_time_utc: "13:00",
    topicsText: "",
    tone: "engaging",
    audience: "general audience",
    cta: "",
    platforms: { instagram: true, facebook: true },
  });

  useEffect(() => {
    const s = status.data?.schedule;
    if (!s) return;
    setForm({
      enabled: !!s.enabled,
      post_time_utc: s.post_time_utc ?? "13:00",
      topicsText: Array.isArray(s.topics) ? (s.topics as string[]).join("\n") : "",
      tone: s.tone ?? "engaging",
      audience: s.audience ?? "general audience",
      cta: s.cta ?? "",
      platforms: {
        instagram: Array.isArray(s.platforms) && (s.platforms as string[]).includes("instagram"),
        facebook: Array.isArray(s.platforms) && (s.platforms as string[]).includes("facebook"),
      },
    });
  }, [status.data?.schedule]);

  const connect = useMutation({
    mutationFn: () => authUrlFn(),
    onSuccess: (r) => { window.location.href = r.url; },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const save = useMutation({
    mutationFn: () => {
      const topics = form.topicsText.split("\n").map((t) => t.trim()).filter(Boolean);
      const platforms = (Object.entries(form.platforms).filter(([, v]) => v).map(([k]) => k) as Array<"instagram" | "facebook">);
      if (topics.length === 0) throw new Error("Add at least one topic");
      if (platforms.length === 0) throw new Error("Pick at least one platform");
      return saveFn({ data: { ...form, topics, platforms } });
    },
    onSuccess: () => { toast.success("Schedule saved"); qc.invalidateQueries({ queryKey: ["social-status"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectFn(),
    onSuccess: () => { toast.success("Disconnected"); qc.invalidateQueries({ queryKey: ["social-status"] }); },
  });

  const runNow = useMutation({
    mutationFn: () => runNowFn(),
    onSuccess: (r) => {
      const ok = r.results.filter((x) => x.ok).length;
      const fail = r.results.length - ok;
      toast[fail === 0 ? "success" : "error"](`Topic "${r.topic}": ${ok} published, ${fail} failed`);
      qc.invalidateQueries({ queryKey: ["social-status"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const account = status.data?.account;
  const recent = status.data?.recent ?? [];

  return (
    <div>
      <PageHeader title="Autopost Scheduler" subtitle="Publish daily to Instagram + Facebook automatically." />
      <div className="px-8 pb-12 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass rounded-2xl p-6 space-y-3">
            <div className="font-semibold flex items-center gap-2"><Link2 className="size-4" /> Meta account</div>
            {status.isLoading ? <Loader2 className="size-4 animate-spin" /> : account?.fb_page_id ? (
              <>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2"><Facebook className="size-4 text-blue-400" /> {account.fb_page_name}</div>
                  {account.ig_username && <div className="flex items-center gap-2"><Instagram className="size-4 text-pink-400" /> @{account.ig_username}</div>}
                  {!account.ig_username && <div className="text-xs text-yellow-400">No Instagram Business account linked to this Page. Instagram posts will fail.</div>}
                  {account.token_expires_at && <div className="text-xs text-muted-foreground">Token expires {new Date(account.token_expires_at).toLocaleDateString()}</div>}
                </div>
                <button onClick={() => disconnect.mutate()} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm hover:bg-secondary/40">
                  <Unlink className="size-4" /> Disconnect
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Connect a Facebook Page (with an Instagram Business account linked) to enable autoposting.</p>
                <button disabled={connect.isPending} onClick={() => connect.mutate()} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60">
                  {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Connect Meta
                </button>
              </>
            )}
          </div>

          {account?.fb_page_id && (
            <div className="glass rounded-2xl p-6 space-y-2">
              <div className="font-semibold flex items-center gap-2"><Play className="size-4" /> Run now</div>
              <p className="text-xs text-muted-foreground">Publishes the next topic in your rotation immediately.</p>
              <button disabled={runNow.isPending || !status.data?.schedule?.enabled} onClick={() => runNow.mutate()} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm hover:bg-secondary/40 disabled:opacity-60">
                {runNow.isPending ? <><Loader2 className="size-4 animate-spin" /> Posting…</> : <>Post next topic now</>}
              </button>
              {!status.data?.schedule?.enabled && <div className="text-xs text-muted-foreground">Save the schedule as enabled first.</div>}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="lg:col-span-2 glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold flex items-center gap-2"><Calendar className="size-4" /> Daily schedule</div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
              Enabled
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Post time (UTC, HH:MM)</div>
              <input type="time" value={form.post_time_utc} onChange={(e) => setForm({ ...form, post_time_utc: e.target.value })} className={input} />
              <div className="mt-1 text-[11px] text-muted-foreground">Your local time now is {new Date().toLocaleTimeString()} — UTC is {new Date().toUTCString().slice(17, 22)}.</div>
            </label>
            <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Platforms</div>
              <div className="flex gap-3 pt-2 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.platforms.instagram} onChange={(e) => setForm({ ...form, platforms: { ...form.platforms, instagram: e.target.checked } })} /> Instagram</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.platforms.facebook} onChange={(e) => setForm({ ...form, platforms: { ...form.platforms, facebook: e.target.checked } })} /> Facebook</label>
              </div>
            </label>
          </div>

          <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Rotating topics (one per line — scheduler picks the next each day)</div>
            <textarea rows={6} value={form.topicsText} onChange={(e) => setForm({ ...form, topicsText: e.target.value })} placeholder={"Morning motivation for entrepreneurs\nBenefits of hydration\nTip: how to write better emails"} className={input} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Tone</div>
              <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className={input}>
                {["engaging", "playful", "professional", "inspirational", "bold", "witty"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Audience</div>
              <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={input} />
            </label>
          </div>
          <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">Call-to-action (optional)</div>
            <input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} placeholder="Visit our site / DM us" className={input} />
          </label>

          <button type="submit" disabled={save.isPending} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            {save.isPending ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : "Save schedule"}
          </button>

          {status.data?.schedule?.last_run_at && (
            <div className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              Last run {new Date(status.data.schedule.last_run_at).toLocaleString()} — {status.data.schedule.last_status ?? "?"}
              {status.data.schedule.last_error && <div className="text-red-400 mt-1">{status.data.schedule.last_error}</div>}
            </div>
          )}
        </form>

        <div className="lg:col-span-3 glass rounded-2xl p-6">
          <div className="font-semibold mb-3">Recent posts</div>
          {recent.length === 0 ? <div className="text-sm text-muted-foreground">No posts yet.</div> : (
            <div className="space-y-2 text-sm">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-lg bg-secondary/20 px-3 py-2">
                  {r.status === "published" ? <CheckCircle2 className="size-4 text-green-400" /> : <XCircle className="size-4 text-red-400" />}
                  {r.platform === "instagram" ? <Instagram className="size-4 text-pink-400" /> : <Facebook className="size-4 text-blue-400" />}
                  <div className="flex-1 min-w-0 truncate">{r.topic ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  {r.error && <div className="text-xs text-red-400 truncate max-w-[40%]">{r.error}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
