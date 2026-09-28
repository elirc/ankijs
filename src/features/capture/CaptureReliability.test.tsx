import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { resetDatabaseForTests } from "../../db/schema";
import * as notes from "../../db/repos/noteRepo";
import { CaptureScreen } from "./CaptureScreen";
beforeEach(async () => {
  await resetDatabaseForTests();
  localStorage.clear();
});
it("blocks duplicate submissions and preserves later typing", async () => {
  let resolve!: (value: Awaited<ReturnType<typeof notes.captureNote>>) => void;
  const save = vi
    .spyOn(notes, "captureNote")
    .mockImplementation(() => new Promise((r) => (resolve = r)));
  render(
    <MemoryRouter>
      <CaptureScreen />
    </MemoryRouter>,
  );
  const input = screen.getByLabelText("Capture note");
  fireEvent.change(input, { target: { value: "first" } });
  fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
  fireEvent.keyDown(input, { key: "Enter", ctrlKey: true });
  expect(save).toHaveBeenCalledTimes(1);
  fireEvent.change(input, { target: { value: "newer draft" } });
  resolve({} as Awaited<ReturnType<typeof notes.captureNote>>);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled(),
  );
  expect(input).toHaveValue("newer draft");
});
it("retains a failed save and offers a retry", async () => {
  vi.spyOn(notes, "captureNote").mockRejectedValue(new Error("quota"));
  render(
    <MemoryRouter>
      <CaptureScreen />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Capture note"), {
    target: { value: "keep me" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("alert");
  expect(screen.getByLabelText("Capture note")).toHaveValue("keep me");
  expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
});
