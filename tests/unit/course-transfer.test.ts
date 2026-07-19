import { describe, expect, test } from "vitest";
import { parseCourseImport } from "@/lib/course-transfer";

describe("parseCourseImport", () => {
  test("gültige Recall-Frage (Listen-Format und Export-Format)", () => {
    const q = {
      question: "Was ist ein Deadlock?",
      answer: "Gegenseitiges Blockieren.",
      sourceRef: "skript.md",
    };
    const listResult = parseCourseImport({ questions: [q] });
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.items).toHaveLength(1);
      expect(listResult.items[0].taskType).toBe("recall");
      expect(listResult.items[0].payload).toBeNull();
      expect(listResult.items[0].id).toBe("import-1");
    }
    // Auch das Kurs-Export-Format (mit format/course/chapters-Wrapper)
    const exportResult = parseCourseImport({
      format: "lernapp-course@1",
      course: { title: "T", slug: "t", description: "" },
      chapters: [],
      questions: [q],
    });
    expect(exportResult.ok).toBe(true);
  });

  test("MCQ via mcqOptions (Legacy) wird zu taskType/payload gemappt", () => {
    const result = parseCourseImport({
      questions: [
        {
          question: "Welche sind richtig?",
          answer: "A.",
          sourceRef: "x.md",
          mcqOptions: [
            { id: "o1", text: "A", correct: true },
            { id: "o2", text: "B", correct: false },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items[0].taskType).toBe("mcq");
      expect(result.items[0].payload).toEqual({
        options: [
          { id: "o1", text: "A", correct: true },
          { id: "o2", text: "B", correct: false },
        ],
      });
    }
  });

  test("Fehler pro Eintrag: ungültiges Payload, unbekannter Typ, doppelte ID", () => {
    const result = parseCourseImport({
      questions: [
        {
          id: "dup",
          question: "Q1?",
          answer: "A.",
          sourceRef: "x",
          taskType: "mcq",
          payload: { options: [] }, // zu wenige Optionen
        },
        {
          id: "dup",
          question: "Q2?",
          answer: "A.",
          sourceRef: "x",
        },
        {
          id: "typ",
          question: "Q3?",
          answer: "A.",
          sourceRef: "x",
          taskType: "quiz",
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].message).toContain("mcq-Schema");
      expect(result.errors[1].message).toContain("Doppelte ID");
      expect(result.errors[2].message).toContain("taskType");
    }
  });

  test("Schema-Fehler (fehlende Pflichtfelder) werden gemeldet", () => {
    const result = parseCourseImport({ questions: [{ question: "Nur Frage" }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0].message).toContain("answer");
  });

  test("chapterSlug/order/confidence werden übernommen", () => {
    const result = parseCourseImport({
      questions: [
        {
          question: "Q?",
          answer: "A.",
          sourceRef: "x",
          chapterSlug: "kap-2",
          order: 7,
          confidence: "low",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items[0].chapterSlug).toBe("kap-2");
      expect(result.items[0].order).toBe(7);
      expect(result.items[0].confidence).toBe("low");
    }
  });
});
