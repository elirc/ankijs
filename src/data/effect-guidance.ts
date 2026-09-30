import type { EffectMilestone, EffectProject } from "./effect-projects";

export function agentPrompt(
  project: EffectProject,
  item: EffectMilestone,
): string {
  return `Help me implement one milestone in ${project.title}: ${item.title}.

Goal: ${item.brief}
Architecture: ${project.boundaries}
Effect focus: ${item.concept}.

First inspect the repository, its instructions, package versions, relevant code, and tests. Identify the files to change and explain a small implementation plan. Use documentation and source examples matching the installed Effect major; do not guess APIs or mix v3 and v4.

Acceptance checks:
${item.checks.map((check) => `- ${check.label}`).join("\n")}

Failure experiment: ${item.experiment}
${
  item.retrieval?.length
    ? `
Before implementation, ask me these questions one at a time and wait for my reasoning:
${item.retrieval.map(({ question }) => `- ${question}`).join("\n")}
Have me trace the worked example in the learning guide, then change one input and predict the result. Correct misconceptions before adding code.
`
    : ""
}

Work in one reviewable slice. Have me predict the failure behavior and explain the core business rule before implementing it. Preserve unrelated work. Verify the checks with observed results; do not claim a test ran when it did not. Finish with changed files, test results, limitations, and a question that checks my understanding.`;
}

export const effectResources = [
  {
    label: "Effect v3: expected errors",
    url: "https://effect.website/docs/v3/error-management/expected-errors",
  },
  {
    label: "PostgreSQL: transaction isolation",
    url: "https://www.postgresql.org/docs/current/transaction-iso.html",
  },
  {
    label: "PostgreSQL: row security policies",
    url: "https://www.postgresql.org/docs/current/ddl-rowsecurity.html",
  },
  {
    label: "Effect v3: generators",
    url: "https://effect.website/docs/v3/getting-started/using-generators",
  },
  {
    label: "Effect v3: Schema",
    url: "https://effect.website/docs/v3/schema/introduction",
  },
  {
    label: "Effect v4: services (if your project uses v4)",
    url: "https://effect.website/docs/v4/requirements-management/services",
  },
  {
    label: "Giving coding agents real Effect source",
    url: "https://effect.website/blog/the-one-weird-git-trick-that-makes-coding-agents-more-effect-ive",
  },
];
