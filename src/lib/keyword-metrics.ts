export const KEYWORD_MARKETS = {
  us: "United States", in: "India", uk: "United Kingdom", au: "Australia",
  ca: "Canada", de: "Germany", fr: "France", es: "Spain", br: "Brazil",
} as const;

export type KeywordMarket = keyof typeof KEYWORD_MARKETS;
export type KeywordMetric = {
  keyword: string;
  volume: number | null;
  competition: number | null;
  difficulty: number | null;
};

export function metricNumber(value: unknown, max = Infinity): number | null {
  if (value === null || value === undefined || (typeof value !== "number" && typeof value !== "string")) return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
}

export function parseKeywordReport(report: unknown): KeywordMetric[] {
  if (!report || typeof report !== "object" || !("data" in report)) return [];
  const data = report.data;
  if (!data || typeof data !== "object" || !("columnNames" in data) || !("rows" in data)) return [];
  if (!Array.isArray(data.columnNames) || !Array.isArray(data.rows)) return [];
  const columns = data.columnNames.map((c: unknown) => String(c).toLowerCase().replace(/[^a-z]/g, ""));
  const index = (names: string[]) => columns.findIndex((c) => names.includes(c));
  const keywordIndex = index(["ph", "keyword", "phrase"]);
  const volumeIndex = index(["nq", "searchvolume", "volume"]);
  const competitionIndex = index(["co", "competition", "competitiondensity"]);
  const difficultyIndex = index(["kd", "keyworddifficulty", "keyworddifficultyindex"]);
  const result: KeywordMetric[] = [];
  for (const row of data.rows) {
    if (!Array.isArray(row) || typeof row[keywordIndex] !== "string" || !row[keywordIndex].trim()) continue;
    result.push({ keyword: row[keywordIndex].trim(), volume: metricNumber(row[volumeIndex]), competition: metricNumber(row[competitionIndex], 1), difficulty: metricNumber(row[difficultyIndex], 100) });
  }
  return result;
}

export function mergeKeywordReports(reports: KeywordMetric[][]): KeywordMetric[] {
  const rows = new Map<string, KeywordMetric>();
  for (const report of reports) for (const row of report) {
    const key = row.keyword.toLowerCase();
    const previous = rows.get(key);
    rows.set(key, { keyword: previous?.keyword ?? row.keyword, volume: row.volume ?? previous?.volume ?? null, competition: row.competition ?? previous?.competition ?? null, difficulty: row.difficulty ?? previous?.difficulty ?? null });
  }
  return [...rows.values()];
}

export function generatorKeywordSearch(input: Record<string, unknown>) {
  return {
    primaryKeyword: typeof input.primaryKeyword === "string" ? input.primaryKeyword.trim().slice(0, 200) : undefined,
    targetCountry: typeof input.targetCountry === "string" && Object.values(KEYWORD_MARKETS).some((country) => country === input.targetCountry) ? input.targetCountry : undefined,
  };
}