import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { curriculum, type Track } from "../../data/curriculum";
import { getDashboard } from "../../db/repos/dashboardRepo";
import { saveLearningSettings, studyLink } from "../../db/repos/learningRepo";
import { loadStudy } from "../../db/repos/studyRepo";
import { useNow } from "../../lib/useNow";
import { DeckCard } from "../../components/DeckCard";
import { GoalPicker, pathNames } from "../../components/GoalPicker";
const guidance: Record<string, [string, string]> = {
  "Start here": [
    "No prior programming required.",
    "Build a small CRUD feature and explain how its data moves.",
  ],
  "Keep going": [
    "Comfort with variables, functions, basic HTML and a simple database.",
    "Debug and test a complete user journey.",
  ],
  "Build real apps": [
    "Complete Start here or have equivalent experience.",
    "Deliver a notes app with validation, authorization, tests and recovery.",
  ],
  "C# & .NET": [
    "Start with the first C# deck; basic web concepts help.",
    "Build and defend an ASP.NET Core notes service.",
  ],
  Foundations: [
    "Start here or equivalent basic programming.",
    "Explain data, runtime and storage decisions in a working feature.",
  ],
  Frontend: [
    "HTML, JavaScript functions and basic React.",
    "Build an accessible interface that handles asynchronous failures.",
  ],
  Backend: [
    "Functions, HTTP requests and basic SQL.",
    "Deliver a validated, permission-checked API.",
  ],
  Practice: [
    "A small app you can run and modify.",
    "Produce a reviewed work sample and verification evidence.",
  ],
  Workshop: [
    "Choose a unit and check its prerequisites.",
    "Complete supplied case files and defend a capstone.",
  ],
};
export function PathScreen() {
  const { path = "" } = useParams();
  const now = useNow();
  const [error, setError] = useState("");
  const dashboard = useLiveQuery(() => getDashboard(now), [now.getTime()]);
  const study = useLiveQuery(
    () =>
      loadStudy(
        undefined,
        now,
        pathNames.includes(path as Track) ? (path as Track) : undefined,
      ),
    [path, now.getTime()],
  );
  if (!pathNames.includes(path as Track))
    return (
      <div>
        <h1>Learning paths</h1>
        <GoalPicker />
        {pathNames.map((p) => (
          <p key={p}>
            <Link to={"/paths/" + encodeURIComponent(p)}>{p}</Link>
          </p>
        ))}
      </div>
    );
  const decks = curriculum.filter((d) => d.track === path);
  const rows =
    dashboard?.summaries.filter((s) => decks.some((d) => d.id === s.deck.id)) ??
    [];
  const next =
    rows.find((s) => s.due > 0) ??
    rows.find((s) => s.newAvailable > 0) ??
    rows[0];
  return (
    <div className="space-y-6">
      <Link to="/paths">All paths</Link>
      <header className="page-heading">
        <div>
          <h1>{path}</h1>
          <p>{guidance[path]?.[1]}</p>
        </div>
      </header>
      <section className="content-panel">
        <h2>Your next step</h2>
        <p>Prerequisites: {guidance[path]?.[0]}</p>
        <p>
          {next
            ? "Continue with " + next.deck.name
            : "Your library is loading."}{" "}
          Due reviews come first; you can open any deck below.
        </p>
        <div className="action-row">
          {[2, 5, 10].map((n) => (
            <Link
              className="practice-primary-link"
              key={n}
              to={studyLink(path, n)}
            >
              {n}-minute session
              {study?.queue.length === 0 ? " · caught up" : ""}
            </Link>
          ))}
          <button
            onClick={() =>
              void saveLearningSettings({ path }).catch(() =>
                setError("Could not save your goal."),
              )
            }
          >
            Make this my goal
          </button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p>
          <Link to="/workshop">
            Apply this path in a guided lab or capstone
          </Link>
        </p>
      </section>
      <div className="deck-grid">
        {rows.map((s) => (
          <DeckCard key={s.deck.id} summary={s} />
        ))}
      </div>
    </div>
  );
}
