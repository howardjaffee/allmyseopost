import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Sparkles, BarChart3, Globe2, Image as ImageIcon, Link2, Gauge, Rocket, CheckCircle2, ArrowRight, Wand2, Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Seowidpnkj — AI Content & SEO Automation Platform" },
      { name: "description", content: "Generate SEO-optimized blog content, score quality with AI, and auto-publish to WordPress on autopilot." },
      { property: "og:title", content: "Seowidpnkj — AI Content & SEO Automation" },
      { property: "og:description", content: "From keyword to published WordPress post — fully automated, EEAT-ready content." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <Workflow />
      <Quality />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 backdrop-blur-xl bg-background/40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-brand shadow-glow grid place-items-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Seowidpnkj</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#workflow" className="hover:text-foreground">Workflow</a>
          <a href="#quality" className="hover:text-foreground">Quality Score</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" search={{ mode: "signup" } as never} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          AI Content Automation v1 — live now
        </div>
        <h1 className="mx-auto mt-8 max-w-4xl text-5xl md:text-7xl font-bold leading-[1.05]">
          From keyword to <span className="text-gradient">published WordPress post</span> — on autopilot.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Seowidpnkj plans your content calendar, writes EEAT-grade articles, generates images, scores quality, and publishes to every WordPress site you own. You set the niche. AI does the rest.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" } as never} className="group rounded-xl bg-brand px-6 py-3.5 text-base font-medium text-primary-foreground shadow-glow inline-flex items-center gap-2">
            Start automating <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a href="#workflow" className="rounded-xl glass px-6 py-3.5 text-base font-medium">See workflow</a>
        </div>
        <div className="mt-14 mx-auto max-w-5xl glass rounded-2xl p-2 shadow-elevated">
          <div className="rounded-xl bg-card overflow-hidden border border-border/40">
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <div className="size-3 rounded-full bg-destructive/60" />
              <div className="size-3 rounded-full bg-warning/60" />
              <div className="size-3 rounded-full bg-success/60" />
              <div className="ml-4 text-xs text-muted-foreground">seowidpnkj.in / dashboard</div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 p-6 text-left">
              {[
                { icon: Calendar, label: "Calendar", val: "30-day plan", sub: "12 topics queued" },
                { icon: Wand2, label: "Generator", val: "Article ready", sub: "Quality: 92/100" },
                { icon: Rocket, label: "Publishing", val: "Auto-publish", sub: "Daily · 09:00" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl border border-border/40 p-5 bg-background/40">
                  <c.icon className="size-5 text-accent" />
                  <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-lg font-semibold">{c.val}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Logos() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-16 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Built for serious content operators</p>
      <div className="mt-6 flex flex-wrap justify-center gap-x-12 gap-y-4 text-muted-foreground/60 text-sm font-display">
        <span>travelwebsite.com</span><span>healthblog.com</span><span>techinsights.io</span><span>finance.guru</span><span>recipes.daily</span>
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Calendar, title: "AI Content Calendars", body: "7, 30, 60, 90-day plans built around your niche, audience, and target country." },
  { icon: Wand2, title: "EEAT Article Engine", body: "Human-like, SEO-structured articles with FAQs, tables, CTAs — ready to rank." },
  { icon: ImageIcon, title: "Auto Image Generation", body: "Featured image + section visuals with alt text and SEO filenames." },
  { icon: Link2, title: "Internal Linking", body: "Smart anchor suggestions and related-post linking before publish." },
  { icon: Gauge, title: "Quality Scoring", body: "100-point scorecard across SEO, EEAT, readability, originality + auto-refine." },
  { icon: Globe2, title: "Multi-Site WordPress", body: "Connect unlimited WP sites. Separate plans, schedules, keywords per site." },
  { icon: Bot, title: "Bulk Generation", body: "Upload CSV with 10 → 1000 keywords. Queue and watch them ship." },
  { icon: Rocket, title: "Auto-Publish Scheduler", body: "Daily, weekly, custom slots, with manual or auto approval modes." },
];

function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">Everything you need</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold">One platform. The entire content pipeline.</h2>
          <p className="mt-4 text-muted-foreground">Stop juggling 10 tools. Plan, write, optimize, score, and publish from a single AI cockpit.</p>
        </div>
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group glass rounded-2xl p-6 transition hover:-translate-y-1 hover:shadow-glow">
              <div className="size-10 rounded-lg bg-brand-soft grid place-items-center">
                <f.icon className="size-5 text-accent" />
              </div>
              <h3 className="mt-5 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", title: "Plan", body: "Enter niche, audience, country, keywords. AI builds a 30/60/90-day calendar." },
  { n: "02", title: "Generate", body: "EEAT articles with images, internal links, meta tags — all in one pass." },
  { n: "03", title: "Score", body: "100-point quality engine evaluates SEO, EEAT, readability, originality." },
  { n: "04", title: "Publish", body: "Auto-publish on schedule to WordPress, or approve drafts manually." },
];

function Workflow() {
  return (
    <section id="workflow" className="py-28 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-accent">How it works</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold">Four steps. Zero daily work.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-4 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass rounded-2xl p-6">
              <div className="text-gradient text-3xl font-display font-bold">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Quality() {
  const cats = [
    { name: "SEO Optimization", val: 24, max: 25 },
    { name: "Readability & UX", val: 18, max: 20 },
    { name: "EEAT Signals", val: 19, max: 20 },
    { name: "Originality", val: 14, max: 15 },
    { name: "Keyword Coverage", val: 9, max: 10 },
    { name: "Structure", val: 4, max: 5 },
    { name: "Grammar", val: 4, max: 5 },
  ];
  return (
    <section id="quality" className="py-28 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm font-medium text-accent">100-point Quality Engine</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold">Only ship content that's actually <span className="text-gradient">publish-ready</span>.</h2>
          <p className="mt-5 text-muted-foreground">Every article passes through a 7-category AI quality scorer. Below threshold? It self-rewrites. Above? It ships.</p>
          <ul className="mt-6 space-y-2 text-sm">
            {["Tier A (90-100): Auto-publish", "Tier B (80-89): Optional refinement", "Tier C (70-79): Required AI optimization", "Tier D-E (<70): Blocked & regenerated"].map((x) => (
              <li key={x} className="flex items-start gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />{x}</li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-8 shadow-elevated">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Overall Score</div>
              <div className="text-6xl font-display font-bold text-gradient">92<span className="text-2xl text-muted-foreground">/100</span></div>
            </div>
            <span className="rounded-full bg-success/15 text-success px-3 py-1 text-xs font-medium">Publish Ready</span>
          </div>
          <div className="mt-6 space-y-3">
            {cats.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">{c.name}</span><span>{c.val}/{c.max}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${(c.val / c.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Starter", price: "Free", body: "Try the platform", feats: ["1 WP site", "5 articles / month", "Quality scoring", "Manual approval"] },
    { name: "Growth", price: "$49", featured: true, body: "Serious content ops", feats: ["5 WP sites", "200 articles / month", "Auto-publish + scheduler", "Bulk CSV generation", "Image generation"] },
    { name: "Agency", price: "$199", body: "Multi-client production", feats: ["Unlimited sites", "2000 articles / month", "Priority AI models", "Team access", "Priority support"] },
  ];
  return (
    <section id="pricing" className="py-28 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-accent">Pricing</p>
          <h2 className="mt-2 text-4xl md:text-5xl font-bold">Pay for content shipped — not seats.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`glass rounded-2xl p-8 ${t.featured ? "ring-2 ring-primary shadow-glow" : ""}`}>
              {t.featured && <div className="text-xs text-accent font-medium mb-3">Most popular</div>}
              <h3 className="font-semibold">{t.name}</h3>
              <div className="mt-2 text-4xl font-display font-bold">{t.price}<span className="text-base text-muted-foreground font-normal">{t.price !== "Free" && "/mo"}</span></div>
              <p className="text-sm text-muted-foreground mt-1">{t.body}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {t.feats.map((f) => <li key={f} className="flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" />{f}</li>)}
              </ul>
              <Link to="/auth" search={{ mode: "signup" } as never} className={`mt-6 block text-center rounded-lg py-2.5 text-sm font-medium ${t.featured ? "bg-brand text-primary-foreground" : "border border-border"}`}>
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden glass rounded-3xl p-12 md:p-16 text-center shadow-elevated">
          <div className="absolute inset-0 bg-brand-soft opacity-80" />
          <div className="relative">
            <BarChart3 className="size-10 mx-auto text-accent" />
            <h2 className="mt-4 text-3xl md:text-5xl font-bold">Stop writing. Start ranking.</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Spin up your first calendar in 2 minutes. No credit card required.</p>
            <Link to="/auth" search={{ mode: "signup" } as never} className="mt-8 inline-flex rounded-xl bg-brand px-7 py-3.5 font-medium text-primary-foreground shadow-glow">
              Create your free account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} Seowidpnkj.in — All rights reserved.</div>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
