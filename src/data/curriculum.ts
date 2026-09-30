import { originalCurriculum } from "./original-curriculum";
import { workshopUnits } from "./workshop";
import { loadSectionExpansion } from "./section-expansion";

// Compatibility exports for curriculum audits; screens use the small catalog directly.
export { originalCurriculum } from "./original-curriculum";
export {
  curriculum,
  getDeckInfo,
  starterCardCount,
} from "./curriculum-catalog";
export type { Track, StarterDeck, DeckInfo } from "./curriculum-catalog";

export interface StarterCard {
  id: string;
  front: string;
  back: string;
}
export async function loadStarterCards(): Promise<Map<string, StarterCard[]>> {
  // Keep the expanded content out of the application shell; load it only for installation.
  const [{ default: expanded }, expansion] = await Promise.all([
    import("./expanded-cards.json"),
    loadSectionExpansion(),
  ]);
  const entries: [string, StarterCard[]][] = originalCurriculum.map((deck) => [
    deck.id,
    deck.cards.map(([front, back], index) => ({
      id: `b0000000-0000-4000-8000-${String(Number(deck.id.slice(-12)) * 1000 + index + 1).padStart(12, "0")}`,
      front,
      back,
    })),
  ]);
  const content = new Map([
    ...entries,
    ...expanded.map((deck) => [deck.id, deck.cards] as [string, StarterCard[]]),
  ]);
  for (const pack of expansion)
    content.set(pack.id, [...(content.get(pack.id) ?? []), ...pack.cards]);
  for (const unit of workshopUnits) {
    const credit =
      "\n\nFurther reading: " +
      unit.sources.map((url) => `[Official reference](${url})`).join(" · ");
    content.set(unit.deckId, [
      ...(content.get(unit.deckId) ?? []),
      { id: unit.cardIds[0], front: unit.question, back: unit.answer + credit },
      {
        id: unit.cardIds[1],
        front:
          unit.evidence +
          "\n\nWhat would you change, and how would you verify it?",
        back:
          unit.solution +
          "\n\n" +
          unit.rubric.map((x) => "- " + x).join("\n") +
          credit,
      },
    ]);
  }
  return content;
}
