import data from "./workshop-units.json" with { type: "json" };
import type { EngineeringMission } from "./engineering-missions";
export const workshopUnits = data;
export { workshopGroups } from "./workshop-groups.ts";
export const workshopMissions: EngineeringMission[] = workshopUnits.map(
  (unit) => ({
    id: "lab-" + unit.id,
    title: unit.title,
    stage:
      unit.group === "Capstones"
        ? "Build independently"
        : unit.group === "Operations" ||
            unit.group === "AI-assisted engineering"
          ? "Own the outcome"
          : "Make it reliable",
    minutes: unit.group === "Capstones" ? 240 : 45,
    skill: unit.group,
    brief:
      unit.objective +
      " Use the supplied case file and record the observed result.",
    steps: [
      unit.task,
      "Record your attempt before opening the reference explanation.",
      "Run the checks and save the observed results in your evidence journal.",
    ],
    checks: unit.rubric.map((label, index) => ({
      id: "check-" + index,
      label,
    })),
    stretch:
      "Repeat with a new failure case and explain which assumption changed.",
    review: unit.solution,
    study: unit.group,
  }),
);
