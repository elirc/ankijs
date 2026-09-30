import { describe, expect, it } from "vitest";
import { curriculum, loadStarterCards } from "./curriculum";
import lessons from "./applied-lessons.json";
import appliedDecks from "./applied-decks.json";
import report from "./content-report.json";
import { parseAnswerPages } from "../teaching/answers";

describe("Build real apps curriculum", () => {
  it("ships ten ordered decks of ten lessons, each with a concept and a practice card", async () => {
    expect(lessons).toHaveLength(100);
    expect(lessons.length).toBe(report.appliedLessons);
    expect(new Set(lessons.map((lesson) => lesson.key)).size).toBe(100);
    const decks = curriculum.filter((deck) => deck.track === "Build real apps");
    expect(decks).toHaveLength(10);
    expect(decks.map((deck) => deck.id)).toEqual(
      appliedDecks.map((deck) => deck.id),
    );
    decks.forEach((deck, index) => {
      expect(deck.name.startsWith(`${21 + index} · `)).toBe(true);
      expect(deck.id).toBe(
        `a0000000-0000-4000-8000-${String(7001 + index).padStart(12, "0")}`,
      );
    });
    const packs = await loadStarterCards();
    const cards = decks.flatMap((deck) =>
      packs.get(deck.id)!.filter((card) => !/^a[1234]000000-/.test(card.id)),
    );
    expect(cards).toHaveLength(report.appliedCards);
    expect(cards).toHaveLength(200);
    for (const deck of decks) {
      expect(
        packs.get(deck.id)!.filter((card) => !/^a[1234]000000-/.test(card.id)),
      ).toHaveLength(20);
      expect(
        packs.get(deck.id)!.filter((card) => card.id.startsWith("a2000000-")),
      ).toHaveLength(6);
    }
    for (const lesson of lessons) {
      const deck = decks[lesson.deck - 7001];
      expect(deck, lesson.key).toBeDefined();
      expect(lesson.check).not.toMatch(
        /\b(?:code|function|example) (?:above|below)\b/i,
      );
      for (const field of [
        lesson.plain,
        lesson.example,
        lesson.analogy,
        lesson.mistake,
        lesson.answer,
      ]) {
        expect(field.length, lesson.key).toBeGreaterThan(60);
        expect(field).not.toMatch(/TODO|lorem ipsum|Write an example/);
      }
      const own = packs.get(deck.id)!;
      const concept = own.find((card) => card.front === lesson.question)!;
      const practice = own.find((card) => card.front === lesson.check)!;
      expect(concept, lesson.key).toBeDefined();
      expect(practice, lesson.key).toBeDefined();
      expect(concept.id).toMatch(/^e0000000-.*0$/);
      expect(practice.id).toMatch(/^e0000000-.*1$/);
      expect(concept.id.slice(0, -1)).toBe(practice.id.slice(0, -1));
      for (const card of [concept, practice]) {
        const pages = parseAnswerPages(card.back)!;
        expect(pages, lesson.key).toHaveLength(5);
        expect(pages[1].body).toBe(lesson.example);
        expect(pages[2].body).toBe(lesson.analogy);
        expect(pages[3].body).toBe(lesson.mistake);
        expect(pages[4].body).toContain("<!-- recall:solution -->");
      }
      expect(parseAnswerPages(concept.back)![0].body).toBe(lesson.plain);
      expect(parseAnswerPages(practice.back)![0].body).toContain(lesson.answer);
    }
  });
});
