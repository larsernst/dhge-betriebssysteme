"use client";

import { useState } from "react";

type McqOptionData = { id: string; text: string; correct: boolean };

type QuestionData = {
  id: string;
  chapter: number;
  chapterTitle: string;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: string | null;
  mcqOptions: McqOptionData[] | null;
};

type CourseData = {
  id: string;
  title: string;
  questions: QuestionData[];
};

export default function KurseClient({ courses }: { courses: CourseData[] }) {
  const [activeCourse, setActiveCourse] = useState(courses[0]?.id ?? "");
  const [questions, setQuestions] = useState<Record<string, QuestionData[]>>(
    Object.fromEntries(courses.map((c) => [c.id, c.questions]))
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const course = courses.find((c) => c.id === activeCourse) ?? null;
  const courseQuestions = questions[activeCourse] ?? [];

  function groupByChapter(qs: QuestionData[]) {
    const map = new Map<number, { chapter: number; chapterTitle: string; items: QuestionData[] }>();
    for (const q of qs) {
      const entry = map.get(q.chapter) ?? { chapter: q.chapter, chapterTitle: q.chapterTitle, items: [] };
      entry.items.push(q);
      map.set(q.chapter, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.chapter - b.chapter);
  }

  async function deleteQuestion(q: QuestionData) {
    if (!window.confirm(`Frage „${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""}" wirklich löschen? Alle Nutzerfortschritte zu dieser Frage gehen verloren.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => ({
      ...prev,
      [activeCourse]: (prev[activeCourse] ?? []).filter((x) => x.id !== q.id),
    }));
    setSuccess("Frage gelöscht.");
  }

  async function addQuestion(data: {
    chapter: number;
    chapterTitle: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    isMcq: boolean;
    mcqOptions: McqOptionData[];
  }) {
    setError(null);
    setSuccess(null);
    const id = `${data.chapter}-${slugify(data.question).slice(0, 40)}-${Date.now().toString(36)}`;
    const payload = {
      questions: [
        {
          id,
          courseId: activeCourse,
          chapter: data.chapter,
          chapterTitle: data.chapterTitle,
          question: data.question,
          answer: data.answer,
          sourceRef: data.sourceRef,
          confidence: data.confidence || undefined,
          mcqOptions: data.isMcq ? data.mcqOptions : undefined,
        },
      ],
    };
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Frage konnte nicht hinzugefügt werden.");
      return false;
    }
    const newQ: QuestionData = {
      id,
      chapter: data.chapter,
      chapterTitle: data.chapterTitle,
      question: data.question,
      answer: data.answer,
      sourceRef: data.sourceRef,
      confidence: data.confidence || null,
      mcqOptions: data.isMcq ? data.mcqOptions : null,
    };
    setQuestions((prev) => ({
      ...prev,
      [activeCourse]: [...(prev[activeCourse] ?? []), newQ],
    }));
    setSuccess("Frage hinzugefügt.");
    setShowForm(false);
    return true;
  }

  if (!course) {
    return <p className="muted">Keine Kurse vorhanden.</p>;
  }

  return (
    <div className="stack">
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}

      <div className="tabs">
        {courses.map((c) => (
          <a
            key={c.id}
            className={`tab${c.id === activeCourse ? " tab--active" : ""}`}
            style={{ cursor: "pointer" }}
            onClick={() => { setActiveCourse(c.id); setShowForm(false); setError(null); setSuccess(null); }}
          >
            {c.title} ({questions[c.id]?.length ?? 0})
          </a>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => { setShowForm(!showForm); setError(null); setSuccess(null); }}
        >
          {showForm ? "Abbrechen" : "Neue Frage"}
        </button>
      </div>

      {showForm && (
        <AddQuestionForm
          onSubmit={async (data) => { await addQuestion(data); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {courseQuestions.length === 0 ? (
        <p className="muted">Keine Fragen in diesem Kurs.</p>
      ) : (
        groupByChapter(courseQuestions).map((ch) => (
          <div key={ch.chapter}>
            <div className="row row--between" style={{ flexWrap: "wrap", marginTop: 24, marginBottom: 8 }}>
              <strong>Kapitel {ch.chapter} · {ch.chapterTitle}</strong>
              <span className="badge badge--muted">{ch.items.length} Fragen</span>
            </div>
            <div className="stack">
              {ch.items.map((q) => (
                <QuestionRow key={q.id} question={q} onDelete={() => deleteQuestion(q)} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function QuestionRow({ question: q, onDelete }: { question: QuestionData; onDelete: () => void }) {
  const isMcq = q.mcqOptions !== null && q.mcqOptions !== undefined && q.mcqOptions.length > 0;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4, flex: 1, minWidth: 200 }}>
          <strong style={{ fontSize: 15 }}>{q.question}</strong>
          <span className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {q.answer.slice(0, 150)}{q.answer.length > 150 ? "…" : ""}
          </span>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>
              {isMcq ? "Multiple-Choice" : "Freie Erinnerung"}
            </span>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{q.sourceRef}</span>
            {q.confidence === "low" && (
              <span className="badge badge--warn" style={{ fontSize: 11 }}>prüfen</span>
            )}
          </div>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}>
          Löschen
        </button>
      </div>
    </div>
  );
}

function AddQuestionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    chapter: number;
    chapterTitle: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    isMcq: boolean;
    mcqOptions: McqOptionData[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [chapter, setChapter] = useState("1");
  const [chapterTitle, setChapterTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [confidence, setConfidence] = useState<"high" | "low" | "">("");
  const [isMcq, setIsMcq] = useState(false);
  const [mcqOptions, setMcqOptions] = useState<McqOptionData[]>([
    { id: "opt-1", text: "", correct: false },
    { id: "opt-2", text: "", correct: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function addOption() {
    setMcqOptions((prev) => [...prev, { id: `opt-${prev.length + 1}`, text: "", correct: false }]);
  }
  function removeOption(idx: number) {
    setMcqOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      chapter: Number(chapter) || 1,
      chapterTitle,
      question,
      answer,
      sourceRef,
      confidence,
      isMcq,
      mcqOptions: mcqOptions.map((o, i) => ({ ...o, id: `opt-${i + 1}` })),
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ padding: 20 }}>
      <h3 style={{ margin: 0 }}>Neue Frage hinzufügen</h3>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 80px" }}>
          <label>Kapitel</label>
          <input
            className="input"
            type="number"
            min={1}
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Kapiteltitel</label>
          <input
            className="input"
            value={chapterTitle}
            onChange={(e) => setChapterTitle(e.target.value)}
            placeholder="z. B. Einführung"
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Frage</label>
        <textarea
          className="textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="z. B. Welche Aufgaben hat ein Betriebssystem?"
          required
        />
      </div>
      <div className="field">
        <label>Antwort</label>
        <textarea
          className="textarea"
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
      </div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: 1, minWidth: 200 }}>
          <label>Quelle (sourceRef)</label>
          <input
            className="input"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            placeholder="z. B. Kapitel1.md"
            required
          />
        </div>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label>Confidence</label>
          <select
            className="input"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as "high" | "low" | "")}
          >
            <option value="">—</option>
            <option value="high">high</option>
            <option value="low">low</option>
          </select>
        </div>
      </div>
      <label className="row" style={{ gap: 8, alignItems: "center", fontSize: 14 }}>
        <input type="checkbox" checked={isMcq} onChange={(e) => setIsMcq(e.target.checked)} />
        Multiple-Choice-Frage
      </label>
      {isMcq && (
        <div className="stack">
          <span className="muted" style={{ fontSize: 13 }}>Antwort-Optionen</span>
          {mcqOptions.map((opt, idx) => (
            <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 200 }}>
                <label>Option {idx + 1}</label>
                <input
                  className="input"
                  value={opt.text}
                  onChange={(e) => setMcqOptions((prev) => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))}
                  placeholder="Antworttext …"
                />
              </div>
              <label className="row" style={{ gap: 6, alignItems: "center", fontSize: 13, paddingBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={opt.correct}
                  onChange={(e) => setMcqOptions((prev) => prev.map((o, i) => i === idx ? { ...o, correct: e.target.checked } : o))}
                />
                richtig
              </label>
              {mcqOptions.length > 2 && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeOption(idx)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--secondary btn--sm" onClick={addOption}>
            Option hinzufügen
          </button>
        </div>
      )}
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--primary btn--sm" disabled={submitting}>
          {submitting ? "Speichert …" : "Frage speichern"}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
