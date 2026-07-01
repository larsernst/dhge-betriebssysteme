"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { intervalLabel, type ReviewGrade } from "@/lib/sm2";
import type { QuestionPublic, ReviewNextResponse } from "@/lib/types";

type Feedback =
  | { kind: "recall"; text: string }
  | { kind: "mcq"; correct: boolean; correctIds: string[] | null; text: string }
  | null;

export default function StudyClient() {
  const [data, setData] = useState<ReviewNextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadNext() {
    setLoading(true);
    setRevealed(false);
    setDraft("");
    setSelected([]);
    setFeedback(null);
    setError(null);
    const res = await fetch("/api/review/next");
    setLoading(false);
    if (!res.ok) {
      setError("Karte konnte nicht geladen werden.");
      setData(null);
      return;
    }
    const json = (await res.json()) as ReviewNextResponse;
    setData(json);
  }

  useEffect(() => {
    loadNext();
  }, []);

  async function gradeRecall(grade: ReviewGrade) {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: data.review.question.id, grade, isNew: data.isNew }),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError("Bewertung konnte nicht gespeichert werden.");
      return;
    }
    const result = (await res.json()) as { intervalDays: number };
    setFeedback({
      kind: "recall",
      text:
        grade === "again"
          ? "Wird heute erneut angezeigt."
          : `Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`,
    });
    scheduleNext();
  }

  async function submitMcq() {
    if (!data?.review) return;
    setSubmitting(true);
    const res = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: data.review.question.id,
        selectedOptionIds: selected,
        isNew: data.isNew,
      }),
    });
    if (!res.ok) {
      setSubmitting(false);
      setError("Auswertung konnte nicht gespeichert werden.");
      return;
    }
    const result = (await res.json()) as {
      mcqCorrect: boolean | null;
      correctOptionIds: string[] | null;
      intervalDays: number;
    };
    const correct = result.mcqCorrect === true;
    setFeedback({
      kind: "mcq",
      correct,
      correctIds: result.correctOptionIds,
      text: correct
        ? `Richtig! Nächste Wiederholung ${intervalLabel(result.intervalDays)}.`
        : "Falsch – wird heute erneut angezeigt.",
    });
    setRevealed(true);
    scheduleNext(1600);
  }

  function scheduleNext(delay = 900) {
    setTimeout(() => {
      setSubmitting(false);
      loadNext();
    }, delay);
  }

  if (loading) {
    return <p className="muted">Lade nächste Frage …</p>;
  }

  if (error) {
    return (
      <div className="card">
        <p className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </p>
        <button className="btn btn--secondary" onClick={loadNext}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data || !data.review) {
    return (
      <div className="card">
        <span className="badge badge--success">Alles fällige gelernt</span>
        <h2>Für heute erledigt!</h2>
        <p className="muted">
          Du hast alle Fragen einmal gelernt oder bist mit den fälligen Wiederholungen durch.
          Komm später wieder, um Spaced Repetition weiterlaufen zu lassen.
        </p>
        <div className="row">
          <button className="btn btn--secondary" onClick={loadNext}>
            Nach weiteren neuen Fragen suchen
          </button>
          <Link href="/katalog" className="btn btn--ghost">
            Alle Fragen ansehen
          </Link>
        </div>
      </div>
    );
  }

  const q = data.review.question;
  const isMcq = q.mcqOptions !== null && q.mcqOptions !== undefined && q.mcqOptions.length > 0;
  const correctIds = feedback?.kind === "mcq" ? feedback.correctIds : null;

  return (
    <div className="stack">
      <div className="row row--between">
        <span className="badge">
          Kapitel {q.chapter} · {q.chapterTitle}
        </span>
        {data.isNew ? (
          <span className="badge badge--muted">Neu</span>
        ) : (
          <span className="badge badge--success">Wiederholung</span>
        )}
      </div>

      <div className="card">
        <p className="review-question">{q.question}</p>
      </div>

      {isMcq ? (
        <McqQuestion
          options={q.mcqOptions!}
          selected={selected}
          disabled={submitting || revealed}
          correctIds={correctIds}
          onToggle={(id) =>
            setSelected((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onSubmit={submitMcq}
          revealed={revealed}
        />
      ) : (
        <RecallQuestion
          draft={draft}
          onDraft={setDraft}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          submitting={submitting}
          onGrade={gradeRecall}
        />
      )}

      {revealed && (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Musterantwort
          </p>
          <div className="review-answer">{q.answer}</div>
        </div>
      )}

      {feedback && (
        <p
          className="muted"
          style={{
            textAlign: "center",
            color:
              feedback.kind === "mcq"
                ? feedback.correct
                  ? "var(--ds-chart-green)"
                  : "var(--ds-chart-red)"
                : undefined,
          }}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}

function RecallQuestion(props: {
  draft: string;
  onDraft: (v: string) => void;
  revealed: boolean;
  onReveal: () => void;
  submitting: boolean;
  onGrade: (g: ReviewGrade) => void;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="draft">Deine Antwort</label>
        <textarea
          id="draft"
          className="textarea"
          placeholder="Schreibe frei, woran du dich erinnerst …"
          value={props.draft}
          onChange={(e) => props.onDraft(e.target.value)}
        />
      </div>
      {!props.revealed ? (
        <button className="btn btn--primary" onClick={props.onReveal}>
          Musterantwort zeigen
        </button>
      ) : (
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>
            Wie gut warst du?
          </p>
          <div className="review-actions">
            <button
              className="grade-btn grade-btn--again"
              disabled={props.submitting}
              onClick={() => props.onGrade("again")}
            >
              Again<small>völlig falsch</small>
            </button>
            <button
              className="grade-btn"
              disabled={props.submitting}
              onClick={() => props.onGrade("hard")}
            >
              Hard<small>mit Mühe</small>
            </button>
            <button
              className="grade-btn grade-btn--good"
              disabled={props.submitting}
              onClick={() => props.onGrade("good")}
            >
              Good<small>korrekt</small>
            </button>
            <button
              className="grade-btn"
              disabled={props.submitting}
              onClick={() => props.onGrade("easy")}
            >
              Easy<small>mühelos</small>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function McqQuestion(props: {
  options: { id: string; text: string }[];
  selected: string[];
  disabled: boolean;
  correctIds: string[] | null;
  revealed: boolean;
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  const selectionCount = props.selected.length;
  return (
    <>
      <p className="muted" style={{ fontSize: 14 }}>
        Mehrere Antworten sind richtig. Wähle alle zutreffenden aus.
      </p>
      <div className="stack">
        {props.options.map((o) => {
          const checked = props.selected.includes(o.id);
          const isCorrect = props.correctIds?.includes(o.id) ?? false;
          let cls = "mcq-option";
          if (props.revealed) {
            if (isCorrect) cls += " mcq-option--correct";
            else if (checked) cls += " mcq-option--wrong";
          } else if (checked) {
            cls += " mcq-option--selected";
          }
          return (
            <label key={o.id} className={cls}>
              <input
                type="checkbox"
                checked={checked}
                disabled={props.disabled}
                onChange={() => props.onToggle(o.id)}
              />
              <span>{o.text}</span>
            </label>
          );
        })}
      </div>
      {!props.revealed ? (
        <button
          className="btn btn--primary"
          onClick={props.onSubmit}
          disabled={props.disabled || selectionCount === 0}
        >
          {selectionCount === 0 ? "Bitte Optionen wählen" : "Auswerten"}
        </button>
      ) : null}
    </>
  );
}