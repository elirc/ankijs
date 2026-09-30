import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  configure,
  getConfig,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { effectProjects } from "../../data/effect-projects";
import { resetDatabaseForTests } from "../../db/schema";
import { exportData, importData } from "../../db/repos/dataRepo";
import {
  emptyPracticeEntry,
  listPracticeEntries,
  savePracticeEntry,
  waitForPracticeWrites,
} from "../../db/repos/practiceRepo";
import { EffectLabScreen, effectEvidenceMarkdown } from "./EffectLabScreen";
import * as library from "./effect-library";
import trackerPack from "../../data/effect-packs/project-tracker.json";
import type { EffectProject } from "../../data/effect-projects";

const project = effectProjects[0];
const milestone = project.milestones[0];
const path = `/effect-lab/${project.id}/${milestone.id}`;

function open(url = "/effect-lab") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/effect-lab/:projectId?/:milestoneId?"
          element={<EffectLabScreen />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Effect project learning section", () => {
  const originalTimeout = getConfig().asyncUtilTimeout;
  beforeAll(() => configure({ asyncUtilTimeout: 15_000 }));
  afterAll(() => configure({ asyncUtilTimeout: originalTimeout }));
  afterEach(() => vi.restoreAllMocks());
  beforeEach(async () => {
    // A previous UI test may still have queued writes if an assertion timed out.
    await waitForPracticeWrites();
    await resetDatabaseForTests();
  });

  it("filters standalone projects and concepts, and recovers from no matches", async () => {
    open();
    await screen.findByRole("heading", { name: "Effect & agentic CRUD" });
    fireEvent.change(screen.getByLabelText("Project type"), {
      target: { value: "Standalone app" },
    });
    expect(
      screen.getByRole("heading", { name: "Support-ticket app" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Project tracker" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search projects"), {
      target: { value: "atomic conditional" },
    });
    expect(
      await screen.findByRole("heading", { name: "Inventory & reservations" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Support-ticket app" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search projects"), {
      target: { value: "no-such-project" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(
      screen.getByRole("heading", { name: "Project tracker" }),
    ).toBeInTheDocument();
  });

  it("saves milestone evidence, gates completion, restores a backup, and navigates within the section", async () => {
    const view = open(path);
    const outcome = await screen.findByLabelText("What I changed");
    expect(
      screen.getByRole("button", { name: "Complete mission" }),
    ).toBeDisabled();
    fireEvent.change(outcome, {
      target: { value: "Created validated project writes. Commit abc123." },
    });
    fireEvent.change(screen.getByLabelText("How I verified it"), {
      target: {
        value: "Rejected blank input and recovered from a failed save.",
      },
    });
    fireEvent.change(screen.getByLabelText("Tradeoff and next step"), {
      target: { value: "Local storage first; add an API later." },
    });
    for (const check of milestone.checks)
      fireEvent.click(screen.getByLabelText(check.label));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Complete mission" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete mission" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reopen mission" }),
      ).toBeEnabled(),
    );
    const backup = await exportData();
    expect(backup.practice?.[0].completed).toBe(true);
    expect(await effectEvidenceMarkdown(backup.practice!)).toContain(
      "Commit abc123",
    );
    expect(
      screen.getByRole("link", { name: "Next activity" }),
    ).toHaveAttribute(
      "href",
      `/effect-lab/${project.id}/${project.milestones[1].id}`,
    );
    view.unmount();
    await resetDatabaseForTests();
    await importData(backup);
    open(path);
    expect(await screen.findByLabelText("What I changed")).toHaveValue(
      "Created validated project writes. Commit abc123.",
    );
    expect(screen.getByLabelText("What I changed")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reopen mission" }));
    await waitFor(() =>
      expect(screen.getByLabelText("What I changed")).toBeEnabled(),
    );
    await waitFor(async () =>
      expect((await listPracticeEntries())[0].completed).toBe(false),
    );
    fireEvent.click(screen.getByRole("link", { name: "Project tracker" }));
    expect(
      await screen.findByRole("heading", { name: "Project tracker", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue this project" }),
    ).toHaveAttribute("href", path);
  });

  it("rejects a completed Effect entry with missing acceptance checks at the persistence boundary", async () => {
    await expect(
      savePracticeEntry({
        ...emptyPracticeEntry(milestone.id),
        outcome: "Built",
        verification: "Tested",
        tradeoff: "Next",
        completed: true,
      }),
    ).rejects.toThrow(/evidence/);
    expect(await listPracticeEntries()).toEqual([]);
  });

  it("continues in-progress work ahead of an untouched project", async () => {
    const later = effectProjects[5];
    await savePracticeEntry({
      ...emptyPracticeEntry(later.milestones[1].id),
      outcome: "Started workflow",
    });
    open();
    expect(
      await screen.findByRole("link", { name: "Continue building" }),
    ).toHaveAttribute(
      "href",
      `/effect-lab/${later.id}/${later.milestones[1].id}`,
    );
  });

  it("does not mix milestones from different projects in deep links", async () => {
    open(`/effect-lab/${effectProjects[1].id}/${milestone.id}`);
    expect(
      await screen.findByRole("heading", {
        name: "Project or activity not found",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("What I changed")).not.toBeInTheDocument();
  });

  it("searches individual failure exercises and keeps filters in the route", async () => {
    open(
      "/effect-lab?view=milestones&q=poison%20payload&kind=Standalone%20app&stage=Own%20the%20outcome",
    );
    expect(
      await screen.findByRole("heading", {
        name: "Measure lag and recover from poison events",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "All activities" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Learning stage")).toHaveValue(
      "Own the outcome",
    );
    fireEvent.change(screen.getByLabelText("Activity progress"), {
      target: { value: "Completed" },
    });
    expect(
      screen.getByRole("heading", { name: "No activities match" }),
    ).toBeInTheDocument();
  });

  it("allows moving through lessons without marking unfinished work complete", async () => {
    open(path);
    const jump = await screen.findByLabelText("Jump to activity");
    fireEvent.change(jump, { target: { value: project.milestones[5].id } });
    expect(
      await screen.findByRole("heading", {
        name: project.milestones[5].title,
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Complete mission" }),
    ).toBeDisabled();
    expect(await listPracticeEntries()).toEqual([]);
    fireEvent.click(screen.getByRole("link", { name: "Previous" }));
    expect(
      await screen.findByRole("heading", {
        name: project.milestones[4].title,
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it("paginates drill search results instead of mounting the whole library", async () => {
    const view = open("/effect-lab?view=milestones&activity=Practice%20drills");
    await screen.findByRole("heading", { name: "Effect & agentic CRUD" });
    expect(
      view.container.querySelectorAll(".effect-milestone-card"),
    ).toHaveLength(24);
    const first = view.container.querySelector(
      ".effect-milestone-card",
    )!.textContent;
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      view.container.querySelectorAll(".effect-milestone-card"),
    ).toHaveLength(24);
    expect(
      view.container.querySelector(".effect-milestone-card")!.textContent,
    ).not.toBe(first);
    fireEvent.change(screen.getByLabelText("Project type"), {
      target: { value: "Standalone app" },
    });
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();
  });

  it("loads a drill directly and validates its generated completion checklist", async () => {
    const drill = (trackerPack as EffectProject).milestones.find(
      (item) => item.parentId,
    )!;
    open(`/effect-lab/project-tracker/${drill.id}`);
    const outcome = await screen.findByLabelText("What I changed");
    expect(
      screen.getByRole("link", { name: "Review the build milestone" }),
    ).toHaveAttribute("href", `/effect-lab/project-tracker/${drill.parentId}`);
    fireEvent.change(outcome, {
      target: { value: "Implemented the boundary fix; commit 123." },
    });
    fireEvent.change(screen.getByLabelText("How I verified it"), {
      target: { value: "Ran the fixture and checked durable state." },
    });
    fireEvent.change(screen.getByLabelText("Tradeoff and next step"), {
      target: {
        value: "Kept the adapter small; add concurrency coverage next.",
      },
    });
    for (const check of drill.checks)
      fireEvent.click(screen.getByLabelText(check.label));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Complete mission" }),
      ).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Complete mission" }));
    await screen.findByRole("button", { name: "Reopen mission" });
    await waitFor(async () =>
      expect(
        (await listPracticeEntries()).find(
          (entry) => entry.mission_id === drill.id,
        )?.completed,
      ).toBe(true),
    );
  });

  it("retries a failed project download without losing saved evidence", async () => {
    vi.spyOn(library, "loadEffectProject").mockRejectedValueOnce(
      new Error("offline"),
    );
    open(path);
    await screen.findByRole("heading", { name: "Could not load this project" });
    fireEvent.click(
      screen.getByRole("button", { name: "Retry project download" }),
    );
    await screen.findByLabelText("What I changed");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("can return to cached browsing when the search index cannot load", async () => {
    vi.spyOn(library, "loadEffectSearch").mockRejectedValueOnce(
      new Error("offline"),
    );
    open("/effect-lab?q=constraint");
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(
      await screen.findByRole("heading", { name: "Project tracker" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
