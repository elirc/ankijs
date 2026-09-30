import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
import { effectProjects as coreProjects } from "../src/data/effect-projects.ts";

const file = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => JSON.parse(readFileSync(file(path), "utf8"));
const write = process.argv.includes("--write");
const partial = process.argv.includes("--partial");
const words = (text) => String(text).trim().split(/\s+/).filter(Boolean).length;
const fields = (lesson) => [
  lesson.title,
  lesson.concept,
  lesson.brief,
  lesson.explanation,
  ...lesson.steps,
  ...lesson.checks.map((c) => c.label),
  lesson.experiment,
  lesson.review,
  lesson.stretch,
  ...(lesson.workedExample ? [lesson.workedExample] : []),
  ...(lesson.retrieval ?? []).flatMap(({ question, answer }) => [
    question,
    answer,
  ]),
];
const instructionalWords = (projects) =>
  projects.reduce(
    (total, p) =>
      total +
      words(
        [
          p.title,
          p.summary,
          p.outcome,
          p.prerequisites,
          ...p.model,
          p.boundaries,
          ...p.milestones.flatMap(fields),
        ].join(" "),
      ),
    0,
  );
const identities = (projects) =>
  Object.fromEntries(
    projects.flatMap((p) =>
      p.milestones.map((m) => [m.id, m.checks.map((c) => c.id)]),
    ),
  );
const baselinePath = "docs/effect-tenfold-baseline.json";
if (process.argv.includes("--baseline")) {
  writeFileSync(
    file(baselinePath),
    JSON.stringify(
      {
        projects: coreProjects.length,
        activities: coreProjects.flatMap((p) => p.milestones).length,
        instructionalWords: instructionalWords(coreProjects),
        identities: identities(coreProjects),
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  process.exit(0);
}
const baseline = read(baselinePath);
const originalProjects = coreProjects.map((project) => {
  const path = `src/data/effect-drills/${project.id}.json`;
  const drills = existsSync(file(path)) ? read(path) : [];
  if (!partial)
    assert.equal(drills.length, 54, `${project.id}: expected 54 drills`);
  const parents = new Set(project.milestones.map((m) => m.id));
  for (const drill of drills) {
    assert.ok(parents.has(drill.parentId), `${drill.id}: invalid parent`);
    assert.ok(
      words(
        fields({
          ...drill,
          checks: drill.checks.map((label) => ({ label })),
        }).join(" "),
      ) >= 120,
      `${drill.id}: drill needs substantive instruction`,
    );
  }
  if (!partial)
    for (const parentId of parents)
      assert.equal(
        drills.filter((d) => d.parentId === parentId).length,
        9,
        `${parentId}: expected nine drills`,
      );
  return {
    ...project,
    track: "Project practice",
    milestones: [
      ...project.milestones,
      ...drills.map((drill) => ({
        ...drill,
        skill: "Effect & agentic CRUD",
        study: "TypeScript",
        checks: drill.checks.map((label, i) => ({
          id: `criterion-${i + 1}`,
          label,
        })),
      })),
    ],
  };
});
const reinforcementManifest = read(
  "src/data/effect-reinforcement/manifest.json",
);
const reinforcementProjects = reinforcementManifest.flatMap(({ id, track }) => {
  const path = `src/data/effect-reinforcement/${id}.json`;
  if (partial && !existsSync(file(path))) return [];
  const { project, drills } = read(path);
  assert.equal(project.id, id, `${id}: mismatched project identity`);
  assert.equal(project.track, track, `${id}: incorrect learning topic`);
  assert.equal(project.kind, "Standalone app");
  assert.equal(
    project.milestones.length,
    6,
    `${id}: expected six build milestones`,
  );
  assert.equal(
    drills.length,
    12,
    `${id}: expected twelve reinforcement drills`,
  );
  assert.ok(project.resources?.length >= 2, `${id}: add primary references`);
  for (const resource of project.resources) {
    assert.ok(resource.label.trim().length > 4);
    assert.equal(new URL(resource.url).protocol, "https:");
  }
  const parents = new Set(project.milestones.map((m) => m.id));
  for (const parentId of parents)
    assert.equal(
      drills.filter((d) => d.parentId === parentId).length,
      2,
      `${parentId}: expected two drills`,
    );
  for (const drill of drills)
    assert.ok(parents.has(drill.parentId), `${drill.id}: invalid parent`);
  const milestones = [...project.milestones, ...drills].map((activity) => {
    assert.equal(
      activity.retrieval?.length,
      2,
      `${activity.id}: expected two recall questions`,
    );
    assert.ok(
      words(activity.workedExample ?? "") >= 25,
      `${activity.id}: worked example needs a solved trace`,
    );
    assert.ok(
      words(activity.explanation) >= 35,
      `${activity.id}: explain the underlying concept`,
    );
    for (const pair of activity.retrieval) {
      assert.ok(
        pair.question.trim().length >= 15,
        `${activity.id}: empty recall question`,
      );
      assert.ok(
        pair.answer.trim().length >= 30,
        `${activity.id}: empty recall answer`,
      );
    }
    const normalized = {
      ...activity,
      skill: "Effect & agentic CRUD",
      study: "TypeScript",
      checks: activity.checks.map((label, i) => ({
        id: `criterion-${i + 1}`,
        label,
      })),
    };
    assert.ok(
      words(fields(normalized).join(" ")) >= 250,
      `${activity.id}: reinforcement activity needs substantive instruction`,
    );
    return normalized;
  });
  return [{ ...project, milestones }];
});
const projects = [...originalProjects, ...reinforcementProjects];
assert.equal(
  new Set(projects.map((p) => p.id)).size,
  projects.length,
  "Duplicate project identity",
);
const activities = projects.flatMap((p) => p.milestones);
const ids = activities.map((a) => a.id);
assert.equal(new Set(ids).size, ids.length, "Duplicate activity identity");
const checks = identities(projects);
for (const [id, expected] of Object.entries(baseline.identities))
  assert.deepEqual(
    checks[id],
    expected,
    `${id}: saved checklist identity changed`,
  );
const reinforcementBaseline = read("docs/effect-reinforcement-baseline.json");
for (const [id, expected] of Object.entries(reinforcementBaseline.identities))
  assert.deepEqual(
    checks[id],
    expected,
    `${id}: existing saved progress identity changed`,
  );
for (const activity of activities) {
  assert.match(activity.id, /^[a-z0-9-]{1,120}$/);
  assert.equal(activity.steps.length, 3);
  assert.equal(activity.checks.length, 3);
  assert.ok(
    Number.isInteger(activity.minutes) && activity.minutes > 0,
    `${activity.id}: invalid duration`,
  );
  assert.ok(
    ["Build independently", "Make it reliable", "Own the outcome"].includes(
      activity.stage,
    ),
  );
  for (const text of fields(activity))
    assert.ok(typeof text === "string" && text.trim().length > 4, activity.id);
}
const drills = activities.filter((a) => a.parentId);
for (const field of ["title", "brief", "explanation", "experiment"])
  assert.equal(
    new Set(drills.map((d) => d[field].trim().toLowerCase())).size,
    drills.length,
    `Duplicate drill ${field}: each drill must teach a distinct case`,
  );
const catalog = projects.map((p) => ({
  ...p,
  milestones: p.milestones.map((m) => ({
    id: m.id,
    title: m.title,
    concept: m.concept,
    brief: m.brief,
    stage: m.stage,
    minutes: m.minutes,
    ...(m.parentId ? { parentId: m.parentId } : {}),
  })),
}));
// A separate on-demand search index keeps detailed text out of the catalog chunk.
const search = Object.fromEntries(
  projects.flatMap((p) =>
    p.milestones.map((m) => [
      m.id,
      [
        ...new Set(
          [p.title, p.summary, ...fields(m)]
            .join(" ")
            .toLowerCase()
            .split(/\s+/),
        ),
      ].join(" "),
    ]),
  ),
);
const report = {
  projects: projects.length,
  buildMilestones: activities.length - drills.length,
  practiceDrills: drills.length,
  activities: activities.length,
  acceptanceChecks: activities.reduce((n, a) => n + a.checks.length, 0),
  instructionalWords: instructionalWords(projects),
  activityMultiplier: +(activities.length / baseline.activities).toFixed(2),
  wordMultiplier: +(
    instructionalWords(projects) / baseline.instructionalWords
  ).toFixed(2),
  catalogGzipBytes: gzipSync(JSON.stringify(catalog)).length,
  detailGzipBytes: projects.reduce(
    (n, p) => n + gzipSync(JSON.stringify(p)).length,
    0,
  ),
  reinforcement: {
    projects: reinforcementProjects.length,
    activities: reinforcementProjects.reduce(
      (n, p) => n + p.milestones.length,
      0,
    ),
    retrievalQuestions: activities.reduce(
      (n, a) => n + (a.retrieval?.length ?? 0),
      0,
    ),
    workedExamples: activities.filter((a) => a.workedExample).length,
    addedInstructionalWords:
      instructionalWords(projects) -
      reinforcementBaseline.report.instructionalWords,
  },
};
if (!partial) {
  assert.equal(
    originalProjects.flatMap((p) => p.milestones).length,
    baseline.activities * 10,
  );
  assert.equal(report.reinforcement.projects, 9);
  assert.equal(report.reinforcement.activities, 162);
  assert.equal(report.reinforcement.retrievalQuestions, 324);
}
function artifact(path, value) {
  if (write) {
    mkdirSync(new URL(".", file(path)), { recursive: true });
    writeFileSync(file(path), JSON.stringify(value, null, 2) + "\n");
  } else
    assert.deepEqual(
      read(path),
      value,
      `${path} is stale; run npm run effect:build`,
    );
}
artifact("src/data/effect-catalog.json", catalog);
artifact("src/data/effect-search.json", search);
artifact("src/data/effect-completion-checks.json", checks);
artifact("docs/effect-content-report.json", report);
for (const project of projects)
  artifact(`src/data/effect-packs/${project.id}.json`, project);
console.log(JSON.stringify(report, null, 2));
