import originalCatalog from "./original-deck-catalog.json";
import expandedCatalog from "./expanded-catalog.json";
import workshopCatalog from "./workshop-deck-catalog.json";
import manifest from "./section-expansion-manifest.json";

export type Track =
  | "Start here"
  | "Keep going"
  | "Build real apps"
  | "C# & .NET"
  | "Foundations"
  | "Frontend"
  | "Backend"
  | "Practice"
  | "Workshop";
export interface StarterDeck {
  id: string;
  name: string;
  description: string;
  track: Track;
  icon:
    | "braces"
    | "tree"
    | "react"
    | "network"
    | "database"
    | "globe"
    | "bug"
    | "git";
  color: string;
  topics: string[];
  resource: { label: string; url: string };
  cards: [front: string, back: string][];
}

export type DeckInfo = Omit<StarterDeck, "cards"> & { cardCount: number };
const additions = new Map(
  manifest.sections.map((section) => [section.id, section.added]),
);
export const curriculum: DeckInfo[] = [
  ...[...originalCatalog, ...expandedCatalog].map((deck) => ({
    ...deck,
    cardCount: deck.cardCount + (additions.get(deck.id) ?? 0),
  })),
  ...workshopCatalog,
] as DeckInfo[];
const deckInfoById = new Map(curriculum.map((deck) => [deck.id, deck]));
export const getDeckInfo = (id: string) => deckInfoById.get(id);
export const starterCardCount = curriculum.reduce(
  (total, deck) => total + deck.cardCount,
  0,
);
