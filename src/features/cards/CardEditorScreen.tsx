import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Save } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { MarkdownView } from "../../components/MarkdownView";
import { AnswerExplorer } from "../../components/AnswerExplorer";
import { addExplanation } from "../../teaching/answers";
import { TextArea } from "../../components/TextArea";
import { createCard, getCard, updateContent } from "../../db/repos/cardRepo";
import { listDecks } from "../../db/repos/deckRepo";

import { readDraft, storeDraft } from "../../lib/drafts";

type MobileMode = "edit" | "preview";

export function CardEditorScreen() {
  const { cardId } = useParams();
  const [params] = useSearchParams();
  return <CardEditor key={cardId ?? params.get("deckId") ?? "new"} />;
}

function CardEditor() {
  const { cardId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const decks = useLiveQuery(listDecks, [], []);
  const card = useLiveQuery(
    () =>
      cardId
        ? getCard(cardId).then((value) => value ?? null)
        : Promise.resolve(null),
    [cardId],
  );
  const [deckId, setDeckId] = useState(searchParams.get("deckId") ?? "");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [mode, setMode] = useState<MobileMode>("edit");
  const returnTo = searchParams.get("returnTo");
  const editing = Boolean(cardId);
  const draftKey = "card:" + (cardId ?? searchParams.get("deckId") ?? "new");
  const initialized = useRef("");
  const [draftReady, setDraftReady] = useState(false);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialized.current === draftKey || (editing && card === undefined))
      return;
    initialized.current = draftKey;
    let draft: { front?: string; back?: string; deckId?: string } = {};
    try {
      const stored: unknown = JSON.parse(readDraft(draftKey) || "{}");
      if (stored && typeof stored === "object") {
        const values = stored as Record<string, unknown>;
        draft = {
          front: typeof values.front === "string" ? values.front : undefined,
          back: typeof values.back === "string" ? values.back : undefined,
          deckId: typeof values.deckId === "string" ? values.deckId : undefined,
        };
      }
    } catch {
      /* ignore a damaged draft */
    }
    setDeckId(
      draft.deckId ?? card?.deck_id ?? searchParams.get("deckId") ?? "",
    );
    setFront(draft.front ?? card?.front ?? "");
    setBack(draft.back ?? card?.back ?? "");
    setDraftReady(true);
  }, [card, draftKey, editing, searchParams]);
  useEffect(() => {
    if (draftReady)
      storeDraft(
        draftKey,
        front || back ? JSON.stringify({ front, back, deckId }) : "",
      );
  }, [draftKey, front, back, deckId, draftReady]);

  useEffect(() => {
    if (!editing && decks.length > 0 && !deckId) {
      setDeckId(decks[0].id);
    }
  }, [deckId, decks, editing]);

  async function save(addAnother = false) {
    if (!deckId || !front.trim() || !back.trim() || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      if (editing && cardId) {
        await updateContent(cardId, {
          deck_id: deckId,
          front: front.trim(),
          back: back.trim(),
        });
        storeDraft(draftKey, "");
        navigate(returnTo ?? `/decks/${deckId}`);
        return;
      }
      await createCard({
        deck_id: deckId,
        front,
        back,
        note_id: searchParams.get("noteId") ?? undefined,
      });
      storeDraft(draftKey, "");
      if (addAnother) {
        setFront("");
        setBack("");
        setMode("edit");
        return;
      }
      navigate(`/decks/${deckId}`);
    } catch {
      setError(
        "Could not save this card. Your draft is still here; please try again.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  if (decks.length === 0)
    return <EmptyState title="Create a deck before adding cards." />;
  if (editing && card === undefined)
    return <p className="text-muted">Loading</p>;
  if (editing && card === null)
    return <EmptyState title="This card could not be found." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {editing ? "Edit card" : "New card"}
        </h1>
        <p className="text-muted">
          One clear question. Explain it in more than one way, with examples and
          Markdown.
        </p>
      </div>

      <label className="block text-sm font-medium">
        Deck
        <select
          className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-3 shadow-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          value={deckId}
          onChange={(event) => setDeckId(event.target.value)}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>

      <div className="inline-grid grid-cols-2 rounded-xl border border-line bg-surface p-1 shadow-sm lg:hidden">
        <button
          type="button"
          className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === "edit" ? "bg-primary text-white" : "text-muted"}`}
          onClick={() => setMode("edit")}
        >
          Edit
        </button>
        <button
          type="button"
          className={`min-h-10 rounded-lg px-4 text-sm font-semibold ${mode === "preview" ? "bg-primary text-white" : "text-muted"}`}
          onClick={() => setMode("preview")}
        >
          Preview
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={mode === "preview" ? "hidden lg:block" : "space-y-4"}>
          <label className="block text-sm font-medium">
            Front
            <TextArea
              className="mt-1 min-h-44"
              value={front}
              onChange={(event) => setFront(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter")
                  void save();
              }}
            />
          </label>
          <label className="block text-sm font-medium">
            Back
            <TextArea
              className="mt-1 min-h-44"
              value={back}
              onChange={(event) => setBack(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "Enter")
                  void save();
              }}
            />
          </label>
          <Button icon={Plus} onClick={() => setBack(addExplanation(back))}>
            Add another explanation
          </Button>
          <p className="text-sm text-muted">
            Each level-two heading in a multi-explanation answer becomes a page.
            Preview it to try the Next explanation button.
          </p>
        </div>
        <div
          className={mode === "edit" ? "hidden lg:grid lg:gap-4" : "grid gap-4"}
        >
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-muted">
              Front preview
            </p>
            <MarkdownView source={front} />
          </section>
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-muted">
              Back preview
            </p>
            <AnswerExplorer front={front} back={back} />
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={Save}
          disabled={saving || !deckId || !front.trim() || !back.trim()}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        {!editing ? (
          <Button
            disabled={saving || !deckId || !front.trim() || !back.trim()}
            onClick={() => void save(true)}
          >
            Save and add another
          </Button>
        ) : null}
      </div>
      {error && (
        <p role="alert" className="text-again">
          {error}
        </p>
      )}
    </div>
  );
}
