import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { getAnswerPages } from "../teaching/answers";
import { useLiveQuery } from "dexie-react-hooks";
import { getLearningSettings } from "../db/repos/learningRepo";
import { readDraft, storeDraft } from "../lib/drafts";
import { MarkdownView } from "./MarkdownView";

export function AnswerExplorer({
  front,
  back,
}: {
  front: string;
  back: string;
}) {
  // The keyed inner reader resets when the question or edited answer changes.
  return (
    <AnswerReader key={`${front}\u0000${back}`} front={front} back={back} />
  );
}

function AnswerReader({ front, back }: { front: string; back: string }) {
  const { pages, credit } = useMemo(
    () => getAnswerPages(front, back),
    [front, back],
  );
  const [index, setIndex] = useState(0);
  const settings = useLiveQuery(getLearningSettings);
  const selected = useRef(false);
  useEffect(() => {
    if (settings && !selected.current) {
      selected.current = true;
      const found = pages.findIndex((p) => p.title === settings.explanation);
      if (found >= 0) setIndex(found);
    }
  }, [settings, pages]);
  const heading = useRef<HTMLHeadingElement>(null);
  const page = pages[index];
  const multiple = pages.length > 1;
  function changePage(next: number, moveFocus = true) {
    selected.current = true;
    setIndex(Math.max(0, Math.min(next, pages.length - 1)));
    if (!moveFocus) return;
    // Bring the new explanation into view after a long code example on a phone.
    requestAnimationFrame(() => {
      const element = heading.current;
      if (!element) return;
      element.focus({ preventScroll: true });
      const rect = element.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.7)
        element.scrollIntoView({ block: "start" });
    });
  }
  return (
    <div className="answer-explorer">
      <div className="explanation-topline">
        <span>
          <BookOpen size={15} /> Answer
        </span>
        {multiple && (
          <span role="status">
            Explanation {index + 1} of {pages.length}
          </span>
        )}
      </div>
      {multiple && (
        <label className="explanation-select-label">
          Explore another way
          <select
            aria-label="Explanation style"
            value={index}
            onChange={(event) => changePage(Number(event.target.value), false)}
          >
            {pages.map((item, i) => (
              <option key={`${i}:${item.title}`} value={i}>
                {i + 1}. {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <h2 className="explanation-heading" tabIndex={-1} ref={heading}>
        {page.title}
      </h2>
      <div className="explanation-body" aria-live="polite">
        <ExplanationBody key={`${index}:${page.body}`} body={page.body} />
      </div>
      {multiple && (
        <div
          className="explanation-navigation"
          aria-label="Answer explanations"
        >
          <button
            type="button"
            disabled={index === 0}
            onClick={() => changePage(index - 1)}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <button
            type="button"
            className="explanation-next"
            onClick={() =>
              changePage(index === pages.length - 1 ? 0 : index + 1)
            }
          >
            {index === pages.length - 1
              ? "Back to first explanation"
              : "Next explanation"}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      {credit && (
        <MarkdownView source={credit} className="explanation-credit" />
      )}
    </div>
  );
}

function ExplanationBody({ body }: { body: string }) {
  const [checked, setChecked] = useState(false);
  const draftKey =
    "answer:" +
    Array.from(body).reduce(
      (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
      2166136261,
    );
  const [attempt, setAttempt] = useState(() => readDraft(draftKey));
  const [draftError, setDraftError] = useState("");
  const marker = "<!-- recall:solution -->";
  const boundary = body.indexOf(marker);
  if (boundary < 0)
    return <MarkdownView source={body} className="card-answer" />;
  return (
    <>
      <MarkdownView source={body.slice(0, boundary)} className="card-answer" />
      <label className="setting-label">
        Your answer (optional)
        <textarea
          rows={4}
          value={attempt}
          onChange={(event) => {
            setAttempt(event.target.value);
            if (!storeDraft(draftKey, event.target.value))
              setDraftError(
                "Could not save this attempt. Keep a copy before leaving.",
              );
          }}
        />
      </label>
      {draftError && <p role="alert">{draftError}</p>}
      <button
        className="practice-reveal"
        type="button"
        aria-expanded={checked}
        onClick={() => setChecked(!checked)}
      >
        {checked ? "Hide sample solution" : "Show sample solution"}
      </button>
      {checked && (
        <div className="practice-solution">
          <p>
            Compare your main claim and reasoning with the example. Check any
            assumptions or limitations. This reveals a reference; it does not
            grade your response.
          </p>
          <MarkdownView
            source={body.slice(boundary + marker.length)}
            className="card-answer"
          />
        </div>
      )}
    </>
  );
}
