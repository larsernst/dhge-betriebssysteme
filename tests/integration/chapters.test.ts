// Integrations-Tests für das Kapitel-/Curriculum-Datenmodell (Phase E2):
// Unique-Constraint (courseId, slug), Reorder-Transaktionen, Lösch-
// Entkopplung von Fragen und das Question.order-Feld (Migration 0015).

import { beforeAll, beforeEach, afterAll, describe, expect, test } from "vitest";
import {
  ensureIntegrationDb,
  integrationDbUrl,
  prismaFor,
  runScript,
  truncateAll,
} from "./helpers";

const dbUrl = integrationDbUrl();
const dbOk = dbUrl !== null && (await ensureIntegrationDb(dbUrl));
const prisma = dbOk ? prismaFor(dbUrl!) : (null as never);

describe.skipIf(!dbOk)("chapters/curriculum (Integration)", () => {
  beforeAll(async () => {
    const deploy = await runScript(["prisma", "migrate", "deploy"], dbUrl!);
    expect(deploy.code).toBe(0);
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    await prisma.course.create({
      data: {
        id: "it-cur",
        slug: "it-cur",
        title: "Curriculum-Test",
        description: "",
        order: 1,
        status: "published",
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function createChapter(slug: string, title: string, order: number) {
    return prisma.chapter.create({
      data: { courseId: "it-cur", slug, title, order },
    });
  }

  test("Unique-Constraint (courseId, slug) wird durchgesetzt", async () => {
    await createChapter("kap-1", "Kapitel 1", 1);
    await expect(createChapter("kap-1", "Dublette", 2)).rejects.toThrow();
    // Gleiche Slug in anderem Kurs ist erlaubt.
    await prisma.course.create({
      data: { id: "it-cur-2", slug: "it-cur-2", title: "Zweiter", description: "", order: 2, status: "draft" },
    });
    const ok = await prisma.chapter.create({
      data: { courseId: "it-cur-2", slug: "kap-1", title: "Gleiche Slug, anderer Kurs", order: 1 },
    });
    expect(ok.courseId).toBe("it-cur-2");
  });

  test("Reorder-Transaktion setzt lückenlose Reihenfolge", async () => {
    const a = await createChapter("a", "A", 1);
    const b = await createChapter("b", "B", 2);
    const c = await createChapter("c", "C", 3);
    await prisma.$transaction(
      [c, a, b].map((ch, i) =>
        prisma.chapter.update({ where: { id: ch.id }, data: { order: i + 1 } })
      )
    );
    const ordered = await prisma.chapter.findMany({
      where: { courseId: "it-cur" },
      orderBy: { order: "asc" },
    });
    expect(ordered.map((x) => x.slug)).toEqual(["c", "a", "b"]);
    expect(ordered.map((x) => x.order)).toEqual([1, 2, 3]);
  });

  test("Kapitel-Löschung entkoppelt Fragen (chapterId -> null)", async () => {
    const ch = await createChapter("kap", "Kapitel", 1);
    await prisma.question.create({
      data: {
        id: "it-cur-q1",
        courseId: "it-cur",
        chapter: 1,
        chapterTitle: "Kapitel",
        chapterId: ch.id,
        question: "Frage?",
        answer: "Antwort.",
        sourceRef: "it",
        taskType: "recall",
        payload: null as never,
      },
    });
    await prisma.question.updateMany({
      where: { chapterId: ch.id },
      data: { chapterId: null },
    });
    await prisma.chapter.delete({ where: { id: ch.id } });
    const q = await prisma.question.findUnique({ where: { id: "it-cur-q1" } });
    expect(q?.chapterId).toBeNull();
    expect(await prisma.chapter.count({ where: { courseId: "it-cur" } })).toBe(0);
  });

  test("Question.order (Migration 0015): Default 0 und Reorder", async () => {
    const ch = await createChapter("kap", "Kapitel", 1);
    const mk = (id: string) =>
      prisma.question.create({
        data: {
          id,
          courseId: "it-cur",
          chapter: 1,
          chapterTitle: "Kapitel",
          chapterId: ch.id,
          question: `${id}?`,
          answer: "Antwort.",
          sourceRef: "it",
          taskType: "recall",
          payload: null as never,
        },
      });
    await mk("q-a");
    await mk("q-b");
    // Default aus der Migration: 0
    const before = await prisma.question.findMany({
      where: { courseId: "it-cur" },
      select: { id: true, order: true },
    });
    expect(before.every((q) => q.order === 0)).toBe(true);

    await prisma.$transaction([
      prisma.question.update({ where: { id: "q-b" }, data: { order: 1 } }),
      prisma.question.update({ where: { id: "q-a" }, data: { order: 2 } }),
    ]);
    const ordered = await prisma.question.findMany({
      where: { courseId: "it-cur" },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    expect(ordered.map((q) => q.id)).toEqual(["q-b", "q-a"]);
  });
});
