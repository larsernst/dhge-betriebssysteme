import { describe, expect, it } from "vitest";
import { buildHeatmap, buildLapsesLeaderboard, computeStreak, toDayKey } from "@/lib/stats";

const NOW = new Date("2026-07-10T12:00:00Z");
function day(offset: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offset);
  return d;
}

describe("toDayKey", () => {
  it("formats a date as YYYY-MM-DD (local)", () => {
    const d = new Date(2026, 6, 9, 15, 30);
    expect(toDayKey(d)).toBe("2026-07-09");
  });
});

describe("computeStreak", () => {
  it("returns 0 when there are no reviews", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const events = [{ at: day(0) }, { at: day(-1) }, { at: day(-2) }];
    expect(computeStreak(events, NOW)).toBe(3);
  });

  it("still counts a streak ending yesterday (no review yet today)", () => {
    const events = [{ at: day(-1) }, { at: day(-2) }];
    expect(computeStreak(events, NOW)).toBe(2);
  });

  it("breaks on a gap", () => {
    const events = [{ at: day(0) }, { at: day(-1) }, { at: day(-3) }];
    expect(computeStreak(events, NOW)).toBe(2);
  });

  it("ignores time of day (multiple same-day reviews count once)", () => {
    const events = [
      { at: new Date("2026-07-10T08:00:00Z") },
      { at: new Date("2026-07-10T22:00:00Z") },
      { at: new Date("2026-07-09T10:00:00Z") },
    ];
    expect(computeStreak(events, NOW)).toBe(2);
  });
});

describe("buildHeatmap", () => {
  it("returns the requested number of day buckets", () => {
    const hm = buildHeatmap([], 84, NOW);
    expect(hm).toHaveLength(84);
    expect(hm[hm.length - 1].date).toBe(toDayKey(NOW));
  });

  it("aggregates counts per day", () => {
    const events = [{ at: day(0) }, { at: day(0) }, { at: day(-1) }];
    const hm = buildHeatmap(events, 7, NOW);
    const today = hm[hm.length - 1];
    const yest = hm[hm.length - 2];
    expect(today.count).toBe(2);
    expect(yest.count).toBe(1);
  });

  it("fills empty days with 0", () => {
    const hm = buildHeatmap([], 7, NOW);
    expect(hm.every((b) => b.count === 0)).toBe(true);
  });
});

describe("buildLapsesLeaderboard", () => {
  const questions = new Map([
    ["q1", { question: "Was ist ein Deadlock?", chapter: 1, chapterTitle: "Einführung" }],
    ["q2", { question: "Wie funktioniert Paging?", chapter: 4, chapterTitle: "Speicherverwaltung" }],
  ]);

  it("filters out cards with 0 lapses", () => {
    const reviews = [
      { questionId: "q1", lapses: 2, repetitions: 5 },
      { questionId: "q2", lapses: 0, repetitions: 3 },
    ];
    const board = buildLapsesLeaderboard(reviews, questions);
    expect(board).toHaveLength(1);
    expect(board[0].questionId).toBe("q1");
  });

  it("sorts by lapses descending", () => {
    const reviews = [
      { questionId: "q1", lapses: 1, repetitions: 2 },
      { questionId: "q2", lapses: 5, repetitions: 6 },
    ];
    const board = buildLapsesLeaderboard(reviews, questions);
    expect(board[0].questionId).toBe("q2");
    expect(board[0].lapses).toBe(5);
    expect(board[1].questionId).toBe("q1");
  });

  it("limits to 10 rows", () => {
    const reviews = Array.from({ length: 15 }, (_, i) => ({
      questionId: `q${i}`,
      lapses: i + 1,
      repetitions: i,
    }));
    const board = buildLapsesLeaderboard(reviews, new Map());
    expect(board).toHaveLength(10);
  });
});