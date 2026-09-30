import type {
  EffectMilestone,
  EffectProject,
} from "../../data/effect-projects";
import type { PracticeEntry } from "../../db/repos/practiceRepo";
import type {
  EffectActivitySummary,
  EffectProjectSummary,
  EffectSearchIndex,
} from "../../data/effect-library-types";

export const effectStages = [
  "Build independently",
  "Make it reliable",
  "Own the outcome",
] as const;
export const effectTracks = [
  "Project practice",
  "Fundamentals",
  "System design",
] as const;
export const progressOptions = [
  "All progress",
  "Ready to start",
  "In progress",
  "Completed",
] as const;
export type EvidenceState = Pick<PracticeEntry, "mission_id" | "completed">;
export type MilestoneProgress = "Ready to start" | "In progress" | "Completed";
export type ProgressMap = ReadonlyMap<string, MilestoneProgress>;

export function buildProgressMap(entries: EvidenceState[]): ProgressMap {
  return new Map<string, MilestoneProgress>(
    entries.map((entry) => [
      entry.mission_id,
      entry.completed ? "Completed" : "In progress",
    ]),
  );
}
export type MilestoneMatch = {
  project: EffectProjectSummary;
  milestone: EffectActivitySummary;
  index: number;
};

export function milestoneStatus(
  item: Pick<EffectMilestone, "id">,
  entries: EvidenceState[],
  progressById?: ProgressMap,
): MilestoneProgress {
  if (progressById) return progressById.get(item.id) ?? "Ready to start";
  const entry = entries.find((candidate) => candidate.mission_id === item.id);
  return entry?.completed
    ? "Completed"
    : entry
      ? "In progress"
      : "Ready to start";
}

export function findMilestones(
  projects: EffectProjectSummary[],
  entries: EvidenceState[],
  filters: {
    query?: string;
    kind?: string;
    progress?: string;
    stage?: string;
    activity?: string;
    track?: string;
  } = {},
  searchIndex?: EffectSearchIndex,
  progressById: ProgressMap = buildProgressMap(entries),
): MilestoneMatch[] {
  const tokens = (filters.query ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return projects
    .flatMap((project) =>
      project.milestones.map((milestone, index) => ({
        project,
        milestone,
        index,
      })),
    )
    .filter(({ project, milestone }) => {
      const searchable =
        searchIndex?.[milestone.id] ??
        [
          project.title,
          project.summary,
          milestone.title,
          milestone.concept,
          milestone.brief,
          ...("explanation" in milestone
            ? [
                (milestone as EffectMilestone).explanation,
                (milestone as EffectMilestone).experiment,
                ...(milestone as EffectMilestone).steps,
              ]
            : []),
        ]
          .join(" ")
          .toLowerCase();
      return (
        (!filters.track ||
          filters.track === "All topics" ||
          filters.track === (project.track ?? "Project practice")) &&
        (!filters.kind ||
          filters.kind === "All projects" ||
          filters.kind === project.kind) &&
        (!filters.stage ||
          filters.stage === "All stages" ||
          filters.stage === milestone.stage) &&
        (!filters.activity ||
          filters.activity === "All activities" ||
          (filters.activity === "Practice drills"
            ? Boolean(milestone.parentId)
            : !milestone.parentId)) &&
        (!filters.progress ||
          filters.progress === "All progress" ||
          filters.progress ===
            (progressById.get(milestone.id) ?? "Ready to start")) &&
        tokens.every((token) => searchable.includes(token))
      );
    });
}

export function projectGuideMarkdown(project: EffectProject) {
  return [
    `# ${project.title}`,
    "",
    project.outcome,
    "",
    "## Prerequisites",
    project.prerequisites,
    "",
    "## Data model",
    ...project.model.map((item) => `- ${item}`),
    "",
    "## Boundaries",
    project.boundaries,
    ...(project.resources?.length
      ? [
          "",
          "## References",
          ...project.resources.map(
            (resource) => `- [${resource.label}](${resource.url})`,
          ),
        ]
      : []),
    ...project.milestones.flatMap((item, index) => [
      "",
      `## ${index + 1}. ${item.title}`,
      "",
      `${item.stage} | ${item.minutes} minutes, split as needed`,
      "",
      item.brief,
      "",
      `### ${item.concept}`,
      item.explanation,
      ...(item.workedExample
        ? ["", "### Worked example", item.workedExample]
        : []),
      ...(item.retrieval?.length
        ? [
            "",
            "### Recall before you build",
            "Answer each question from memory before checking the explanation.",
            ...item.retrieval.flatMap(({ question, answer }) => [
              "",
              `**${question}**`,
              "",
              "<details><summary>Reveal answer</summary>",
              "",
              answer,
              "",
              "</details>",
            ]),
          ]
        : []),
      "",
      "### Build steps",
      ...item.steps.map((step, i) => `${i + 1}. ${step}`),
      "",
      "### Failure experiment",
      item.experiment,
      "",
      "### Acceptance checks",
      ...item.checks.map((check) => `- [ ] ${check.label}`),
      "",
      "### Review",
      item.review,
      "",
      "### Stretch",
      item.stretch,
    ]),
    "",
    "## Record your evidence",
    "For each milestone, record what changed, how you verified it, and a tradeoff or next step in Recall. Completion is self-reviewed practice.",
  ].join("\n");
}
