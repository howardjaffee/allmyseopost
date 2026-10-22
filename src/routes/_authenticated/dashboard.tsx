import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Calendar, Globe2, Gauge, Wand2, Plus, ArrowRight, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard", "Review your articles, content plans and connected WordPress sites."),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [a, s, p] = await Promise.all([
        supabase.from("articles").select("id,status", { count: "exact", head: false }),
        supabase.from("sites").select("id", { count: "exact", head: true }),
        supabase.from("content_plans").select("id", { count: "exact", head: true }),
      ]);
      const articles = a.data ?? [];
      return {
        articles: articles.length,
        published: articles.filter((x) => x.status === "published").length,
        drafts: articles.filter((x) => x.status === "draft").length,
        sites: s.count ?? 0,
        plans: p.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Articles", value: stats.data?.articles ?? 0, sub: `${stats.data?.published ?? 0} published`, icon: FileText },
    { label: "Drafts", value: stats.data?.drafts ?? 0, sub: "pending review", icon: Wand2 },
    { label: "Content plans", value: stats.data?.plans ?? 0, sub: "active calendars", icon: Calendar },
    { label: "Sites connected", value: stats.data?.sites ?? 0, sub: "WordPress sites", icon: Globe2 },
  ];

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.email?.split("@")[0]}`} subtitle="Your AI content operations at a glance." />
      <div className="px-8 pb-12 space-y-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="glass rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="mt-2 text-3xl font-display font-bold">{c.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
                </div>
                <div className="size-9 rounded-lg bg-brand-soft grid place-items-center"><c.icon className="size-4 text-accent" /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <QuickAction to="/keywords" icon={Search} title="Research keywords" body="Compare search volume, ad competition and ranking difficulty." />
          <QuickAction to="/generator" icon={Wand2} title="Generate an article" body="Spin up an EEAT-optimized post with auto quality scoring." />
          <QuickAction to="/calendar" icon={Calendar} title="Plan content calendar" body="7/30/60/90-day strategies with topics & internal linking." />
          <QuickAction to="/sites" icon={Globe2} title="Connect a WordPress site" body="Add your site & WP application password to publish." />
          <QuickAction to="/quality" icon={Gauge} title="View quality scores" body="See how every article ranks on the 100-point engine." />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, body }: { to: string; icon: typeof Plus; title: string; body: string }) {
  return (
    <Link to={to} className="group glass rounded-2xl p-6 flex items-center gap-5 hover:shadow-glow transition">
      <div className="size-12 rounded-xl bg-brand grid place-items-center shadow-glow shrink-0"><Icon className="size-5 text-primary-foreground" /></div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
      <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition" />
    </Link>
  );
}
