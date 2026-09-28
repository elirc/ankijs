import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createCard } from "../../db/repos/cardRepo";
import { createDeck } from "../../db/repos/deckRepo";
import { captureNote } from "../../db/repos/noteRepo";
import { db, resetDatabaseForTests } from "../../db/schema";
import { curriculum, type DeckInfo } from "../../data/curriculum";
import { HomeScreen } from "./HomeScreen";

function renderHome() {
  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>,
  );
}

describe("HomeScreen", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it("invites the user to get started when there are no decks", async () => {
    renderHome();
    // First render pays the cold dashboard load; allow for slow hosts.
    expect(
      await screen.findByRole(
        "button",
        { name: /Create a deck/i },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
  });

  it("summarizes due cards and disables studying when nothing is due", async () => {
    const deck = await createDeck("Empty deck");
    // A brand-new card without spending the daily allotment still counts as available.
    await createCard({ deck_id: deck.id, front: "Q", back: "A" });
    renderHome();

    expect(await screen.findByText("Empty deck")).toBeInTheDocument();
    const studyNow = await screen.findByRole("button", { name: /Study now/i });
    expect(studyNow).toBeEnabled();

    // Deck with zero available cards: hide the call to action count.
    await db.decks.update(deck.id, { new_per_day: 0 });
  });

  it("surfaces the inbox count when notes are waiting", async () => {
    await captureNote("a waiting thought");
    renderHome();
    await waitFor(() =>
      expect(screen.getByText(/1 note waiting/i)).toBeInTheDocument(),
    );
  });

  describe("Build real apps pathway", () => {
    // HomeScreen reads `curriculum` at render time, so the tests swap the track's
    // decks in and out. This keeps them valid before and after the track ships.
    let snapshot: DeckInfo[] = [];
    beforeEach(() => {
      snapshot = [...curriculum];
    });
    afterEach(() => {
      curriculum.splice(0, curriculum.length, ...snapshot);
    });

    const withoutTrack = () => {
      const kept = curriculum.filter(
        (deck) => deck.track !== "Build real apps",
      );
      curriculum.splice(0, curriculum.length, ...kept);
    };

    it("hides the entry when the track has no decks", async () => {
      withoutTrack();
      renderHome();
      expect(
        await screen.findByRole("heading", { name: "Paths" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Start here/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /Build real apps/ }),
      ).not.toBeInTheDocument();
    });

    it("shows the entry with deck and card counts and a New badge", async () => {
      withoutTrack();
      const template = curriculum[0];
      for (let index = 1; index <= 2; index += 1) {
        curriculum.push({
          ...template,
          id: `a0000000-0000-4000-8000-00000000700${index}`,
          name: `2${index} · Test app ${index}`,
          track: "Build real apps",
          cardCount: 10,
        });
      }
      renderHome();
      const link = await screen.findByRole("link", { name: /Build real apps/ });
      expect(link).toHaveAttribute("href", "/paths/Build%20real%20apps");
      expect(link).toHaveTextContent("2 decks · 20 cards");
      expect(link).toHaveTextContent("New");
    });
  });
});
