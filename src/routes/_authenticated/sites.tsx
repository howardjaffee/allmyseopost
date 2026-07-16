import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/sites")({
  head: () => ({ meta: [{ title: "Sites — Seowidpnkj" }] }),
  component: SitesPage,
});

function SitesPage() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", niche: "", target_country: "", wp_username: "", wp_app_password: "" });

  const sites = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await supabase.from("sites").select("id,name,url,niche,target_country,wp_connected,created_at").order("created_at", { ascending: false })).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("sites").insert({
        ...form, user_id: u.user.id, wp_connected: !!(form.wp_username && form.wp_app_password),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Site added");
      setAdding(false);
      setForm({ name: "", url: "", niche: "", target_country: "", wp_username: "", wp_app_password: "" });
      qc.invalidateQueries({ queryKey: ["sites"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("sites").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["sites"] }); },
  });

  return (
    <div>
      <PageHeader title="WordPress Sites" subtitle="Connect every site you manage." action={
        <button onClick={() => setAdding(!adding)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-medium text-primary-foreground shadow-glow text-sm"><Plus className="size-4" /> Add site</button>
      } />
      <div className="px-8 pb-12 space-y-6">
        {adding && (
          <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="glass rounded-2xl p-6 grid md:grid-cols-2 gap-4">
            <Field label="Site name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Travel Blog" /></Field>
            <Field label="URL *"><input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={input} placeholder="https://travelwebsite.com" /></Field>
            <Field label="Niche"><input value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} className={input} /></Field>
            <Field label="Target country"><input value={form.target_country} onChange={(e) => setForm({ ...form, target_country: e.target.value })} className={input} /></Field>
            <Field label="WP Username"><input value={form.wp_username} onChange={(e) => setForm({ ...form, wp_username: e.target.value })} className={input} placeholder="admin" /></Field>
            <Field label="WP Application Password"><input type="password" value={form.wp_app_password} onChange={(e) => setForm({ ...form, wp_app_password: e.target.value })} className={input} placeholder="xxxx xxxx xxxx xxxx" /></Field>
            <div className="md:col-span-2 flex gap-2">
              <button disabled={add.isPending} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-primary-foreground shadow-glow text-sm">Save site</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm">Cancel</button>
            </div>
            <p className="md:col-span-2 text-xs text-muted-foreground">Create an application password in your WP admin under Users → Profile → Application Passwords.</p>
          </form>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(sites.data ?? []).map((s) => (
            <div key={s.id} className="glass rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div className="size-10 rounded-lg bg-brand-soft grid place-items-center"><Globe2 className="size-5 text-accent" /></div>
                <button onClick={() => del.mutate(s.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
              </div>
              <h3 className="mt-4 font-semibold">{s.name}</h3>
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">{s.url}</a>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {s.niche && <span className="rounded-full bg-secondary px-2 py-0.5">{s.niche}</span>}
                {s.target_country && <span className="rounded-full bg-secondary px-2 py-0.5">{s.target_country}</span>}
                <span className={`rounded-full px-2 py-0.5 ${s.wp_connected ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                  {s.wp_connected ? "WP connected" : "WP not configured"}
                </span>
              </div>
            </div>
          ))}
          {(sites.data ?? []).length === 0 && !adding && <p className="text-sm text-muted-foreground col-span-full text-center py-12">No sites yet — add your first WordPress site.</p>}
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>{children}</label>;
}
