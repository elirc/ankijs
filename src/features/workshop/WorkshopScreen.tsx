import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { workshopGroups, workshopUnits } from "../../data/workshop";
import { MarkdownView } from "../../components/MarkdownView";
import { listPracticeEntries } from "../../db/repos/practiceRepo";
import { readDraft, storeDraft } from "../../lib/drafts";
export function WorkshopScreen() {
  const { unitId } = useParams();
  const [group, setGroup] = useState("All");
  const [query, setQuery] = useState("");
  const entries = useLiveQuery(listPracticeEntries, [], []);
  const unit = workshopUnits.find((u) => u.id === unitId);
  if (unitId)
    return unit ? (
      <UnitWorkspace key={unit.id} unit={unit} />
    ) : (
      <section>
        <h1>Lab not found</h1>
        <Link to="/workshop">All labs</Link>
      </section>
    );
  const visible = workshopUnits.filter(
    (u) =>
      (group === "All" || u.group === group) &&
      (u.title + " " + u.objective).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <header className="page-heading">
        <div>
          <h1>Guided workshop</h1>
          <p>
            Two capstones and 36 case files across seven areas. Use supplied
            evidence, try a solution, then compare and verify.
          </p>
        </div>
      </header>
      <section className="content-panel">
        <a
          className="practice-primary-link"
          href="/workshop/recall-workshop.zip"
          download
        >
          Download all starter files, references and checks
        </a>
        <p>
          Includes Node fixtures, PostgreSQL session scripts, and
          TypeScript/React and .NET capstones. Runtime requirements are shown
          per unit. Code runs on your machine; Recall saves your evidence
          offline.
        </p>
      </section>
      <div className="action-row">
        <label>
          Find a lab
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Area
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option>All</option>
            {workshopGroups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <span role="status">{visible.length} labs</span>
      </div>
      <div className="mission-grid">
        {visible.map((u) => (
          <Link className="mission-card" key={u.id} to={"/workshop/" + u.id}>
            <small>
              {u.group} ·{" "}
              {entries.find((e) => e.mission_id === "lab-" + u.id)?.completed
                ? "Completed"
                : "Open lab"}
            </small>
            <h2>{u.title}</h2>
            <p>{u.objective}</p>
            <small>{u.runtime}</small>
          </Link>
        ))}
      </div>
      {!visible.length && <p>No labs match. Try another search or area.</p>}
    </div>
  );
}
function UnitWorkspace({ unit }: { unit: (typeof workshopUnits)[number] }) {
  const [attempt, setAttempt] = useState(() => readDraft("lab:" + unit.id));
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  return (
    <article className="space-y-6 workshop-unit">
      <Link to="/workshop">All guided labs</Link>
      <header>
        <p>{unit.group}</p>
        <h1>{unit.title}</h1>
        <p>{unit.objective}</p>
      </header>
      <section className="content-panel">
        <h2>Before you start</h2>
        <p>Prerequisites: {unit.prerequisites.join(", ")}.</p>
        <p>
          {unit.runtime} · Reviewed {unit.reviewed}
        </p>
        <a href={unit.fixture} download>
          Download this case file
        </a>{" "}
        ·{" "}
        <a href="/workshop/recall-workshop.zip" download>
          Starter and reference pack
        </a>
      </section>
      <section className="content-panel">
        <h2>The evidence</h2>
        <MarkdownView source={unit.evidence} />
        <h2>Your assignment</h2>
        <MarkdownView source={unit.task} />
        <details>
          <summary>Hints</summary>
          <ul>
            {unit.hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </details>
      </section>
      <section className="content-panel">
        <label className="setting-label">
          Your hypothesis or solution
          <textarea
            rows={7}
            value={attempt}
            onChange={(e) => {
              setAttempt(e.target.value);
              if (!storeDraft("lab:" + unit.id, e.target.value))
                setError(
                  "This attempt could not be saved. Copy it before leaving.",
                );
            }}
          />
        </label>
        <p>
          Attempt saved on this device. Add lasting results to the evidence
          journal below so they travel in backups and sync.
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          className="practice-primary-link"
          aria-expanded={revealed}
          onClick={() => setRevealed(!revealed)}
        >
          {revealed
            ? "Hide reference explanation"
            : "Show reference explanation"}
        </button>
        {revealed && (
          <div>
            <MarkdownView source={unit.solution} />
            <h3>Compare your reasoning</h3>
            <ul>
              {unit.rubric.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p>This is a self-review rubric, not an automatic grade.</p>
          </div>
        )}
      </section>
      <section className="content-panel">
        <h2>Verify and retain</h2>
        <ul>
          {unit.rubric.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="action-row">
          <Link
            className="practice-primary-link"
            to={"/practice/lab-" + unit.id}
          >
            Record verification and complete this lab
          </Link>
          <Link to={"/study/" + unit.deckId + "?minutes=5"}>
            Review related concepts
          </Link>
          <Link to={"/library?card=" + unit.cardIds[0]}>
            Open the linked recall card
          </Link>
        </div>
        <h3>Primary references</h3>
        {unit.sources.map((url) => (
          <p key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {new URL(url).hostname} — further reading
            </a>
          </p>
        ))}
      </section>
    </article>
  );
}
