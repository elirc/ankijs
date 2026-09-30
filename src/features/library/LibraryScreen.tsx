import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/schema";
import { searchCards, updateContent } from "../../db/repos/cardRepo";
import { getDeckInfo } from "../../data/curriculum-catalog";
import {
  getLearningSettings,
  learningDefaults,
  saveLearningSettings,
} from "../../db/repos/learningRepo";
import { AnswerExplorer } from "../../components/AnswerExplorer";
import { MarkdownView } from "../../components/MarkdownView";
import { ConfirmDialog } from "../../components/ConfirmDialog";
export function LibraryScreen() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const filter = params.get("filter") ?? "all";
  const cardId = params.get("card");
  const [limit, setLimit] = useState(30);
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const settings = useLiveQuery(getLearningSettings, [], learningDefaults);
  const data = useLiveQuery(
    async () => ({
      cards: await searchCards(query),
      decks: await db.decks.toArray(),
    }),
    [query],
  );
  const rows = (data?.cards ?? []).filter(
    (c) =>
      !data?.decks.find((d) => d.id === c.deck_id)?.deleted_at &&
      (!cardId || c.id === cardId) &&
      (filter === "all" ||
        (filter === "suspended" && c.suspended) ||
        (filter === "difficult" && c.lapses >= 2) ||
        (filter === "personal" && !getDeckInfo(c.deck_id)) ||
        (filter === "saved" && settings.favorites.includes(c.deck_id))),
  );
  function change(key: string, value: string) {
    setSelected([]);
    setLimit(30);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("card");
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  async function apply() {
    if (action === null || busy) return;
    setBusy(true);
    setError("");
    try {
      await db.transaction("rw", db.cards, db.outbox, async () => {
        for (const id of selected)
          await updateContent(id, { suspended: action });
      });
      setSelected([]);
      setAction(null);
    } catch {
      setError("The change was not saved. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <header className="page-heading">
        <div>
          <h1>Find cards</h1>
          <p>Search questions and answers across your library.</p>
        </div>
      </header>
      <div className="action-row">
        <label>
          Search cards
          <input
            type="search"
            value={query}
            onChange={(e) => change("q", e.target.value)}
          />
        </label>
        <label>
          Show
          <select
            value={filter}
            onChange={(e) => change("filter", e.target.value)}
          >
            {[
              ["all", "All cards"],
              ["difficult", "Repeated lapses (2+)"],
              ["suspended", "Suspended"],
              ["personal", "Personal decks"],
              ["saved", "Saved decks"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <span role="status">{rows.length} cards</span>
        {cardId && (
          <button onClick={() => change("card", "")}>Clear card link</button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {selected.length > 0 && (
        <div className="content-panel action-row">
          <span>{selected.length} selected</span>
          <button onClick={() => setAction(true)}>Preview suspension</button>
          <button onClick={() => setAction(false)}>Preview resume</button>
          <button onClick={() => setSelected([])}>Clear selection</button>
        </div>
      )}
      {rows.slice(0, limit).map((card) => (
        <section className="content-panel" key={card.id}>
          <div className="action-row">
            <label>
              <input
                type="checkbox"
                aria-label={"Select " + card.front.slice(0, 70)}
                checked={selected.includes(card.id)}
                onChange={(e) =>
                  setSelected((s) =>
                    e.target.checked
                      ? [...s, card.id]
                      : s.filter((id) => id !== card.id),
                  )
                }
              />{" "}
              Select
            </label>
            <Link to={"/decks/" + card.deck_id}>
              {data?.decks.find((d) => d.id === card.deck_id)?.name}
            </Link>
            <button
              aria-pressed={settings.favorites.includes(card.deck_id)}
              onClick={() =>
                void saveLearningSettings({
                  favorites: settings.favorites.includes(card.deck_id)
                    ? settings.favorites.filter((id) => id !== card.deck_id)
                    : [...settings.favorites, card.deck_id],
                }).catch(() => setError("Could not save this deck."))
              }
            >
              {settings.favorites.includes(card.deck_id)
                ? "Unsave deck"
                : "Save deck"}
            </button>
            <Link
              to={
                "/cards/" +
                card.id +
                "/edit?returnTo=" +
                encodeURIComponent("/library?card=" + card.id)
              }
            >
              Edit
            </Link>
          </div>
          <MarkdownView source={card.front} />
          <p>
            {card.state} · {card.lapses} lapses
            {card.suspended ? " · suspended" : ""}
          </p>
          <details>
            <summary>Read answer</summary>
            <AnswerExplorer front={card.front} back={card.back} />
          </details>
        </section>
      ))}
      {rows.length > limit && (
        <button onClick={() => setLimit((n) => n + 30)}>Show 30 more</button>
      )}
      {data && !rows.length && <p>No cards match these filters.</p>}
      {action !== null && (
        <ConfirmDialog
          title={action ? "Suspend selected cards?" : "Resume selected cards?"}
          confirmLabel={action ? "Suspend cards" : "Resume cards"}
          danger={false}
          busy={busy}
          onCancel={() => {
            if (!busy) setAction(null);
          }}
          onConfirm={() => void apply()}
        >
          <p>
            {selected.length} cards will{" "}
            {action ? "stop appearing" : "be eligible to appear"} in scheduled
            study. Their history stays intact. This can be reversed.
          </p>
          <ul>
            {rows
              .filter((c) => selected.includes(c.id))
              .slice(0, 8)
              .map((c) => (
                <li key={c.id}>{c.front.slice(0, 120)}</li>
              ))}
          </ul>
          {selected.length > 8 && (
            <p>And {selected.length - 8} more selected cards.</p>
          )}
          {error && <p role="alert">{error}</p>}
        </ConfirmDialog>
      )}
    </div>
  );
}
