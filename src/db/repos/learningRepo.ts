import { db } from "../schema";
import { saveUserState } from "./userStateRepo";
import { curriculum } from "../../data/curriculum";
export interface LearningSettings {
  path: string;
  favorites: string[];
  fontSize: number;
  wrapCode: boolean;
  theme: "light" | "dark" | "system";
  explanation: string;
  updated_at?: string;
}
export const learningDefaults: LearningSettings = {
  path: "",
  favorites: [],
  fontSize: 16,
  wrapCode: false,
  theme: "system",
  explanation: "",
};
export function normalizeLearning(
  value: Partial<LearningSettings> = {},
): LearningSettings {
  return {
    path: curriculum.some((d) => d.track === value.path) ? value.path! : "",
    favorites: Array.isArray(value.favorites)
      ? value.favorites.filter((x) => typeof x === "string").slice(0, 1000)
      : [],
    fontSize: [16, 18, 20, 22].includes(value.fontSize ?? 0)
      ? value.fontSize!
      : 16,
    wrapCode: value.wrapCode === true,
    theme:
      value.theme === "dark" || value.theme === "light"
        ? value.theme
        : "system",
    explanation:
      typeof value.explanation === "string"
        ? value.explanation.slice(0, 100)
        : "",
  };
}
export async function getLearningSettings() {
  try {
    return normalizeLearning(
      JSON.parse((await db.sync_meta.get("learning_settings"))?.value ?? "{}"),
    );
  } catch {
    return learningDefaults;
  }
}
export async function saveLearningSettings(patch: Partial<LearningSettings>) {
  await db.transaction(
    "rw",
    db.sync_meta,
    db.user_state,
    db.outbox,
    async () => {
      const next = {
        ...normalizeLearning({ ...(await getLearningSettings()), ...patch }),
        updated_at: new Date().toISOString(),
      };
      await saveUserState(
        "learning_settings",
        JSON.stringify(next),
        next.updated_at,
      );
      await db.sync_meta.put({
        key: "learning_settings",
        value: JSON.stringify(next),
      });
    },
  );
}
export function studyLink(path: string, minutes = 5) {
  return (
    "/study?minutes=" +
    minutes +
    (path ? "&track=" + encodeURIComponent(path) : "")
  );
}
