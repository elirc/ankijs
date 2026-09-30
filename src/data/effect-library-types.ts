import type { EffectMilestone, EffectProject } from "./effect-projects";

export type EffectActivitySummary = Pick<
  EffectMilestone,
  "id" | "title" | "concept" | "brief" | "stage" | "minutes" | "parentId"
>;
export type EffectProjectSummary = Omit<EffectProject, "milestones"> & {
  milestones: EffectActivitySummary[];
};
export type EffectSearchIndex = Record<string, string>;
export const activityType = (activity: Pick<EffectMilestone, "parentId">) =>
  activity.parentId ? "Practice drill" : "Build milestone";
