import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { curriculum } from "../data/curriculum-catalog";
import {
  getLearningSettings,
  learningDefaults,
  saveLearningSettings,
} from "../db/repos/learningRepo";
export const pathNames = [...new Set(curriculum.map((deck) => deck.track))];
export function GoalPicker() {
  const settings = useLiveQuery(getLearningSettings, [], learningDefaults);
  const [error, setError] = useState("");
  return (
    <section className="content-panel goal-picker">
      <label htmlFor="learning-goal">
        <strong>Your learning goal</strong>
      </label>
      <select
        id="learning-goal"
        value={settings.path}
        onChange={(e) => {
          setError("");
          void saveLearningSettings({ path: e.target.value }).catch(() =>
            setError("Could not save your goal. Please retry."),
          );
        }}
      >
        <option value="">Mixed study · all decks</option>
        {pathNames.map((path) => (
          <option key={path}>{path}</option>
        ))}
      </select>
      <p>
        Choose a path or keep mixed study. You can change it and skip ahead at
        any time.
      </p>
      {settings.path && (
        <Link
          className="text-link"
          to={"/paths/" + encodeURIComponent(settings.path)}
        >
          See your path and next steps
        </Link>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
