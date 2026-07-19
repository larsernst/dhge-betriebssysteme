"use client";

import { useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/markdown";

type McqOptionData = { id: string; text: string; correct: boolean };

type ChapterData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
};

type QuestionData = {
  id: string;
  chapter: number;
  chapterTitle: string;
  chapterId: string | null;
  question: string;
  answer: string;
  sourceRef: string;
  confidence: string | null;
  taskType: string | null;
  payload: unknown;
  order: number;
};

type CourseInfo = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
};

const UNASSIGNED = "__unassigned__";

const TYPE_LABELS: Record<string, string> = {
  recall: "Freie Erinnerung",
  mcq: "Multiple-Choice",
  dragdrop: "Zuordnen",
  cloze: "Lückentext",
  order: "Sortieren",
  code: "Code",
};

export default function CurriculumClient({
  course,
  chapters: initialChapters,
  questions: initialQuestions,
}: {
  course: CourseInfo;
  chapters: ChapterData[];
  questions: QuestionData[];
}) {
  const [chapters, setChapters] = useState<ChapterData[]>(initialChapters);
  const [questions, setQuestions] = useState<QuestionData[]>(initialQuestions);
  const [activeChapter, setActiveChapter] = useState<string>(
    initialChapters[0]?.id ?? UNASSIGNED
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [dragChapterId, setDragChapterId] = useState<string | null>(null);

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const unassignedCount = questions.filter((q) => q.chapterId === null).length;
  const chapterQuestions = (chapterId: string | null) =>
    questions
      .filter((q) => q.chapterId === chapterId)
      .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  const activeId = activeChapter === UNASSIGNED ? null : activeChapter;
  const activeQuestions = chapterQuestions(activeId);
  const activeChapterData = sortedChapters.find((c) => c.id === activeId) ?? null;

  function chapterQuestionCount(id: string) {
    return questions.filter((q) => q.chapterId === id).length;
  }

  // ── Kapitel-Aktionen ────────────────────────────────────────────────
  async function addChapter() {
    const title = newChapterTitle.trim();
    if (!title) return;
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Kapitel konnte nicht angelegt werden.");
      return;
    }
    const json = await res.json();
    setChapters((prev) => [...prev, json.chapter]);
    setNewChapterTitle("");
    setActiveChapter(json.chapter.id);
    setSuccess("Kapitel angelegt.");
  }

  async function renameChapter(id: string) {
    const title = renameTitle.trim();
    if (!title) return;
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Umbenennen fehlgeschlagen.");
      return;
    }
    setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    setQuestions((prev) => prev.map((q) => (q.chapterId === id ? { ...q, chapterTitle: title } : q)));
    setRenamingId(null);
    setSuccess("Kapitel umbenannt.");
  }

  async function persistChapterOrder(ordered: ChapterData[]) {
    setChapters(ordered);
    const res = await fetch(`/api/courses/${course.id}/chapters/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ordered.map((c) => c.id) }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sortierung fehlgeschlagen.");
    }
  }

  function moveChapter(id: string, dir: -1 | 1) {
    const list = [...sortedChapters];
    const idx = list.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    void persistChapterOrder(list.map((c, i) => ({ ...c, order: i + 1 })));
  }

  function dropChapter(targetId: string) {
    if (!dragChapterId || dragChapterId === targetId) return;
    const list = [...sortedChapters];
    const from = list.findIndex((c) => c.id === dragChapterId);
    const to = list.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDragChapterId(null);
    void persistChapterOrder(list.map((c, i) => ({ ...c, order: i + 1 })));
  }

  async function deleteChapter(ch: ChapterData) {
    const count = chapterQuestionCount(ch.id);
    if (
      !window.confirm(
        `Kapitel „${ch.title}" wirklich löschen?` +
          (count > 0
            ? `\n${count} Frage(n) bleiben erhalten und landen unter „Nicht zugeordnet".`
            : "")
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/courses/${course.id}/chapters/${ch.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setChapters((prev) => prev.filter((c) => c.id !== ch.id));
    setQuestions((prev) => prev.map((q) => (q.chapterId === ch.id ? { ...q, chapterId: null } : q)));
    if (activeChapter === ch.id) setActiveChapter(UNASSIGNED);
    setSuccess("Kapitel gelöscht – Fragen sind nun nicht zugeordnet.");
  }

  // ── Fragen-Aktionen ─────────────────────────────────────────────────
  async function deleteQuestion(q: QuestionData) {
    if (
      !window.confirm(
        `Frage „${q.question.slice(0, 60)}${q.question.length > 60 ? "…" : ""}" wirklich löschen? Alle Nutzerfortschritte zu dieser Frage gehen verloren.`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => prev.filter((x) => x.id !== q.id));
    setSuccess("Frage gelöscht.");
  }

  async function editQuestion(id: string, data: { question: string; answer: string }) {
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Speichern fehlgeschlagen.");
      return false;
    }
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: data.question, answer: data.answer } : q))
    );
    setSuccess("Frage aktualisiert.");
    return true;
  }

  async function moveQuestion(q: QuestionData, targetChapterId: string | null) {
    setError(null);
    const res = await fetch(`/api/admin/questions/${encodeURIComponent(q.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: targetChapterId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Verschieben fehlgeschlagen.");
      return;
    }
    const target = chapters.find((c) => c.id === targetChapterId);
    setQuestions((prev) =>
      prev.map((x) =>
        x.id === q.id
          ? {
              ...x,
              chapterId: targetChapterId,
              chapter: target?.order ?? x.chapter,
              chapterTitle: target?.title ?? x.chapterTitle,
            }
          : x
      )
    );
    setSuccess(target ? `Frage nach „${target.title}" verschoben.` : "Frage ist nun nicht zugeordnet.");
  }

  async function duplicateQuestion(q: QuestionData) {
    setError(null);
    const id = `${q.id}-kopie-${Date.now().toString(36)}`;
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [
          {
            id,
            courseId: course.id,
            chapterId: q.chapterId ?? undefined,
            chapter: q.chapter,
            chapterTitle: q.chapterTitle,
            question: `${q.question} (Kopie)`,
            answer: q.answer,
            sourceRef: q.sourceRef,
            confidence: q.confidence ?? undefined,
            taskType: (q.taskType ?? "recall") as "recall",
            payload: q.payload ?? undefined,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Duplizieren fehlgeschlagen.");
      return;
    }
    setQuestions((prev) => [
      ...prev,
      { ...q, id, question: `${q.question} (Kopie)`, order: q.order + 1 },
    ]);
    setSuccess("Frage dupliziert.");
  }

  async function moveQuestionOrder(q: QuestionData, dir: -1 | 1) {
    const list = [...activeQuestions];
    const idx = list.findIndex((x) => x.id === q.id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap], list[idx]];
    const reordered = list.map((x, i) => ({ ...x, order: i + 1 }));
    setQuestions((prev) => prev.map((x) => reordered.find((r) => r.id === x.id) ?? x));
    const res = await fetch(
      `/api/courses/${course.id}/questions/reorder?chapter=${activeId ?? "null"}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((x) => x.id) }),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Sortierung fehlgeschlagen.");
    }
  }

  async function addQuestion(data: {
    chapterId: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    taskType: "recall" | "mcq" | "dragdrop" | "cloze" | "order" | "code";
    taskPayload: unknown;
  }) {
    setError(null);
    const chapter = chapters.find((c) => c.id === data.chapterId);
    if (!chapter) {
      setError("Bitte ein Kapitel wählen.");
      return false;
    }
    const id = `${chapter.order}-${slugify(data.question).slice(0, 40)}-${Date.now().toString(36)}`;
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [
          {
            id,
            courseId: course.id,
            chapterId: chapter.id,
            chapter: chapter.order,
            chapterTitle: chapter.title,
            question: data.question,
            answer: data.answer,
            sourceRef: data.sourceRef,
            confidence: data.confidence || undefined,
            taskType: data.taskType,
            payload: data.taskPayload,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Frage konnte nicht hinzugefügt werden.");
      return false;
    }
    const newQ: QuestionData = {
      id,
      chapter: chapter.order,
      chapterTitle: chapter.title,
      chapterId: chapter.id,
      question: data.question,
      answer: data.answer,
      sourceRef: data.sourceRef,
      confidence: data.confidence || null,
      taskType: data.taskType,
      payload: data.taskPayload ?? null,
      order: chapterQuestions(chapter.id).length + 1,
    };
    setQuestions((prev) => [...prev, newQ]);
    setSuccess("Frage hinzugefügt.");
    setShowForm(false);
    return true;
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="stack">
      <Notice error={error} success={success} />

      <div className="card" style={{ padding: 16 }}>
        <div className="row row--between" style={{ flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 4, flex: 1, minWidth: 200 }}>
            <strong>{course.title}</strong>
            {course.description && (
              <span className="muted" style={{ fontSize: 13 }}>{course.description}</span>
            )}
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {course.status === "published" ? "Veröffentlicht" : "Entwurf"}
              </span>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                /kurs/{course.slug}
              </span>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                {sortedChapters.length} Kapitel · {questions.length} Fragen
              </span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Link href={`/kurs/${course.id}`} className="btn btn--ghost btn--sm">
              Als Lernender ansehen
            </Link>
            <Link href={`/editor/kurs/${course.id}/einstellungen`} className="btn btn--ghost btn--sm">
              Einstellungen
            </Link>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 280px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
        className="curriculum-grid"
      >
        {/* ── Kapitel-Spalte ── */}
        <div className="card" style={{ padding: 12 }}>
          <div className="row row--between" style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 14 }}>Kapitel</strong>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{sortedChapters.length}</span>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            {sortedChapters.map((ch, idx) => (
              <div
                key={ch.id}
                draggable
                onDragStart={() => setDragChapterId(ch.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dropChapter(ch.id)}
                onDragEnd={() => setDragChapterId(null)}
                style={{
                  border: `1px solid ${ch.id === activeId ? "var(--ds-brand, #1868db)" : "var(--ds-border)"}`,
                  borderRadius: "var(--ds-radius)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: ch.id === activeId ? "rgba(24,104,219,0.06)" : undefined,
                  opacity: dragChapterId === ch.id ? 0.5 : 1,
                }}
                onClick={() => {
                  setActiveChapter(ch.id);
                  setShowForm(false);
                }}
              >
                {renamingId === ch.id ? (
                  <div className="row" style={{ gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      className="input"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void renameChapter(ch.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => void renameChapter(ch.id)}>
                      ✓
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="row row--between" style={{ gap: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
                        {idx + 1}. {ch.title}
                      </span>
                      <span className="badge badge--muted" style={{ fontSize: 10 }}>
                        {chapterQuestionCount(ch.id)}
                      </span>
                    </div>
                    <div className="row" style={{ gap: 2, marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={idx === 0} onClick={() => moveChapter(ch.id, -1)} title="Nach oben">
                        ↑
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={idx === sortedChapters.length - 1} onClick={() => moveChapter(ch.id, 1)} title="Nach unten">
                        ↓
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} onClick={() => { setRenamingId(ch.id); setRenameTitle(ch.title); }} title="Umbenennen">
                        ✎
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} onClick={() => void deleteChapter(ch)} title="Löschen">
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {unassignedCount > 0 && (
              <div
                style={{
                  border: `1px dashed ${activeChapter === UNASSIGNED ? "var(--ds-brand, #1868db)" : "var(--ds-border)"}`,
                  borderRadius: "var(--ds-radius)",
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: activeChapter === UNASSIGNED ? "rgba(24,104,219,0.06)" : undefined,
                }}
                onClick={() => {
                  setActiveChapter(UNASSIGNED);
                  setShowForm(false);
                }}
              >
                <div className="row row--between" style={{ gap: 4 }}>
                  <span className="muted" style={{ fontSize: 13, fontStyle: "italic" }}>
                    Nicht zugeordnet
                  </span>
                  <span className="badge badge--muted" style={{ fontSize: 10 }}>{unassignedCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 4, marginTop: 12 }}>
            <input
              className="input"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Neues Kapitel …"
              onKeyDown={(e) => {
                if (e.key === "Enter") void addChapter();
              }}
            />
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => void addChapter()} disabled={!newChapterTitle.trim()}>
              +
            </button>
          </div>
        </div>

        {/* ── Fragen-Spalte ── */}
        <div className="stack">
          <div className="row row--between" style={{ flexWrap: "wrap", gap: 8 }}>
            <strong>
              {activeChapterData
                ? `Kapitel ${activeChapterData.order} · ${activeChapterData.title}`
                : "Nicht zugeordnete Fragen"}
            </strong>
            {activeChapterData && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => {
                  setShowForm(!showForm);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {showForm ? "Abbrechen" : "Neue Frage"}
              </button>
            )}
          </div>

          {showForm && activeChapterData && (
            <AddQuestionForm
              chapters={sortedChapters}
              defaultChapterId={activeChapterData.id}
              onSubmit={async (data) => {
                await addQuestion(data);
              }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {!activeChapterData && activeQuestions.length === 0 && sortedChapters.length === 0 && (
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <p className="muted" style={{ margin: 0 }}>
                Lege links dein erstes Kapitel an – danach kannst du Fragen hinzufügen.
              </p>
            </div>
          )}

          {activeQuestions.length === 0 && (activeChapterData || unassignedCount > 0) && (
            <p className="muted">Keine Fragen in diesem Kapitel.</p>
          )}

          {activeQuestions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              chapters={sortedChapters}
              isFirst={idx === 0}
              isLast={idx === activeQuestions.length - 1}
              onDelete={() => deleteQuestion(q)}
              onEdit={(data) => editQuestion(q.id, data)}
              onMove={(target) => moveQuestion(q, target)}
              onDuplicate={() => duplicateQuestion(q)}
              onReorder={(dir) => moveQuestionOrder(q, dir)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Notice({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error && (
        <div className="badge" style={{ background: "rgba(174,46,36,0.1)", color: "#ae2e24" }}>
          {error}
        </div>
      )}
      {success && <div className="badge badge--success">{success}</div>}
    </>
  );
}

function QuestionRow({
  question: q,
  chapters,
  isFirst,
  isLast,
  onDelete,
  onEdit,
  onMove,
  onDuplicate,
  onReorder,
}: {
  question: QuestionData;
  chapters: ChapterData[];
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onEdit: (data: { question: string; answer: string }) => Promise<boolean>;
  onMove: (targetChapterId: string | null) => void;
  onDuplicate: () => void;
  onReorder: (dir: -1 | 1) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(q.question);
  const [editAnswer, setEditAnswer] = useState(q.answer);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setEditQuestion(q.question);
    setEditAnswer(q.answer);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const ok = await onEdit({ question: editQuestion, answer: editAnswer });
    setSaving(false);
    if (ok) setEditing(false);
  }

  if (editing) {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div className="stack">
          <div className="field">
            <label>Frage</label>
            <textarea
              className="textarea"
              rows={2}
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Antwort</label>
            <textarea
              className="textarea"
              rows={4}
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
            />
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={save}
              disabled={saving || !editQuestion.trim() || !editAnswer.trim()}
            >
              {saving ? "Speichert …" : "Speichern"}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 0, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}><Markdown source={q.question} /></div>
          <div className="divider" style={{ margin: "8px 0" }} />
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            <span className="eyebrow" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
              Antwort
            </span>
            <Markdown source={q.answer.slice(0, 150) + (q.answer.length > 150 ? "…" : "")} />
          </div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>
              {TYPE_LABELS[q.taskType ?? "recall"] ?? q.taskType}
            </span>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>{q.sourceRef}</span>
            {q.confidence === "low" && (
              <span className="badge badge--warn" style={{ fontSize: 11 }}>prüfen</span>
            )}
          </div>
        </div>
        <div className="stack" style={{ gap: 6, alignItems: "flex-end" }}>
          <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
            <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={isFirst} onClick={() => onReorder(-1)} title="Nach oben">
              ↑
            </button>
            <button type="button" className="btn btn--ghost btn--sm" style={{ padding: "0 6px" }} disabled={isLast} onClick={() => onReorder(1)} title="Nach unten">
              ↓
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={startEdit}>
              Bearbeiten
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDuplicate} title="Duplizieren">
              ⧉
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDelete}>
              Löschen
            </button>
          </div>
          <select
            className="input"
            style={{ fontSize: 12, padding: "4px 8px", maxWidth: 200 }}
            value={q.chapterId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v !== (q.chapterId ?? "")) onMove(v === "" ? null : v);
            }}
            title="In Kapitel verschieben"
          >
            <option value="">Nicht zugeordnet</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.order}. {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

type EditorTaskType = "recall" | "mcq" | "dragdrop" | "cloze" | "order" | "code";

function AddQuestionForm({
  chapters,
  defaultChapterId,
  onSubmit,
  onCancel,
}: {
  chapters: { id: string; title: string; order: number }[];
  defaultChapterId: string;
  onSubmit: (data: {
    chapterId: string;
    question: string;
    answer: string;
    sourceRef: string;
    confidence: "high" | "low" | "";
    taskType: EditorTaskType;
    taskPayload: unknown;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [chapterId, setChapterId] = useState(defaultChapterId);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [confidence, setConfidence] = useState<"high" | "low" | "">("");
  const [taskType, setTaskType] = useState<EditorTaskType>("recall");
  const [mcqOptions, setMcqOptions] = useState<McqOptionData[]>([
    { id: "opt-1", text: "", correct: false },
    { id: "opt-2", text: "", correct: false },
  ]);
  // dragdrop
  const [ddZones, setDdZones] = useState<{ id: string; label: string }[]>([
    { id: "zone-1", label: "" },
  ]);
  const [ddItems, setDdItems] = useState<{ id: string; text: string }[]>([
    { id: "item-1", text: "" },
  ]);
  const [ddCorrect, setDdCorrect] = useState<Record<string, string>>({});
  // cloze
  const [clozeSegments, setClozeSegments] = useState<
    Array<
      | { kind: "text"; text: string }
      | { kind: "blank"; blankId: string; accepted: string; normalize: "exact" | "ignore-case" | "trim" | "regex" }
    >
  >([{ kind: "text", text: "" }]);
  // order
  const [orderItems, setOrderItems] = useState<{ id: string; text: string }[]>([
    { id: "item-1", text: "" },
    { id: "item-2", text: "" },
  ]);
  // code
  const [codeLanguages, setCodeLanguages] = useState<
    { languageId: number; label: string; starterCode: string }[]
  >([{ languageId: 71, label: "Python 3", starterCode: "" }]);
  const [codeTestCases, setCodeTestCases] = useState<
    { id: string; input: string; expectedOutput: string; hidden: boolean }[]
  >([{ id: "t1", input: "", expectedOutput: "", hidden: false }]);
  const [codeTimeLimitMs, setCodeTimeLimitMs] = useState(3000);
  const [codeMemoryLimitKb, setCodeMemoryLimitKb] = useState(262144);
  const [submitting, setSubmitting] = useState(false);

  function addMcqOption() {
    setMcqOptions((prev) => [...prev, { id: `opt-${prev.length + 1}`, text: "", correct: false }]);
  }
  function removeMcqOption(idx: number) {
    setMcqOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    let taskPayload: unknown = null;
    if (taskType === "mcq") {
      const normalized = mcqOptions.map((o, i) => ({ ...o, id: `opt-${i + 1}` }));
      taskPayload = { options: normalized };
    } else if (taskType === "dragdrop") {
      taskPayload = { zones: ddZones, items: ddItems, correct: ddCorrect };
    } else if (taskType === "cloze") {
      taskPayload = {
        segments: clozeSegments.map((s) =>
          s.kind === "blank"
            ? {
                kind: "blank" as const,
                blankId: s.blankId,
                accepted: s.accepted.split("\n").map((a) => a.trim()).filter(Boolean),
                normalize: s.normalize,
              }
            : { kind: "text" as const, text: s.text }
        ),
      };
    } else if (taskType === "order") {
      taskPayload = {
        items: orderItems,
        correctOrder: orderItems.map((i) => i.id),
      };
    } else if (taskType === "code") {
      taskPayload = {
        languages: codeLanguages,
        testCases: codeTestCases,
        timeLimitMs: codeTimeLimitMs,
        memoryLimitKb: codeMemoryLimitKb,
      };
    }
    await onSubmit({
      chapterId,
      question,
      answer,
      sourceRef,
      confidence,
      taskType,
      taskPayload,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="card stack" style={{ padding: 20 }}>
      <h3 style={{ margin: 0 }}>Neue Frage hinzufügen</h3>
      <div className="field">
        <label>Kapitel</label>
        <select
          className="input"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
        >
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.order}. {c.title}
            </option>
          ))}
        </select>
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
      <div className="field">
        <label>Aufgabentyp</label>
        <select
          className="input"
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as EditorTaskType)}
        >
          <option value="recall">Freie Erinnerung (Selbstbewertung)</option>
          <option value="mcq">Multiple-Choice (auto)</option>
          <option value="dragdrop">Zuordnen / Drag & Drop (auto)</option>
          <option value="cloze">Lückentext (auto)</option>
          <option value="order">Sortieren / Reihenfolge (auto)</option>
          <option value="code">Code / Programmieraufgabe (auto, Judge0)</option>
        </select>
      </div>

      {taskType === "mcq" && (
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
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeMcqOption(idx)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--secondary btn--sm" onClick={addMcqOption}>
            Option hinzufügen
          </button>
        </div>
      )}

      {taskType === "dragdrop" && (
        <DragDropEditor
          zones={ddZones}
          items={ddItems}
          correct={ddCorrect}
          onZonesChange={setDdZones}
          onItemsChange={setDdItems}
          onCorrectChange={setDdCorrect}
        />
      )}

      {taskType === "cloze" && (
        <ClozeEditor segments={clozeSegments} onSegmentsChange={setClozeSegments} />
      )}

      {taskType === "order" && (
        <OrderEditor items={orderItems} onItemsChange={setOrderItems} />
      )}

      {taskType === "code" && (
        <CodeEditor
          languages={codeLanguages}
          testCases={codeTestCases}
          timeLimitMs={codeTimeLimitMs}
          memoryLimitKb={codeMemoryLimitKb}
          onLanguagesChange={setCodeLanguages}
          onTestCasesChange={setCodeTestCases}
          onTimeLimitChange={setCodeTimeLimitMs}
          onMemoryLimitChange={setCodeMemoryLimitKb}
        />
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

function DragDropEditor({
  zones,
  items,
  correct,
  onZonesChange,
  onItemsChange,
  onCorrectChange,
}: {
  zones: { id: string; label: string }[];
  items: { id: string; text: string }[];
  correct: Record<string, string>;
  onZonesChange: (z: { id: string; label: string }[]) => void;
  onItemsChange: (i: { id: string; text: string }[]) => void;
  onCorrectChange: (c: Record<string, string>) => void;
}) {
  function addZone() {
    onZonesChange([...zones, { id: `zone-${zones.length + 1}`, label: "" }]);
  }
  function addItem() {
    onItemsChange([...items, { id: `item-${items.length + 1}`, text: "" }]);
  }
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Zonen und Elemente anlegen; pro Element die korrekte Zone wählen.
      </span>
      <div className="stack">
        <strong style={{ fontSize: 14 }}>Zonen</strong>
        {zones.map((z, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "0 0 100px" }}>
              <label>ID</label>
              <input
                className="input"
                value={z.id}
                onChange={(e) =>
                  onZonesChange(zones.map((x, i) => (i === idx ? { ...x, id: e.target.value } : x)))
                }
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Bezeichnung</label>
              <input
                className="input"
                value={z.label}
                onChange={(e) =>
                  onZonesChange(zones.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                }
              />
            </div>
            {zones.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onZonesChange(zones.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" onClick={addZone}>
          Zone hinzufügen
        </button>
      </div>
      <div className="stack">
        <strong style={{ fontSize: 14 }}>Elemente</strong>
        {items.map((item, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Element {idx + 1}</label>
              <input
                className="input"
                value={item.text}
                onChange={(e) =>
                  onItemsChange(items.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
                }
              />
            </div>
            <div className="field" style={{ flex: "0 0 180px" }}>
              <label>Korrekte Zone</label>
              <select
                className="input"
                value={correct[item.id] ?? ""}
                onChange={(e) => onCorrectChange({ ...correct, [item.id]: e.target.value })}
              >
                <option value="">—</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label || z.id}
                  </option>
                ))}
              </select>
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  onItemsChange(items.filter((_, i) => i !== idx));
                  const next = { ...correct };
                  delete next[item.id];
                  onCorrectChange(next);
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn--secondary btn--sm" onClick={addItem}>
          Element hinzufügen
        </button>
      </div>
    </div>
  );
}

function ClozeEditor({
  segments,
  onSegmentsChange,
}: {
  segments: Array<
    | { kind: "text"; text: string }
    | {
        kind: "blank";
        blankId: string;
        accepted: string;
        normalize: "exact" | "ignore-case" | "trim" | "regex";
      }
  >;
  onSegmentsChange: (
    s: Array<
      | { kind: "text"; text: string }
      | {
          kind: "blank";
          blankId: string;
          accepted: string;
          normalize: "exact" | "ignore-case" | "trim" | "regex";
        }
    >
  ) => void;
}) {
  function addText() {
    onSegmentsChange([...segments, { kind: "text", text: "" }]);
  }
  function addBlank() {
    onSegmentsChange([
      ...segments,
      { kind: "blank", blankId: `blank-${segments.length + 1}`, accepted: "", normalize: "ignore-case" },
    ]);
  }
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Baue den Text aus Text- und Lücken-Segmenten zusammen. Pro Lücke:
        akzeptierte Antworten (eine pro Zeile) und eine Normalisierung.
      </span>
      {segments.map((seg, idx) => (
        <div key={idx} className="card" style={{ padding: 12 }}>
          <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span className="badge badge--muted" style={{ fontSize: 11 }}>
              {seg.kind === "text" ? "Text" : "Lücke"}
            </span>
            {segments.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onSegmentsChange(segments.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
          {seg.kind === "text" ? (
            <textarea
              className="textarea"
              rows={2}
              value={seg.text}
              placeholder="Text …"
              onChange={(e) =>
                onSegmentsChange(
                  segments.map((s, i) => (i === idx ? { ...s, text: e.target.value } : s))
                )
              }
            />
          ) : (
            <div className="stack">
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <div className="field" style={{ flex: "0 0 140px" }}>
                  <label>Lücken-ID</label>
                  <input
                    className="input"
                    value={seg.blankId}
                    onChange={(e) =>
                      onSegmentsChange(
                        segments.map((s, i) =>
                          i === idx ? { ...s, blankId: e.target.value } : s
                        )
                      )
                    }
                  />
                </div>
                <div className="field" style={{ flex: "0 0 160px" }}>
                  <label>Normalisierung</label>
                  <select
                    className="input"
                    value={seg.normalize}
                    onChange={(e) =>
                      onSegmentsChange(
                        segments.map((s, i) =>
                          i === idx
                            ? { ...s, normalize: e.target.value as typeof seg.normalize }
                            : s
                        )
                      )
                    }
                  >
                    <option value="ignore-case">Groß-/Kleinschreibung ignorieren</option>
                    <option value="trim">Whitespace normalisieren</option>
                    <option value="exact">Exakt</option>
                    <option value="regex">Regex</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Akzeptierte Antworten (eine pro Zeile)</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={seg.accepted}
                  onChange={(e) =>
                    onSegmentsChange(
                      segments.map((s, i) =>
                        i === idx ? { ...s, accepted: e.target.value } : s
                      )
                    )
                  }
                  placeholder={"Antwort A\nAntwort B"}
                />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addText}>
          Text-Segment
        </button>
        <button type="button" className="btn btn--secondary btn--sm" onClick={addBlank}>
          Lücke hinzufügen
        </button>
      </div>
    </div>
  );
}

function OrderEditor({
  items,
  onItemsChange,
}: {
  items: { id: string; text: string }[];
  onItemsChange: (i: { id: string; text: string }[]) => void;
}) {
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Elemente in der korrekten Reihenfolge anlegen (oben = zuerst).
      </span>
      {items.map((item, idx) => (
        <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "0 0 40px" }}>
            <label>Nr.</label>
            <input className="input" value={idx + 1} disabled />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Element</label>
            <input
              className="input"
              value={item.text}
              onChange={(e) =>
                onItemsChange(items.map((x, i) => (i === idx ? { ...x, text: e.target.value } : x)))
              }
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
            disabled={items.length <= 2}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => onItemsChange([...items, { id: `item-${items.length + 1}`, text: "" }])}
      >
        Element hinzufügen
      </button>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CodeEditor({
  languages,
  testCases,
  timeLimitMs,
  memoryLimitKb,
  onLanguagesChange,
  onTestCasesChange,
  onTimeLimitChange,
  onMemoryLimitChange,
}: {
  languages: { languageId: number; label: string; starterCode: string }[];
  testCases: { id: string; input: string; expectedOutput: string; hidden: boolean }[];
  timeLimitMs: number;
  memoryLimitKb: number;
  onLanguagesChange: (
    l: { languageId: number; label: string; starterCode: string }[]
  ) => void;
  onTestCasesChange: (
    t: { id: string; input: string; expectedOutput: string; hidden: boolean }[]
  ) => void;
  onTimeLimitChange: (n: number) => void;
  onMemoryLimitChange: (n: number) => void;
}) {
  return (
    <div className="stack">
      <span className="muted" style={{ fontSize: 13 }}>
        Code-Aufgaben werden über Judge0 automatisch bewertet. Sie benötigen
        JUDGE0_ENABLED=true auf dem Server. Sprache-IDs aus der{" "}
        <a
          href="https://github.com/judge0/judge0/blob/master/EXTRA_LANGUAGES.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Judge0-Liste
        </a>{" "}
        (z. B. 71 = Python 3, 63 = JavaScript, 50 = C).
      </span>

      <div className="stack">
        <strong style={{ fontSize: 14 }}>Sprachen</strong>
        {languages.map((lang, idx) => (
          <div key={idx} className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field" style={{ flex: "0 0 90px" }}>
              <label>Lang-ID</label>
              <input
                className="input"
                type="number"
                value={lang.languageId}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) =>
                      i === idx ? { ...x, languageId: Number(e.target.value) || 0 } : x
                    )
                  )
                }
              />
            </div>
            <div className="field" style={{ flex: "0 0 160px" }}>
              <label>Label</label>
              <input
                className="input"
                value={lang.label}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                  )
                }
                placeholder="Python 3"
              />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 200 }}>
              <label>Starter-Code</label>
              <textarea
                className="textarea"
                rows={2}
                value={lang.starterCode}
                onChange={(e) =>
                  onLanguagesChange(
                    languages.map((x, i) =>
                      i === idx ? { ...x, starterCode: e.target.value } : x
                    )
                  )
                }
                placeholder="# Dein Code …"
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
            </div>
            {languages.length > 1 && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onLanguagesChange(languages.filter((_, i) => i !== idx))}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() =>
            onLanguagesChange([
              ...languages,
              { languageId: 63, label: "", starterCode: "" },
            ])
          }
        >
          Sprache hinzufügen
        </button>
      </div>

      <div className="stack">
        <strong style={{ fontSize: 14 }}>Testfälle</strong>
        {testCases.map((tc, idx) => (
          <div key={idx} className="card" style={{ padding: 12 }}>
            <div className="row" style={{ gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span className="badge badge--muted" style={{ fontSize: 11 }}>
                Test {idx + 1}
              </span>
              <label className="row" style={{ gap: 4, fontSize: 13, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={tc.hidden}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) => (i === idx ? { ...x, hidden: e.target.checked } : x))
                    )
                  }
                />
                versteckt
              </label>
              <span className="muted" style={{ fontSize: 11 }}>
                {tc.hidden
                  ? "(Lerner sieht nur Pass/Fail)"
                  : "(Lerner sieht Ein- und Ausgabe)"}
              </span>
              {testCases.length > 1 && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onTestCasesChange(testCases.filter((_, i) => i !== idx))}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: 1, minWidth: 150 }}>
                <label>stdin</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={tc.input}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) => (i === idx ? { ...x, input: e.target.value } : x))
                    )
                  }
                  placeholder="(leer)"
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 150 }}>
                <label>Erwartete Ausgabe</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={tc.expectedOutput}
                  onChange={(e) =>
                    onTestCasesChange(
                      testCases.map((x, i) =>
                        i === idx ? { ...x, expectedOutput: e.target.value } : x
                      )
                    )
                  }
                  placeholder="42"
                  style={{ fontFamily: "monospace", fontSize: 12 }}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() =>
            onTestCasesChange([
              ...testCases,
              { id: `t${testCases.length + 1}`, input: "", expectedOutput: "", hidden: true },
            ])
          }
        >
          Testfall hinzufügen
        </button>
      </div>

      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "0 0 160px" }}>
          <label>Zeitlimit (ms)</label>
          <input
            className="input"
            type="number"
            min={100}
            max={15000}
            value={timeLimitMs}
            onChange={(e) => onTimeLimitChange(Number(e.target.value) || 3000)}
          />
        </div>
        <div className="field" style={{ flex: "0 0 200px" }}>
          <label>Speicherlimit (KB)</label>
          <input
            className="input"
            type="number"
            min={8192}
            max={524288}
            value={memoryLimitKb}
            onChange={(e) => onMemoryLimitChange(Number(e.target.value) || 262144)}
          />
        </div>
      </div>
    </div>
  );
}
