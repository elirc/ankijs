import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import * as cardRepository from "../../db/repos/cardRepo";
import * as studyRepository from "../../db/repos/studyRepo";
import { createCard } from "../../db/repos/cardRepo";
import { createDeck } from "../../db/repos/deckRepo";
import { db, resetDatabaseForTests } from "../../db/schema";
import { StudyScreen } from "./StudyScreen";
import { teachingMarker } from "../../teaching/answers";
import { curriculum } from "../../data/curriculum";

describe("StudyScreen", () => {
  beforeEach(async () => {
    await resetDatabaseForTests();
  });

  it.each(["saving the review", "refreshing the queue"])(
    "opens the next session immediately when navigating while %s",
    async (stage) => {
      const user = userEvent.setup();
      const first = await createDeck("First topic");
      const second = await createDeck("Second topic");
      const reviewedCard = await createCard({
        deck_id: first.id,
        front: "First question",
        back: "First answer",
      });
      await createCard({
        deck_id: second.id,
        front: "Second question",
        back: "Second answer",
      });
      render(
        <MemoryRouter initialEntries={[`/study/${first.id}?minutes=5`]}>
          <Link to={`/study/${second.id}?minutes=2`}>Switch topic</Link>
          <Routes>
            <Route path="/study/:deckId" element={<StudyScreen />} />
          </Routes>
        </MemoryRouter>,
      );
      await user.click(
        await screen.findByRole("button", { name: "Show answer" }),
      );
      let release!: () => void;
      let waiting = false;
      const paused = new Promise<void>((resolve) => {
        release = resolve;
      });
      if (stage === "saving the review") {
        const save = cardRepository.applyReview;
        vi.spyOn(cardRepository, "applyReview").mockImplementationOnce(
          async (...args) => {
            waiting = true;
            await paused;
            return save(...args);
          },
        );
      } else {
        const read = studyRepository.loadStudy;
        vi.spyOn(studyRepository, "loadStudy").mockImplementationOnce(
          async (...args) => {
            waiting = true;
            await paused;
            return read(...args);
          },
        );
      }
      await user.click(screen.getByRole("button", { name: /Easy/ }));
      await waitFor(() => expect(waiting).toBe(true));
      await user.click(screen.getByRole("link", { name: "Switch topic" }));
      await act(async () => {
        release();
      });
      expect(
        await screen.findByText("Second question", {}, { timeout: 5000 }),
      ).toBeVisible();
      expect(screen.getByText("2-minute session · 0 reviewed")).toBeVisible();
      expect(screen.queryByText("First question")).not.toBeInTheDocument();
      expect(
        (await db.review_logs.toArray()).map((log) => log.card_id),
      ).toEqual([reviewedCard.id]);
    },
  );

  it("ignores a background queue read that began before the current review was saved", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Background refresh");
    const first = await createCard({
      deck_id: deck.id,
      front: "First question",
      back: "First answer",
    });
    await db.cards.update(first.id, { created_at: "2020-01-01T00:00:00.000Z" });
    await createCard({
      deck_id: deck.id,
      front: "Second question",
      back: "Second answer",
    });
    render(
      <MemoryRouter>
        <StudyScreen />
      </MemoryRouter>,
    );
    await screen.findByText("First question");
    let release!: () => void;
    let captured = false;
    const paused = new Promise<void>((resolve) => {
      release = resolve;
    });
    const read = studyRepository.loadStudy;
    let background: ReturnType<typeof read> | undefined;
    vi.spyOn(studyRepository, "loadStudy").mockImplementationOnce((...args) => {
      background = (async () => {
        const snapshot = await read(...args);
        captured = true;
        await paused;
        return snapshot;
      })();
      return background;
    });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(captured).toBe(true));
    await user.click(screen.getByRole("button", { name: "Show answer" }));
    await user.click(screen.getByRole("button", { name: /Easy/ }));
    await screen.findByText("Second question");
    await act(async () => {
      release();
      await background;
    });
    expect(screen.getByText("Second question")).toBeVisible();
    expect(screen.queryByText("First question")).not.toBeInTheDocument();
    expect(await db.review_logs.count()).toBe(1);
  });

  it("explores explanations without recording a review, and resets after undo", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Beginner practice");
    const card = await createCard({
      deck_id: deck.id,
      front: "Explain this idea",
      back: `${teachingMarker}\n\n## Plain English\n\nThe basic idea.\n\n## An example\n\nA concrete example.`,
    });
    render(
      <MemoryRouter>
        <StudyScreen />
      </MemoryRouter>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Show answer" }),
    );
    await user.click(screen.getByRole("button", { name: "Next explanation" }));
    expect(screen.getByText("A concrete example.")).toBeInTheDocument();
    expect(await db.review_logs.count()).toBe(0);
    expect((await db.cards.get(card.id))?.reps).toBe(0);
    await user.click(screen.getByRole("button", { name: /Easy/ }));
    await screen.findByRole(
      "heading",
      { name: "Session complete" },
      { timeout: 5000 },
    );
    expect(await db.review_logs.count()).toBe(1);
    await user.click(screen.getByRole("button", { name: "Undo last review" }));
    await user.click(
      await screen.findByRole("button", { name: "Show answer" }),
    );
    expect(screen.getByText("The basic idea.")).toBeInTheDocument();
    expect(screen.getByLabelText("Explanation style")).toHaveValue("0");
    expect(await db.review_logs.count()).toBe(0);
  });

  it("reveals and rates a card", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Core");
    await createCard({ deck_id: deck.id, front: "Question", back: "Answer" });
    render(
      <MemoryRouter initialEntries={["/study"]}>
        <Routes>
          <Route path="/study" element={<StudyScreen />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Question")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show answer" }));
    // The explorer header is also labelled "Answer", so match the rendered body.
    expect(
      await screen.findByText("Answer", { selector: "p" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Good/ }));
    await screen.findByRole(
      "heading",
      { name: "Session complete" },
      { timeout: 5000 },
    );
    await waitFor(async () => expect(await db.review_logs.count()).toBe(1));
  });

  it("does not review learning cards before they are due and can undo the last card", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Core");
    await createCard({
      deck_id: deck.id,
      front: "Only question",
      back: "Only answer",
    });
    render(
      <MemoryRouter>
        <StudyScreen />
      </MemoryRouter>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Show answer" }),
    );
    await user.click(screen.getByRole("button", { name: /Again/ }));
    expect(
      await screen.findByRole("heading", { name: "Session complete" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Only question")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo last review" }));
    expect(await screen.findByText("Only question")).toBeInTheDocument();
    expect(await db.review_logs.count()).toBe(0);
  });

  it("ignores repeated rating clicks while a save is in flight", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Core");
    await createCard({ deck_id: deck.id, front: "Question", back: "Answer" });
    render(
      <MemoryRouter>
        <StudyScreen />
      </MemoryRouter>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Show answer" }),
    );
    await user.dblClick(screen.getByRole("button", { name: /Easy/ }));
    await screen.findByRole(
      "heading",
      { name: "Session complete" },
      { timeout: 5000 },
    );
    await waitFor(async () => expect(await db.review_logs.count()).toBe(1));
    expect((await db.cards.toArray())[0].reps).toBe(1);
  });

  it("keeps the revealed card in front when a background refresh finds a newly due card", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      const user = userEvent.setup();
      const deck = await createDeck("Background refresh");
      const shown = await createCard({
        deck_id: deck.id,
        front: "First question",
        back: "First answer",
      });
      await db.cards.update(shown.id, {
        created_at: "2020-01-01T00:00:00.000Z",
      });
      const later = await createCard({
        deck_id: deck.id,
        front: "Second question",
        back: "Second answer",
      });
      // Not yet due: a review card scheduled for the future stays out of the queue.
      await db.cards.update(later.id, {
        state: "review",
        reps: 1,
        stability: 5,
        due: new Date(Date.now() + 3_600_000).toISOString(),
      });
      render(
        <MemoryRouter>
          <StudyScreen />
        </MemoryRouter>,
      );
      await screen.findByText("First question");
      expect(screen.getByText("1 left")).toBeVisible();
      await user.click(screen.getByRole("button", { name: "Show answer" }));
      expect(
        await screen.findByText("First answer", { selector: "p" }),
      ).toBeVisible();

      // The second card becomes due; due reviews normally sort ahead of new cards.
      await db.cards.update(later.id, {
        due: new Date(Date.now() - 1_000).toISOString(),
      });
      const read = studyRepository.loadStudy;
      let background: ReturnType<typeof read> | undefined;
      vi.spyOn(studyRepository, "loadStudy").mockImplementationOnce(
        (...args) => {
          background = read(...args);
          return background;
        },
      );
      await act(async () => {
        vi.advanceTimersByTime(30_000);
      });
      await act(async () => {
        await background;
      });
      expect(background).toBeDefined();
      expect(await screen.findByText("2 left")).toBeVisible();
      expect(screen.getByText("First question")).toBeVisible();
      expect(screen.getByText("First answer", { selector: "p" })).toBeVisible();
      expect(screen.queryByText("Second question")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Easy/ }));
      expect(await screen.findByText("Second question")).toBeVisible();
      expect(
        (await db.review_logs.toArray()).map((log) => log.card_id),
      ).toEqual([shown.id]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not count time spent in another app toward the session limit", async () => {
    const user = userEvent.setup();
    let clock = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => clock);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");
    const deck = await createDeck("Timed");
    const first = await createCard({
      deck_id: deck.id,
      front: "First question",
      back: "First answer",
    });
    await db.cards.update(first.id, { created_at: "2020-01-01T00:00:00.000Z" });
    await createCard({
      deck_id: deck.id,
      front: "Second question",
      back: "Second answer",
    });
    render(
      <MemoryRouter initialEntries={["/study?minutes=2"]}>
        <Routes>
          <Route path="/study" element={<StudyScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByText("First question");

    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    clock += 10 * 60_000;
    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));
    expect(await screen.findByText("2:00")).toBeVisible();
    expect(screen.queryByText(/Time well spent/)).not.toBeInTheDocument();

    clock += 30_000;
    fireEvent(document, new Event("visibilitychange"));
    expect(await screen.findByText("1:30")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show answer" }));
    await user.click(screen.getByRole("button", { name: /Easy/ }));
    expect(await screen.findByText("Second question")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Session complete" }),
    ).not.toBeInTheDocument();
  });

  it("limits a ?track= session to that curriculum track", async () => {
    const startHere = curriculum.find((info) => info.track === "Start here")!;
    const frontend = curriculum.find((info) => info.track === "Frontend")!;
    const timestamp = new Date().toISOString();
    for (const info of [startHere, frontend])
      await db.decks.add({
        id: info.id,
        user_id: null,
        name: info.name,
        new_per_day: 10,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      });
    await createCard({
      deck_id: startHere.id,
      front: "Start here question",
      back: "Start answer",
    });
    await createCard({
      deck_id: frontend.id,
      front: "Frontend question",
      back: "Frontend answer",
    });
    render(
      <MemoryRouter
        initialEntries={[`/study?track=${encodeURIComponent("Start here")}`]}
      >
        <Routes>
          <Route path="/study" element={<StudyScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("heading", { name: "Start here study" }),
    ).toBeVisible();
    expect(screen.getByText("Start here question")).toBeVisible();
    expect(screen.getByText("1 left")).toBeVisible();
    expect(screen.queryByText("Frontend question")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toBeVisible();
  });

  it("reveals and rates with keyboard shortcuts", async () => {
    const user = userEvent.setup();
    const deck = await createDeck("Keys");
    await createCard({
      deck_id: deck.id,
      front: "Key question",
      back: "Key answer",
    });
    render(
      <MemoryRouter>
        <StudyScreen />
      </MemoryRouter>,
    );
    await screen.findByText("Key question");
    await user.keyboard(" ");
    expect(
      await screen.findByText("Key answer", { selector: "p" }),
    ).toBeVisible();
    await user.keyboard("3");
    await screen.findByRole(
      "heading",
      { name: "Session complete" },
      { timeout: 5000 },
    );
    expect(await db.review_logs.count()).toBe(1);
  });
});
