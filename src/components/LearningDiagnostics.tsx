import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";
import { localDateStamp } from "../lib/dates";
import { RelatedPractice } from "./RelatedPractice";
export async function learningDiagnostics(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const [cards, logs, decks] = await Promise.all([
    db.cards.toArray(),
    db.review_logs
      .where("reviewed_at")
      .aboveOrEqual(cutoff.toISOString())
      .sortBy("reviewed_at"),
    db.decks.toArray(),
  ]);
  const active = cards.filter(
    (c) =>
      !c.deleted_at &&
      !c.suspended &&
      decks.some((d) => d.id === c.deck_id && !d.deleted_at),
  );
  const first = new Map<string, (typeof logs)[number]>();
  for (const log of logs) {
    const key = localDateStamp(new Date(log.reviewed_at)) + ":" + log.card_id;
    if (!first.has(key)) first.set(key, log);
  }
  const attempts = [...first.values()].filter(
    (l) => l.state_before === "review",
  );
  const forecasts = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(day.getDate() + index);
    const stamp = localDateStamp(day);
    return {
      stamp,
      count: active.filter(
        (c) => c.state !== "new" && localDateStamp(new Date(c.due)) === stamp,
      ).length,
    };
  });
  const difficult = active
    .filter((c) => c.lapses >= 2)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, 5);
  return {
    difficult,
    forecasts,
    attempts: attempts.length,
    successful: attempts.filter((l) => l.rating > 1).length,
    retries: logs.length - first.size,
    overdue: active.filter(
      (c) =>
        c.state !== "new" &&
        localDateStamp(new Date(c.due)) < localDateStamp(now),
    ).length,
  };
}
export function LearningDiagnostics() {
  const data = useLiveQuery(learningDiagnostics);
  if (!data) return null;
  return (
    <section className="content-panel space-y-6">
      <h2>What to work on next</h2>
      <p>
        First daily attempts on review-stage cards, last 30 days:{" "}
        {data.attempts
          ? Math.round((100 * data.successful) / data.attempts) +
            "% recalled without Again"
          : "not enough data"}{" "}
        ({data.attempts} attempts). {data.retries} same-day repeat ratings are
        counted separately. These are self-ratings, not verified mastery.
      </p>
      <h3>Scheduled workload</h3>
      <p>
        {data.overdue} overdue cards. The forecast excludes new cards and will
        change as you study.
      </p>
      <div className="forecast-grid">
        {data.forecasts.map((d) => (
          <div key={d.stamp}>
            <time>{d.stamp.slice(5)}</time>
            <strong>{d.count}</strong>
          </div>
        ))}
      </div>
      <h3>Repeated difficulties</h3>
      {data.difficult.length ? (
        data.difficult.map((c) => (
          <div key={c.id}>
            <Link to={"/library?card=" + c.id}>{c.front.slice(0, 150)}</Link>
            <span> · {c.lapses} lapses</span>
            <RelatedPractice card={c} />
          </div>
        ))
      ) : (
        <p>
          No repeated lapses yet.{" "}
          <Link to="/workshop">Try a guided exercise</Link> or continue your
          chosen path.
        </p>
      )}
    </section>
  );
}
