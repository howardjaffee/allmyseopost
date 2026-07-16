import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Seowidpnkj" },
      { name: "description", content: "Sign in or create your Seowidpnkj account to automate content & SEO." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin + "/auth",
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally { setLoading(false); }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
    if (!result.redirected && !result.error) navigate({ to: "/dashboard", replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-hero grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4" /> Back home
        </Link>
        <div className="glass rounded-2xl p-8 shadow-elevated">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-brand grid place-items-center shadow-glow"><Sparkles className="size-4 text-primary-foreground" /></div>
            <span className="font-display text-lg font-semibold">Seowidpnkj</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to your content cockpit." : "Start automating your SEO content in minutes."}</p>

          <button onClick={onGoogle} disabled={loading} className="mt-6 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50 inline-flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="size-4"><path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.4 3.4-4.5 3.4-2.7 0-5-2.3-5-5s2.3-5 5-5c1.5 0 2.6.6 3.2 1.2L17.4 6c-1.5-1.4-3.4-2.2-5.4-2.2-4.5 0-8.1 3.6-8.1 8.1s3.6 8.1 8.1 8.1c4.7 0 7.8-3.3 7.8-7.9 0-.5-.1-.9-.1-1.3H12z"/></svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />OR<div className="h-px flex-1 bg-border" /></div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} className="w-full rounded-lg bg-input/40 border border-border px-3 py-2.5 text-sm outline-none focus:border-primary" />
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-accent hover:underline font-medium">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
