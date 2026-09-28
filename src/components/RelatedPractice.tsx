import { Link } from "react-router-dom";
import { workshopUnits } from "../data/workshop";
import type { Card } from "../db/schema";
const conceptTerms: Record<string, string[]> = {
  "debug-stale-search": ["search", "race", "stale response"],
  "debug-duplicate-save": ["duplicate", "double", "save"],
  "debug-stale-edit": ["version", "concurrent", "conflict"],
  "debug-date-boundary": ["date", "time zone", "daylight"],
  "debug-offline-update": ["offline", "cache", "service worker"],
  "debug-partial-import": ["transaction", "import", "atomic"],
  "review-owner-filter": ["owner", "authorization", "permission"],
  "review-false-positive-test": ["test", "assertion"],
  "sql-deadlock": ["deadlock", "lock order"],
  "integration-signature": ["webhook", "signature", "hmac"],
  "integration-outbox": ["outbox", "queue", "worker"],
  "ai-review-diff": ["code review", "generated", "review comment"],
};
export function relatedUnits(card: Pick<Card, "id" | "front">) {
  const direct = workshopUnits.filter((u) => u.cardIds.includes(card.id));
  if (direct.length) return direct;
  const text = card.front.toLowerCase();
  return workshopUnits
    .filter((u) => conceptTerms[u.id]?.some((term) => text.includes(term)))
    .slice(0, 2);
}
export function RelatedPractice({
  card,
}: {
  card: Pick<Card, "id" | "front" | "lapses">;
}) {
  const units = relatedUnits(card);
  if (!units.length) return null;
  return (
    <aside className="content-panel related-practice">
      <h2>
        {card.lapses >= 2
          ? "Work through this difficulty"
          : "Apply this concept"}
      </h2>
      {units.map((u) => (
        <p key={u.id}>
          <Link to={"/workshop/" + u.id}>{u.title}</Link> ·{" "}
          <Link to={"/library?card=" + u.cardIds[0]}>Related recall card</Link>
        </p>
      ))}
    </aside>
  );
}
