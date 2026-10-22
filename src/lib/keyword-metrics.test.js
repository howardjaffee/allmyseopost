import { test, expect } from "bun:test";
import { parseKeywordReport, mergeKeywordReports, generatorKeywordSearch } from "./keyword-metrics";

test("each keyword retains concrete volume, advertiser competition and organic difficulty", () => {
  const rows = parseKeywordReport({ data: { columnNames: ["Keyword", "Search Volume", "Competition", "Keyword Difficulty"], rows: [["blog writing", "1200", "0.42", "37"]] } });
  expect(rows).toEqual([{ keyword: "blog writing", volume: 1200, competition: 0.42, difficulty: 37 }]);
});
test("missing difficulty and volume stay unknown, while reported zero remains zero", () => {
  expect(parseKeywordReport({ data: { columnNames: ["Ph", "Nq", "Co", "Kd"], rows: [["a", "", "0", ""], ["b", "0", "", "101"]] } })).toEqual([
    { keyword: "a", volume: null, competition: 0, difficulty: null }, { keyword: "b", volume: 0, competition: null, difficulty: null },
  ]);
});
test("difficulty merges onto the same keyword without losing volume or competition", () => {
  expect(mergeKeywordReports([[{ keyword: "SEO", volume: 900, competition: 0.7, difficulty: null }], [{ keyword: "seo", volume: null, competition: null, difficulty: 52 }]])).toEqual([{ keyword: "SEO", volume: 900, competition: 0.7, difficulty: 52 }]);
});
test("selected keyword and market pass to article creation", () => {
  expect(generatorKeywordSearch({ primaryKeyword: " best hotels ", targetCountry: "India" })).toEqual({ primaryKeyword: "best hotels", targetCountry: "India" });
});