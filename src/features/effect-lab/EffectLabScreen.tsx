import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ArrowRight, Check, Code2, Download } from "lucide-react";
import { Button } from "../../components/Button";
import { agentPrompt, effectResources } from "../../data/effect-guidance";
import type {
  EffectMilestone,
  EffectProject,
} from "../../data/effect-projects";
import {
  activityType,
  type EffectActivitySummary,
  type EffectProjectSummary,
  type EffectSearchIndex,
} from "../../data/effect-library-types";
import {
  effectActivities as effectMissions,
  effectProjects,
  loadEffectProject,
  loadEffectSearch,
} from "./effect-library";
import {
  emptyPracticeEntry,
  listPracticeEntries,
  waitForPracticeWrites,
  type PracticeEntry,
} from "../../db/repos/practiceRepo";
import {
  buildProgressMap,
  effectStages,
  effectTracks,
  findMilestones,
  milestoneStatus as status,
  progressOptions,
  projectGuideMarkdown,
  type ProgressMap,
} from "./effect-lab-model";
import "./effect-lab.css";

const MissionWorkspace = lazy(() =>
  import("../practice/PracticeScreen").then((module) => ({
    default: module.MissionWorkspace,
  })),
);

const root = "/effect-lab";
const effectMissionIds = new Set(effectMissions.map((mission) => mission.id));
const projectUrl = (project: Pick<EffectProject, "id">) =>
  `${root}/${project.id}`;
const milestoneUrl = (
  project: Pick<EffectProject, "id">,
  milestone: Pick<EffectMilestone, "id">,
) => `${projectUrl(project)}/${milestone.id}`;

function downloadMarkdown(filename: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function continuation(
  projects: EffectProjectSummary[],
  entries: PracticeEntry[],
  progressById: ProgressMap = buildProgressMap(entries),
) {
  const choices = projects.flatMap((project) =>
    project.milestones.map((milestone) => ({ project, milestone })),
  );
  return (
    choices.find(
      ({ milestone }) =>
        status(milestone, entries, progressById) === "In progress",
    ) ??
    choices.find(
      ({ milestone }) =>
        status(milestone, entries, progressById) !== "Completed",
    )
  );
}

export async function effectEvidenceMarkdown(entries: PracticeEntry[]) {
  const lines = [
    "# Effect & agentic CRUD — my project evidence",
    "",
    "Self-reviewed learning evidence, not an independently verified assessment.",
  ];
  for (const summary of effectProjects) {
    if (
      !summary.milestones.some((item) =>
        entries.some((entry) => entry.mission_id === item.id),
      )
    )
      continue;
    const project = await loadEffectProject(summary.id);
    const recorded = project.milestones.filter((milestone) =>
      entries.some((entry) => entry.mission_id === milestone.id),
    );
    if (!recorded.length) continue;
    lines.push("", `## ${project.title}`);
    for (const milestone of recorded) {
      const entry = entries.find(
        (candidate) => candidate.mission_id === milestone.id,
      )!;
      lines.push(
        "",
        `### ${milestone.title}`,
        "",
        `${entry.completed ? "Completed" : "In progress"} | ${entry.updated_at}`,
        "",
        "#### What I changed",
        entry.outcome,
        "",
        "#### How I verified it",
        entry.verification,
        "",
        "#### Tradeoff and next step",
        entry.tradeoff,
        "",
        "#### Acceptance checks",
        ...milestone.checks.map(
          (check) =>
            `- [${entry.checked.includes(check.id) ? "x" : " "}] ${check.label}`,
        ),
      );
    }
  }
  return lines.join("\n");
}

function EvidenceExport({ entries }: { entries: PracticeEntry[] }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    setError("");
    try {
      await waitForPracticeWrites();
      const current = await listPracticeEntries();
      const url = URL.createObjectURL(
        new Blob([await effectEvidenceMarkdown(current)], {
          type: "text/markdown;charset=utf-8",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "recall-effect-project-evidence.md";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError(
        "Could not export your saved evidence. Retry after saving your journal.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="content-panel effect-evidence">
      <div>
        <h2>Your work, with evidence</h2>
        <p>
          Milestone notes and checklists save on this device, work offline, and
          travel in Recall JSON backups. Completion is your own review of the
          work.
        </p>
        <Link className="text-link" to="/settings">
          Back up or restore your progress <ArrowRight size={15} />
        </Link>
      </div>
      <Button
        icon={Download}
        disabled={
          busy ||
          !entries.some((entry) => effectMissionIds.has(entry.mission_id))
        }
        onClick={() => void download()}
      >
        {busy ? "Exporting…" : "Export project evidence"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

function AgentGuide() {
  return (
    <details className="content-panel effect-guide">
      <summary>How to learn Effect with a coding agent</summary>
      <ol>
        <li>
          <strong>Specify.</strong> Write the user action, business rule, and
          acceptance checks before requesting code.
        </li>
        <li>
          <strong>Inspect.</strong> Have the agent trace relevant files, package
          versions, and existing tests, then propose one small change.
        </li>
        <li>
          <strong>Predict.</strong> Explain the failure case yourself. Write or
          revise the core business rule before reviewing the agent's
          implementation.
        </li>
        <li>
          <strong>Verify.</strong> Run the success and failure checks. Read the
          diff and explain the input, error, service, and storage boundaries.
        </li>
        <li>
          <strong>Reflect.</strong> Save a commit or file path, actual test
          results, and one tradeoff in the journal. Repeat a small variation
          without the agent.
        </li>
      </ol>
      <h3>Choose one Effect version</h3>
      <p>
        For a fresh learning branch, the v3 references below provide one
        consistent starting point. If your project already uses v4, use its
        matching documentation and source examples throughout. Pin the resolved
        version and commit the lockfile. Ask the agent to inspect package
        versions before writing Effect code.
      </p>
      <p>
        Read <code>Effect&lt;Success, Error, Requirements&gt;</code> as: what
        this operation returns, how it can fail, and what services it needs.
        Compose operations inside the application; run them at UI, HTTP, or
        worker entry points.
      </p>
      <p>
        Keep React for interface state. Start Effect at validation and storage
        boundaries, then add services, transactions, and background work as the
        projects require them.
      </p>
      <ul className="effect-resources">
        {effectResources.map((resource) => (
          <li key={resource.url}>
            <a href={resource.url} target="_blank" rel="noreferrer">
              {resource.label} ↗
            </a>
          </li>
        ))}
      </ul>
      <p className="practice-note">
        Reference links require a connection. The project guides and saved
        journal remain available offline after the app is installed.
      </p>
    </details>
  );
}

function Prompt({
  project,
  milestone,
}: {
  project: EffectProject;
  milestone: EffectMilestone;
}) {
  const [message, setMessage] = useState("");
  const prompt = agentPrompt(project, milestone);
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setMessage("Prompt copied.");
    } catch {
      setMessage("Select the prompt below and copy it manually.");
    }
  }
  return (
    <details className="content-panel effect-prompt">
      <summary>Your agent brief</summary>
      <p>
        Use this after writing your own acceptance examples. Keep the agent's
        changes small enough to explain.
      </p>
      <Button onClick={() => void copy()}>Copy agent prompt</Button>
      <span role="status">{message}</span>
      <pre tabIndex={0} aria-label="Agent prompt">
        {prompt}
      </pre>
    </details>
  );
}

function MissingProject() {
  return (
    <div className="empty-panel">
      <h1>Project or activity not found</h1>
      <Link className="text-link" to={root}>
        All Effect projects
      </Link>
    </div>
  );
}

export function EffectLabScreen() {
  const { projectId, milestoneId } = useParams();
  const entries = useLiveQuery(listPracticeEntries);
  if (!entries)
    return (
      <p className="loading-state" role="status">
        Loading your project progress…
      </p>
    );
  if (projectId) {
    const summary = effectProjects.find((item) => item.id === projectId);
    if (
      !summary ||
      (milestoneId &&
        !summary.milestones.some((item) => item.id === milestoneId))
    )
      return <MissingProject />;
    return (
      <ProjectRoute
        key={projectId}
        projectId={projectId}
        milestoneId={milestoneId}
        entries={entries}
      />
    );
  }
  return <EffectCatalog entries={entries} />;
}

function ProjectRoute({
  projectId,
  milestoneId,
  entries,
}: {
  projectId: string;
  milestoneId?: string;
  entries: PracticeEntry[];
}) {
  const navigate = useNavigate();
  const [project, setProject] = useState<EffectProject>();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadEffectProject(projectId).then(
      (value) => {
        if (active) setProject(value);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [projectId, attempt]);
  if (error)
    return (
      <div className="empty-panel" role="alert">
        <h1>Could not load this project</h1>
        <p>
          Check your connection and retry. Your saved evidence is still on this
          device.
        </p>
        <Button
          onClick={() => {
            setError(false);
            setAttempt((value) => value + 1);
          }}
        >
          Retry project download
        </Button>
        <Link to={root}>All Effect projects</Link>
      </div>
    );
  if (!project)
    return (
      <p className="loading-state" role="status">
        Loading this project's guide…
      </p>
    );
  const milestone = project.milestones.find((item) => item.id === milestoneId);
  if (milestone) {
    const nextIndex = project.milestones.indexOf(milestone) + 1;
    const next = project.milestones[nextIndex];
    const previous = project.milestones[nextIndex - 2];
    const nextProject =
      effectProjects[
        effectProjects.findIndex((item) => item.id === project.id) + 1
      ];
    return (
      <div className="effect-lab">
        <nav className="effect-lesson-nav" aria-label="Milestone navigation">
          <Link className="text-link" to={projectUrl(project)}>
            Project overview
          </Link>
          <label>
            Jump to activity
            <select
              value={milestone.id}
              onChange={(event) =>
                navigate(`${projectUrl(project)}/${event.target.value}`)
              }
            >
              {project.milestones.map((item, index) => (
                <option value={item.id} key={item.id}>
                  {index + 1}. {item.title}
                  {status(item, entries) === "Completed" ? " — completed" : ""}
                </option>
              ))}
            </select>
          </label>
          <div>
            {previous && (
              <Link className="text-link" to={milestoneUrl(project, previous)}>
                <ArrowLeft size={15} /> Previous
              </Link>
            )}
            {next && (
              <Link className="text-link" to={milestoneUrl(project, next)}>
                Next <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </nav>
        <Suspense
          fallback={
            <p role="status" className="loading-state">
              Loading the evidence workspace…
            </p>
          }
        >
          <MissionWorkspace
            key={milestone.id}
            mission={milestone}
            initial={
              entries.find((entry) => entry.mission_id === milestone.id) ??
              emptyPracticeEntry(milestone.id)
            }
            backTo={projectUrl(project)}
            backLabel={project.title}
            nextLink={
              next
                ? { to: milestoneUrl(project, next), label: "Next activity" }
                : nextProject
                  ? {
                      to: projectUrl(nextProject),
                      label: `Next project: ${nextProject.title}`,
                    }
                  : { to: root, label: "Review your project path" }
            }
            learningContent={
              <>
                <section className="content-panel effect-concept">
                  {milestone.parentId && (
                    <Link
                      className="text-link"
                      to={`${projectUrl(project)}/${milestone.parentId}`}
                    >
                      Review the build milestone <ArrowRight size={15} />
                    </Link>
                  )}
                  <div className="eyebrow">
                    {milestone.parentId ? "PRACTICE DRILL" : "BUILD MILESTONE"}{" "}
                    {nextIndex} / {project.milestones.length}
                  </div>
                  <h2>{milestone.concept}</h2>
                  <p>{milestone.explanation}</p>
                  {milestone.workedExample && (
                    <div className="effect-worked-example">
                      <h3>Worked example</h3>
                      <p>{milestone.workedExample}</p>
                    </div>
                  )}
                  {milestone.retrieval?.length ? (
                    <section
                      className="effect-recall"
                      aria-label="Recall before you build"
                    >
                      <h3>Recall before you build</h3>
                      <p>
                        Answer from memory, then reveal the explanation. Revisit
                        these questions tomorrow and apply the idea to a
                        different feature.
                      </p>
                      {milestone.retrieval.map(
                        ({ question, answer }, index) => (
                          <details key={question}>
                            <summary>
                              {index + 1}. {question}
                              <span>Reveal answer</span>
                            </summary>
                            <p>{answer}</p>
                          </details>
                        ),
                      )}
                    </section>
                  ) : null}
                  <h3>Try to break it</h3>
                  <p>{milestone.experiment}</p>
                </section>
                <Prompt
                  key={milestone.id}
                  project={project}
                  milestone={milestone}
                />
              </>
            }
          />
        </Suspense>
      </div>
    );
  }
  return <ProjectDetail key={project.id} project={project} entries={entries} />;
}

function EffectCatalog({ entries }: { entries: PracticeEntry[] }) {
  const [params, setParams] = useSearchParams();
  const progressById = useMemo(() => buildProgressMap(entries), [entries]);
  const completion = useMemo(() => {
    const byProject = new Map<string, number>();
    const byStage = new Map(
      effectStages.map((stage) => [stage, { done: 0, total: 0 }]),
    );
    let complete = 0;
    let hasProgress = false;
    for (const project of effectProjects) {
      let finished = 0;
      for (const milestone of project.milestones) {
        const state = progressById.get(milestone.id);
        if (state) hasProgress = true;
        const stage = byStage.get(milestone.stage)!;
        stage.total++;
        if (state === "Completed") {
          complete++;
          finished++;
          stage.done++;
        }
      }
      byProject.set(project.id, finished);
    }
    return { complete, hasProgress, byProject, byStage };
  }, [progressById]);
  const next = useMemo(
    () => continuation(effectProjects, entries, progressById),
    [entries, progressById],
  );
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const focusNextPage = useRef(false);
  const [searchIndex, setSearchIndex] = useState<EffectSearchIndex>();
  const [searchError, setSearchError] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const hasQuery = Boolean(params.get("q")?.trim());
  useEffect(() => {
    if (!hasQuery || searchIndex) return;
    let active = true;
    loadEffectSearch().then(
      (value) => {
        if (active) setSearchIndex(value);
      },
      () => {
        if (active) setSearchError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [hasQuery, searchIndex, searchAttempt]);
  const query = params.get("q") ?? "";
  const track =
    effectTracks.find((item) => item === params.get("track")) ?? "All topics";
  const kind = ["Extend Recall", "Standalone app"].includes(
    params.get("kind") ?? "",
  )
    ? params.get("kind")!
    : "All projects";
  const progress =
    progressOptions.find((item) => item === params.get("progress")) ??
    "All progress";
  const stage =
    effectStages.find((item) => item === params.get("stage")) ?? "All stages";
  const view = params.get("view") === "milestones" ? "milestones" : "projects";
  const activity = ["Build milestones", "Practice drills"].includes(
    params.get("activity") ?? "",
  )
    ? params.get("activity")!
    : "All activities";
  const searchPending = hasQuery && !searchIndex;
  const matches = useMemo(
    () =>
      searchPending
        ? []
        : findMilestones(
            effectProjects,
            entries,
            {
              query,
              kind,
              progress,
              stage,
              activity,
              track,
            },
            searchIndex,
            progressById,
          ),
    [
      entries,
      query,
      kind,
      progress,
      stage,
      activity,
      track,
      searchIndex,
      searchPending,
      progressById,
    ],
  );
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  const page = Math.max(
    1,
    Math.min(pageCount, Number.parseInt(params.get("page") ?? "1", 10) || 1),
  );
  const pageMatches = matches.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    if (!focusNextPage.current) return;
    focusNextPage.current = false;
    resultsHeading.current?.focus();
    resultsHeading.current?.scrollIntoView?.({ block: "start" });
  }, [page]);
  const visible = effectProjects.filter((item) =>
    matches.some((match) => match.project.id === item.id),
  );
  const { complete } = completion;
  function filter(key: string, value: string) {
    if (key === "page") focusNextPage.current = true;
    const updated = new URLSearchParams(params);
    if (key !== "page") updated.delete("page");
    if (
      value &&
      ![
        "All projects",
        "All progress",
        "All stages",
        "All activities",
        "All topics",
        "projects",
      ].includes(value)
    )
      updated.set(key, value);
    else updated.delete(key);
    setParams(updated, { replace: true });
  }
  return (
    <div className="effect-lab">
      <section className="effect-hero">
        <div className="effect-kicker">
          <Code2 size={18} /> BUILD · DEBUG · EXPLAIN
        </div>
        <h1>Effect & agentic CRUD</h1>
        <p className="effect-lead">Build apps you can explain.</p>
        <p>
          {effectProjects.length} guided projects and {effectMissions.length}{" "}
          activities take you from your first Effect operation to reliable
          full-stack apps. Build, investigate failures, and learn to direct
          coding agents with evidence.
        </p>
        <div className="effect-hero-actions">
          <Link
            className="practice-primary-link"
            to={
              next
                ? milestoneUrl(next.project, next.milestone)
                : projectUrl(effectProjects[0])
            }
          >
            {next
              ? completion.hasProgress
                ? "Continue building"
                : "Start the project tracker"
              : "Revisit your projects"}{" "}
            <ArrowRight size={17} />
          </Link>
          <span>
            {complete} / {effectMissions.length} activities completed
          </span>
        </div>
        <progress
          aria-label="Effect activities completed"
          value={complete}
          max={effectMissions.length}
        />
      </section>
      <div className="effect-orientation">
        <div>
          <span>APPLY THE SKILLS</span>
          <h2>Project practice</h2>
          <p>
            Extend Recall, then build complete support, inventory, booking, and
            workflow apps. Practice one feature at a time.
          </p>
          <button
            className="text-link"
            aria-pressed={track === "Project practice"}
            onClick={() => setParams({ track: "Project practice" })}
          >
            Explore project practice <ArrowRight size={15} />
          </button>
        </div>
        <div>
          <span>UNDERSTAND THE BASICS</span>
          <h2>Fundamentals</h2>
          <p>
            Strengthen JavaScript, TypeScript, Effect, relational data, HTTP,
            and secure CRUD with worked examples and recall questions.
          </p>
          <button
            className="text-link"
            aria-pressed={track === "Fundamentals"}
            onClick={() => setParams({ track: "Fundamentals" })}
          >
            Explore fundamentals <ArrowRight size={15} />
          </button>
        </div>
        <div>
          <span>REASON ABOUT THE WHOLE APP</span>
          <h2>System design</h2>
          <p>
            Model workloads, choose boundaries, trace failures, and justify
            consistency, caching, queues, and recovery with evidence.
          </p>
          <button
            className="text-link"
            aria-pressed={track === "System design"}
            onClick={() => setParams({ track: "System design" })}
          >
            Explore system design <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <p className="practice-note">
        Follow a project's build milestones, then revisit its concepts through
        focused drills. Use Fundamentals to fill a gap and System design to
        reason about tradeoffs. Implement and run each project in your
        development environment; this section stores your learning progress and
        evidence.
      </p>
      <AgentGuide />
      <section
        className="effect-stage-progress"
        aria-label="Progress by learning stage"
      >
        {effectStages.map((item) => {
          const { done, total } = completion.byStage.get(item)!;
          return (
            <button
              key={item}
              aria-pressed={stage === item}
              onClick={() =>
                filter("stage", stage === item ? "All stages" : item)
              }
            >
              <strong>{item}</strong>
              <span>
                {done} / {total} completed
              </span>
              <progress
                aria-label={`${item} progress`}
                value={done}
                max={total}
              />
            </button>
          );
        })}
      </section>
      <div
        className="effect-view-options"
        role="group"
        aria-label="Browse layout"
      >
        <button
          aria-pressed={view === "projects"}
          onClick={() => filter("view", "projects")}
        >
          Projects
        </button>
        <button
          aria-pressed={view === "milestones"}
          onClick={() => filter("view", "milestones")}
        >
          All activities
        </button>
      </div>
      <div className="effect-filters">
        <label>
          Search projects
          <input
            type="search"
            placeholder="Search concepts, lessons, and failure cases"
            value={query}
            onChange={(event) => filter("q", event.target.value)}
          />
        </label>
        <label>
          Learning topic
          <select
            value={track}
            onChange={(event) => filter("track", event.target.value)}
          >
            <option>All topics</option>
            {effectTracks.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Project type
          <select
            value={kind}
            onChange={(event) => filter("kind", event.target.value)}
          >
            <option>All projects</option>
            <option>Extend Recall</option>
            <option>Standalone app</option>
          </select>
        </label>
        <label>
          Activity progress
          <select
            value={progress}
            onChange={(event) => filter("progress", event.target.value)}
          >
            {progressOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Activity type
          <select
            value={activity}
            onChange={(event) => filter("activity", event.target.value)}
          >
            <option>All activities</option>
            <option>Build milestones</option>
            <option>Practice drills</option>
          </select>
        </label>
        <label>
          Learning stage
          <select
            value={stage}
            onChange={(event) => filter("stage", event.target.value)}
          >
            <option>All stages</option>
            {effectStages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <span role="status">
          {searchPending
            ? "Loading full-text search…"
            : `${visible.length} ${visible.length === 1 ? "project" : "projects"} · ${matches.length} ${matches.length === 1 ? "activity" : "activities"}`}
        </span>
        {(query ||
          track !== "All topics" ||
          kind !== "All projects" ||
          progress !== "All progress" ||
          activity !== "All activities" ||
          stage !== "All stages") &&
          visible.length > 0 && (
            <Button
              onClick={() =>
                setParams(view === "milestones" ? { view: "milestones" } : {})
              }
            >
              Clear filters
            </Button>
          )}
      </div>
      {searchPending && searchError && (
        <div className="empty-panel" role="alert">
          <p>
            Full-text search could not load. Your project guides and evidence
            are unchanged.
          </p>
          <Button
            onClick={() => {
              setSearchError(false);
              setSearchAttempt((value) => value + 1);
            }}
          >
            Retry search
          </Button>
          <Button onClick={() => filter("q", "")}>Clear search</Button>
        </div>
      )}
      {view === "projects" ? (
        <div className="effect-project-grid">
          {visible.map((item) => {
            const finished = completion.byProject.get(item.id) ?? 0;
            return (
              <Link
                className="effect-project-card"
                key={item.id}
                to={projectUrl(item)}
              >
                <div className="effect-card-top">
                  <span className="effect-number">
                    {String(effectProjects.indexOf(item) + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {item.track && item.track !== "Project practice"
                      ? item.track
                      : item.kind}
                  </span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <div className="effect-tags">
                  {[
                    ...new Set(
                      item.milestones.map(
                        (step) => step.concept.split(" · ")[0],
                      ),
                    ),
                  ]
                    .slice(0, 4)
                    .map((concept) => (
                      <span key={concept}>{concept}</span>
                    ))}
                </div>
                {(query ||
                  progress !== "All progress" ||
                  stage !== "All stages") && (
                  <small>
                    {
                      matches.filter((match) => match.project.id === item.id)
                        .length
                    }{" "}
                    matching activities
                  </small>
                )}
                <div className="effect-card-bottom">
                  <span>
                    {finished === item.milestones.length && <Check size={15} />}{" "}
                    {finished} / {item.milestones.length} complete
                  </span>
                  <ArrowRight size={18} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="effect-milestones" aria-label="Matching activities">
          <h2
            ref={resultsHeading}
            tabIndex={-1}
            className="effect-results-heading"
          >
            Activities
          </h2>
          {pageMatches.map(({ project: item, milestone: lesson, index }) => (
            <Link
              className="effect-milestone-card"
              key={lesson.id}
              to={milestoneUrl(item, lesson)}
            >
              <span className="effect-number">{index + 1}</span>
              <div>
                <small>
                  {item.title} · {activityType(lesson)} ·{" "}
                  {status(lesson, entries, progressById)} · {lesson.minutes} min
                </small>
                <h2>{lesson.title}</h2>
                <p>{lesson.brief}</p>
                <span className="effect-concept-label">{lesson.concept}</span>
              </div>
              <ArrowRight size={20} />
            </Link>
          ))}
        </div>
      )}
      {view === "milestones" && matches.length > pageSize && (
        <nav className="effect-pagination" aria-label="Activity results pages">
          <Button
            disabled={page === 1}
            onClick={() => filter("page", String(page - 1))}
          >
            Previous page
          </Button>
          <span role="status">
            {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, matches.length)} of {matches.length}{" "}
            activities · Page {page} of {pageCount}
          </span>
          <Button
            disabled={page === pageCount}
            onClick={() => filter("page", String(page + 1))}
          >
            Next page
          </Button>
        </nav>
      )}
      {!visible.length && !searchPending && (
        <div className="empty-panel">
          <h2>
            {view === "milestones"
              ? "No activities match"
              : "No projects match"}
          </h2>
          <p>Try a different concept or show all projects.</p>
          <Button
            onClick={() =>
              setParams(view === "milestones" ? { view: "milestones" } : {})
            }
          >
            Clear filters
          </Button>
        </div>
      )}
      <EvidenceExport entries={entries} />
      <Link className="text-link" to="/workshop">
        Use the existing CRUD workshop and failure fixtures{" "}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function ProjectGuideDownload({ project }: { project: EffectProject }) {
  const [error, setError] = useState("");
  return (
    <section className="content-panel effect-evidence">
      <div>
        <h2>Take the project guide with you</h2>
        <p>
          Download the complete brief, explanations, steps, failure cases, and
          acceptance checks as Markdown. Plan several sessions; the estimates
          describe focused work, not a deadline.
        </p>
      </div>
      <Button
        icon={Download}
        onClick={() => {
          try {
            downloadMarkdown(
              `recall-${project.id}-guide.md`,
              projectGuideMarkdown(project),
            );
            setError("");
          } catch {
            setError(
              "The guide could not be downloaded. Try again in this browser.",
            );
          }
        }}
      >
        Download project guide
      </Button>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}

function ProjectDetail({
  project,
  entries,
}: {
  project: EffectProject;
  entries: PracticeEntry[];
}) {
  const finished = project.milestones.filter(
    (item) => status(item, entries) === "Completed",
  ).length;
  const next = continuation([project], entries);
  const core = project.milestones.filter((item) => !item.parentId);
  const drills = project.milestones.filter((item) => item.parentId);
  const previous =
    effectProjects[
      effectProjects.findIndex((item) => item.id === project.id) - 1
    ];
  return (
    <article className="effect-lab">
      <Link className="text-link" to={root}>
        <ArrowLeft size={16} /> All Effect projects
      </Link>
      <header className="effect-project-heading">
        <div className="eyebrow">
          PROJECT{" "}
          {String(
            effectProjects.findIndex((item) => item.id === project.id) + 1,
          ).padStart(2, "0")}{" "}
          · {project.kind}
        </div>
        <h1>{project.title}</h1>
        <p>{project.outcome}</p>
        <div className="effect-hero-actions">
          <span>
            {finished} / {project.milestones.length} activities completed
          </span>
          {next && (
            <Link
              className="practice-primary-link"
              to={milestoneUrl(project, next.milestone)}
            >
              Continue this project <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </header>
      <ProjectGuideDownload project={project} />
      <section className="content-panel effect-project-brief">
        <h2>Before you build</h2>
        <p>{project.prerequisites}</p>
        {previous && (
          <Link className="text-link" to={projectUrl(previous)}>
            Previous project: {previous.title}
          </Link>
        )}
        <h3>Model the data</h3>
        <ul>
          {project.model.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Trace the boundary</h3>
        <p className="effect-boundary">{project.boundaries}</p>
        {project.resources?.length ? (
          <>
            <h3>Read the primary sources</h3>
            <ul className="effect-resources">
              {project.resources.map((resource) => (
                <li key={resource.url}>
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    {resource.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="practice-note">
              Reference links need a connection. The worked examples and recall
              questions are included in your offline guide.
            </p>
          </>
        ) : null}
      </section>
      <section className="effect-milestones" aria-label="Project milestones">
        <h2>Build in {core.length} milestones</h2>
        <p>
          Each milestone includes a concept explanation, implementation steps, a
          failure experiment, an agent brief, and an evidence journal. Then
          explore {drills.length} practice drills with new constraints, data,
          and failure cases.
        </p>
        {core.map((item, index) => (
          <div className="effect-milestone-group" key={item.id}>
            <Link
              className="effect-milestone-card"
              key={item.id}
              to={milestoneUrl(project, item)}
            >
              <span className="effect-number">{index + 1}</span>
              <div>
                <small>
                  {status(item, entries)} · about {item.minutes} min, split as
                  needed
                </small>
                <h3>{item.title}</h3>
                <p>{item.brief}</p>
                <span className="effect-concept-label">{item.concept}</span>
              </div>
              <ArrowRight size={20} />
            </Link>
            <DrillGroup
              project={project}
              parent={item}
              drills={drills.filter((drill) => drill.parentId === item.id)}
              entries={entries}
            />
          </div>
        ))}
      </section>
      <AgentGuide />
      <EvidenceExport entries={entries} />
    </article>
  );
}

function DrillGroup({
  project,
  parent,
  drills,
  entries,
}: {
  project: EffectProject;
  parent: EffectActivitySummary;
  drills: EffectMilestone[];
  entries: PracticeEntry[];
}) {
  const [open, setOpen] = useState(false);
  if (!drills.length) return null;
  return (
    <details
      className="effect-drill-group"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        {drills.length} practice drills · {parent.title}
      </summary>
      {open && (
        <div className="effect-drill-list">
          {drills.map((drill) => (
            <Link
              className="effect-milestone-card"
              key={drill.id}
              to={milestoneUrl(project, drill)}
            >
              <div>
                <small>
                  {status(drill, entries)} · {drill.minutes} min · {drill.stage}
                </small>
                <h3>{drill.title}</h3>
                <p>{drill.brief}</p>
                <span className="effect-concept-label">{drill.concept}</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      )}
    </details>
  );
}
