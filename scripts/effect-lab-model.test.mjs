import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  effectProjects,
  effectMissions,
  agentPrompt,
} from "../src/data/effect-projects.ts";
import {
  buildProgressMap,
  findMilestones,
  milestoneStatus,
  projectGuideMarkdown,
} from "../src/features/effect-lab/effect-lab-model.ts";

test("progress filters select individual milestones without treating a whole project as complete", () => {
  const [done, started, untouched] = effectProjects[0].milestones;
  const entries = [
    { mission_id: done.id, completed: true },
    { mission_id: started.id, completed: false },
  ];
  assert.equal(milestoneStatus(done, entries), "Completed");
  assert.equal(milestoneStatus(started, entries), "In progress");
  assert.equal(milestoneStatus(untouched, entries), "Ready to start");
  const progressById = buildProgressMap(entries);
  for (const item of [done, started, untouched]) {
    assert.equal(
      milestoneStatus(item, entries, progressById),
      milestoneStatus(item, entries),
    );
  }
  assert.deepEqual(
    findMilestones(
      effectProjects,
      entries,
      { progress: "Completed" },
      undefined,
      progressById,
    ),
    findMilestones(effectProjects, entries, { progress: "Completed" }),
  );
  assert.deepEqual(
    findMilestones(effectProjects, entries, { progress: "Completed" }).map(
      (row) => row.milestone.id,
    ),
    [done.id],
  );
  assert.equal(
    findMilestones(effectProjects, entries, { progress: "Ready to start" })
      .length,
    effectMissions.length - 2,
  );
});

test("search reaches failure-case text and composes with kind and stage", () => {
  const rows = findMilestones(effectProjects, [], {
    query: "  POISON payload  ",
    kind: "Standalone app",
    stage: "Own the outcome",
  });
  assert.ok(
    rows.some((row) => row.milestone.id === "effect-webhooks-operations"),
  );
  assert.ok(
    rows.every(
      (row) =>
        row.project.kind === "Standalone app" &&
        row.milestone.stage === "Own the outcome",
    ),
  );
  assert.equal(
    findMilestones(effectProjects, [], {
      query: "poison payload",
      kind: "Extend Recall",
    }).length,
    0,
  );
  assert.equal(
    findMilestones(effectProjects, [], { query: "unfindable-xyz" }).length,
    0,
  );
});

test("legacy completion remains associated with the same milestone after expansion", () => {
  const entries = [{ mission_id: "effect-tracker-create", completed: true }];
  const project = effectProjects.find((item) => item.id === "project-tracker");
  assert.equal(project.milestones.length, 6);
  assert.equal(
    project.milestones.filter(
      (item) => milestoneStatus(item, entries) === "Completed",
    ).length,
    1,
  );
  assert.equal(project.milestones[0].title, "Create and list projects");
  assert.deepEqual(
    project.milestones[0].checks.map((item) => item.id),
    ["criterion-1", "criterion-2", "criterion-3"],
  );
});

test("downloaded guides and agent briefs contain the actual assignments and acceptance checks", () => {
  const project = effectProjects.find((item) => item.id === "agent-delivery");
  const guide = projectGuideMarkdown(project);
  assert.match(guide, /# Agent-assisted delivery lab/);
  assert.ok(guide.includes(project.boundaries));
  for (const item of project.milestones) {
    assert.ok(guide.includes(item.experiment));
    assert.ok(guide.includes(item.review));
    assert.ok(guide.includes(item.stretch));
    for (const step of item.steps) assert.ok(guide.includes(step));
    for (const check of item.checks) {
      assert.ok(guide.includes(check.label));
      assert.ok(agentPrompt(project, item).includes(check.label));
    }
  }
});

test("compact catalog filters drills while the separate index searches their full instructions", () => {
  const json = (path) =>
    JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  const catalog = json("../src/data/effect-catalog.json");
  const search = json("../src/data/effect-search.json");
  const pack = json("../src/data/effect-packs/project-tracker.json");
  const drill = pack.milestones.find((item) => item.parentId);
  const entries = [{ mission_id: drill.id, completed: true }];
  assert.deepEqual(
    findMilestones(catalog, entries, {
      activity: "Practice drills",
      progress: "Completed",
    }).map((row) => row.milestone.id),
    [drill.id],
  );
  assert.equal(
    findMilestones(catalog, entries, {
      activity: "Build milestones",
      progress: "Completed",
    }).length,
    0,
  );
  const query = drill.experiment
    .toLowerCase()
    .split(/\s+/)
    .slice(0, 5)
    .join(" ");
  assert.ok(
    findMilestones(
      catalog,
      [],
      { query, activity: "Practice drills" },
      search,
    ).some((row) => row.milestone.id === drill.id),
  );
  assert.ok(
    catalog.every((project) =>
      project.milestones.every(
        (item) =>
          !Object.hasOwn(item, "steps") && !Object.hasOwn(item, "explanation"),
      ),
    ),
  );
});

test("reinforcement topics compose with progress and search inside solved examples and recall answers", () => {
  const json = (path) =>
    JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
  const catalog = json("../src/data/effect-catalog.json");
  const search = json("../src/data/effect-search.json");
  const pack = json("../src/data/effect-packs/js-foundations.json");
  const drill = pack.milestones.find((item) => item.parentId);
  const entries = [{ mission_id: drill.id, completed: true }];
  assert.equal(
    findMilestones(catalog, [], { track: "Fundamentals" }).length,
    108,
  );
  assert.equal(
    findMilestones(catalog, [], { track: "System design" }).length,
    54,
  );
  assert.equal(
    findMilestones(catalog, [], { track: "Project practice" }).length,
    840,
  );
  assert.deepEqual(
    findMilestones(catalog, entries, {
      track: "Fundamentals",
      progress: "Completed",
      activity: "Practice drills",
    }).map((row) => row.milestone.id),
    [drill.id],
  );
  assert.equal(
    findMilestones(catalog, entries, {
      track: "System design",
      progress: "Completed",
    }).length,
    0,
  );
  for (const text of [
    drill.workedExample,
    ...drill.retrieval.map((pair) => pair.answer),
  ]) {
    const query = text.toLowerCase().split(/\s+/).slice(0, 8).join(" ");
    assert.ok(
      findMilestones(
        catalog,
        [],
        { track: "Fundamentals", query },
        search,
      ).some((row) => row.milestone.id === drill.id),
    );
  }
  assert.ok(
    catalog.every((project) =>
      project.milestones.every(
        (item) =>
          !Object.hasOwn(item, "workedExample") &&
          !Object.hasOwn(item, "retrieval"),
      ),
    ),
  );
});

test("reinforcement guide exports include worked examples, closed answer reveals, and primary sources", () => {
  const project = JSON.parse(
    readFileSync(
      new URL(
        "../src/data/effect-packs/distributed-reliability.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const guide = projectGuideMarkdown(project);
  for (const item of project.milestones) {
    assert.ok(guide.includes(item.workedExample));
    for (const { question, answer } of item.retrieval) {
      assert.ok(guide.includes(question));
      assert.ok(guide.includes(answer));
      assert.ok(agentPrompt(project, item).includes(question));
    }
  }
  assert.equal(
    guide.split("<details><summary>Reveal answer</summary>").length - 1,
    36,
  );
  assert.ok(!guide.includes("<details open"));
  for (const reference of project.resources)
    assert.ok(guide.includes(reference.url));
});
