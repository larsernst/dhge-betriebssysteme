export function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export interface StreakInput {
  at: Date;
}

export function computeStreak(events: StreakInput[], now: Date = new Date()): number {
  const days = new Set(events.map((e) => toDayKey(e.at)));
  let cursor = startOfDay(now);

  if (!days.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(toDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface HeatmapBucket {
  date: string;
  count: number;
}

export function buildHeatmap(events: StreakInput[], days = 84, now: Date = new Date()): HeatmapBucket[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const k = toDayKey(e.at);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  const out: HeatmapBucket[] = [];
  const cursor = startOfDay(now);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const k = toDayKey(cursor);
    out.push({ date: k, count: counts.get(k) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export interface LeaderRow {
  questionId: string;
  question: string;
  chapter: number;
  chapterTitle: string;
  lapses: number;
  repetitions: number;
}

export function buildLapsesLeaderboard(
  reviews: { questionId: string; lapses: number; repetitions: number }[],
  questions: Map<string, { question: string; chapter: number; chapterTitle: string }>
): LeaderRow[] {
  return reviews
    .filter((r) => r.lapses > 0)
    .map((r) => {
      const q = questions.get(r.questionId);
      return {
        questionId: r.questionId,
        question: q?.question ?? "(unbekannte Frage)",
        chapter: q?.chapter ?? 0,
        chapterTitle: q?.chapterTitle ?? "",
        lapses: r.lapses,
        repetitions: r.repetitions,
      };
    })
    .sort((a, b) => b.lapses - a.lapses || b.repetitions - a.repetitions)
    .slice(0, 10);
}