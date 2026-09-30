import catalogData from "../../data/effect-catalog.json";
import type { EffectProject } from "../../data/effect-projects";
import type {
  EffectProjectSummary,
  EffectSearchIndex,
} from "../../data/effect-library-types";

export const effectProjects = catalogData as EffectProjectSummary[];
export const effectActivities = effectProjects.flatMap(
  (project) => project.milestones,
);
const projectsById = new Map(
  effectProjects.map((project) => [project.id, project]),
);
const loaders = import.meta.glob<{ default: EffectProject }>(
  "../../data/effect-packs/*.json",
);
const loaded = new Map<string, Promise<EffectProject>>();

export function loadEffectProject(id: string): Promise<EffectProject> {
  const loader = loaders[`../../data/effect-packs/${id}.json`];
  if (!projectsById.has(id) || !loader)
    return Promise.reject(new Error("Project not found"));
  let promise = loaded.get(id);
  if (!promise) {
    promise = loader()
      .then((module) => module.default)
      .catch((error) => {
        loaded.delete(id); // A transient download failure must remain retryable.
        throw error;
      });
    loaded.set(id, promise);
  }
  return promise;
}

let searchPromise: Promise<EffectSearchIndex> | undefined;
export function loadEffectSearch(): Promise<EffectSearchIndex> {
  searchPromise ??= import("../../data/effect-search.json")
    .then((module) => module.default)
    .catch((error) => {
      searchPromise = undefined;
      throw error;
    });
  return searchPromise;
}
