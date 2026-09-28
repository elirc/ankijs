import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getLearningSettings,
  learningDefaults,
  saveLearningSettings,
} from "../db/repos/learningRepo";
export function ApplyReadingPreferences() {
  const settings = useLiveQuery(getLearningSettings, [], learningDefaults);
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      root.dataset.theme =
        settings.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : settings.theme;
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    root.dataset.wrapCode = String(settings.wrapCode);
    root.style.setProperty("--reading-size", settings.fontSize + "px");
    return () => media.removeEventListener("change", applyTheme);
  }, [settings]);
  return null;
}
export function ReadingPreferences() {
  const value = useLiveQuery(getLearningSettings, [], learningDefaults);
  const save = (patch: Parameters<typeof saveLearningSettings>[0]) => {
    void saveLearningSettings(patch).catch(() =>
      window.dispatchEvent(new CustomEvent("recall:preference-error")),
    );
  };
  return (
    <section className="content-panel settings-section">
      <h2>Reading preferences</h2>
      <label className="setting-label">
        Text size
        <select
          value={value.fontSize}
          onChange={(e) => save({ fontSize: Number(e.target.value) })}
        >
          {[16, 18, 20, 22].map((n) => (
            <option key={n} value={n}>
              {n}px
            </option>
          ))}
        </select>
      </label>
      <label className="setting-label">
        Appearance
        <select
          value={value.theme}
          onChange={(e) =>
            save({ theme: e.target.value as typeof value.theme })
          }
        >
          {["system", "light", "dark"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label className="setting-label">
        <input
          type="checkbox"
          checked={value.wrapCode}
          onChange={(e) => save({ wrapCode: e.target.checked })}
        />{" "}
        Wrap long code lines
      </label>
      <label className="setting-label">
        Preferred explanation
        <select
          value={value.explanation}
          onChange={(e) => save({ explanation: e.target.value })}
        >
          <option value="">First explanation</option>
          {[
            "Plain English",
            "A worked example",
            "Picture it another way",
            "A common mistake",
            "Try a small exercise",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
