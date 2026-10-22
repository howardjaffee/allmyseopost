import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Calendar, Wand2, Globe2, Gauge, History, Settings, LogOut, Sparkles, Share2, CalendarClock, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/keywords", label: "Keyword Research", icon: Search },
  { to: "/calendar", label: "Content Calendar", icon: Calendar },
  { to: "/generator", label: "Generator", icon: Wand2 },
  { to: "/social", label: "Social Posts", icon: Share2 },
  { to: "/social-schedule", label: "Autopost", icon: CalendarClock },
  { to: "/sites", label: "Sites", icon: Globe2 },
  { to: "/quality", label: "Quality", icon: Gauge },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AuthLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const onSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-hero flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/40 bg-background/40 backdrop-blur-xl">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5">
          <div className="size-8 rounded-lg bg-brand grid place-items-center shadow-glow"><Sparkles className="size-4 text-primary-foreground" /></div>
          <span className="font-display font-semibold">Seowidpnkj</span>
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-brand-soft text-foreground" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
                <n.icon className="size-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/40 p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="size-8 rounded-full bg-brand grid place-items-center text-xs font-semibold text-primary-foreground">
              {(user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{user.email}</div>
            </div>
            <button onClick={onSignOut} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
