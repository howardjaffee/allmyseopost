import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Loader2, ArrowRight, ArrowDownUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { researchKeywords } from "@/lib/keywords.functions";
import { KEYWORD_MARKETS, type KeywordMarket, type KeywordMetric } from "@/lib/keyword-metrics";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/keywords")({
  head: () => pageHead("Keyword Research", "Compare Semrush search volume, advertiser competition and organic keyword difficulty before writing your next article."),
  component: KeywordsPage,
});

const field = "w-full rounded-md bg-input/40 border border-border px-3 py-2 text-sm outline-none focus:border-primary";
const number = (value: number | null) => value === null ? "Unknown" : value.toLocaleString();

function KeywordsPage() {
  const research = useServerFn(researchKeywords);
  const [phrase, setPhrase] = useState("");
  const [database, setDatabase] = useState<KeywordMarket>("us");
  const [result, setResult] = useState<(Awaited<ReturnType<typeof researchKeywords>> & { database: KeywordMarket; phrase: string }) | null>(null);
  const [sort, setSort] = useState<keyof Omit<KeywordMetric, "keyword">>("volume");
  const [descending, setDescending] = useState(true);
  const [minVolume, setMinVolume] = useState("");
  const [maxDifficulty, setMaxDifficulty] = useState("");
  const mutation = useMutation({
    mutationFn: async (query: { phrase: string; database: KeywordMarket }) => ({ ...await research({ data: query }), ...query }),
    onSuccess: setResult,
  });
  const rows = [...(result?.rows ?? [])].filter((row) =>
    (!minVolume || (row.volume !== null && row.volume >= Number(minVolume))) &&
    (!maxDifficulty || (row.difficulty !== null && row.difficulty <= Number(maxDifficulty)))
  ).sort((a, b) => {
    const left = a[sort]; const right = b[sort];
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return descending ? right - left : left - right;
  });
  const sortBy = (key: typeof sort) => {
    if (key === sort) setDescending(!descending);
    else { setSort(key); setDescending(key === "volume"); }
  };
  const error = mutation.error instanceof Error ? mutation.error.message : result?.error;
  return <div>
    <PageHeader title="Keyword Research" subtitle="Search demand. Real competition. Your next article." />
    <div className="px-4 md:px-8 pb-12 space-y-6">
      <form onSubmit={(event) => { event.preventDefault(); setResult(null); mutation.mutate({ phrase: phrase.trim(), database }); }} className="grid sm:grid-cols-[minmax(0,1fr)_180px_auto] gap-3 items-end">
        <label className="min-w-0 text-xs text-muted-foreground">Keyword or topic<input required maxLength={200} value={phrase} onChange={(event) => setPhrase(event.target.value)} placeholder="e.g. best hotels in dalhousie" className={`${field} mt-2`} /></label>
        <label className="text-xs text-muted-foreground">Search market<select value={database} onChange={(event) => setDatabase(event.target.value as KeywordMarket)} className={`${field} mt-2`}>{Object.entries(KEYWORD_MARKETS).map(([code, country]) => <option key={code} value={code}>{country}</option>)}</select></label>
        <Button type="submit" disabled={mutation.isPending || !phrase.trim()} className="h-10">{mutation.isPending ? <Loader2 className="animate-spin" /> : <Search />}{mutation.isPending ? "Researching…" : "Research"}</Button>
      </form>
      {error && <div role="alert" className="flex items-start gap-3 border-l-2 border-destructive bg-destructive/10 p-4 text-sm"><AlertCircle className="size-5 shrink-0 text-destructive" />{error}</div>}
      {result?.warning && <p role="status" className="text-sm text-warning">{result.warning}</p>}
      {mutation.isPending && <div role="status" className="py-16 flex justify-center gap-3 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Fetching Semrush metrics…</div>}
      {result && !result.error && <>
        <div className="flex flex-wrap justify-between gap-4 items-end border-t border-border pt-5">
          <div><h2 className="font-display font-semibold text-lg">Keywords for “{result.phrase}”</h2><p className="text-xs text-muted-foreground mt-1">Source: Semrush · {KEYWORD_MARKETS[result.database]} · {rows.length} of {result.rows.length} keywords</p></div>
          <div className="flex gap-3 flex-wrap">
            <label className="text-xs text-muted-foreground">Min. monthly searches<input aria-label="Minimum monthly searches" type="number" min={0} value={minVolume} onChange={(event) => setMinVolume(event.target.value)} placeholder="Any" className={`${field} mt-1 max-w-40`} /></label>
            <label className="text-xs text-muted-foreground">Max. difficulty<input aria-label="Maximum difficulty" type="number" min={0} max={100} value={maxDifficulty} onChange={(event) => setMaxDifficulty(event.target.value)} placeholder="Any" className={`${field} mt-1 max-w-32`} /></label>
          </div>
        </div>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead className="bg-secondary/40 text-muted-foreground text-xs"><tr>
              <th className="px-4 py-3 font-medium">Keyword</th>
              {([["volume", "Monthly searches"], ["competition", "Ad competition"], ["difficulty", "Difficulty / 100"]] as const).map(([key, label]) => <th key={key} aria-sort={sort === key ? descending ? "descending" : "ascending" : "none"}><Button type="button" variant="ghost" size="sm" onClick={() => sortBy(key)}>{label}<ArrowDownUp /></Button></th>)}
              <th className="px-4 py-3"><span className="sr-only">Article action</span></th>
            </tr></thead>
            <tbody>{rows.map((row) => <tr key={row.keyword} className="border-t border-border hover:bg-secondary/20">
              <td className="p-4 font-medium max-w-72 break-words">{row.keyword}</td>
              <td className="p-4 tabular-nums">{number(row.volume)}</td>
              <td className="p-4 tabular-nums">{row.competition === null ? "Unknown" : row.competition.toFixed(2)}</td>
              <td className="p-4 tabular-nums"><span className={row.difficulty === null ? "text-muted-foreground" : row.difficulty <= 30 ? "text-success" : row.difficulty <= 60 ? "text-warning" : "text-destructive"}>{number(row.difficulty)}</span></td>
              <td className="p-4"><Button asChild variant="outline" size="sm"><Link to="/generator" search={{ primaryKeyword: row.keyword, targetCountry: KEYWORD_MARKETS[result.database] }}>Use keyword<ArrowRight /></Link></Button></td>
            </tr>)}</tbody>
          </table>
          {!rows.length && <p className="py-12 px-4 text-center text-muted-foreground">{result.rows.length ? "No keywords match these filters." : "Semrush returned no keywords for this topic and market."}</p>}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">Monthly searches are Semrush estimates for the selected market. Ad competition measures advertisers (0–1), not organic ranking. Difficulty estimates organic competition (0–100); lower is less competitive, not a ranking guarantee. Unknown metrics are not zero.</p>
      </>}
      {!result && !mutation.isPending && !error && <div className="py-16 border-t border-border text-center text-muted-foreground"><Search className="size-9 mx-auto text-accent mb-4" /><h2 className="font-display text-lg text-foreground">Find your next keyword</h2><p className="mt-2 text-sm">No research results yet.</p></div>}
    </div>
  </div>;
}