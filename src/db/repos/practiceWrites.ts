import type { PracticeEntry } from "./practiceRepo";

// The shell only needs to protect in-flight saves, not load mission catalogs.
export const pendingPracticeWrites = new Map<string, Promise<PracticeEntry>>();

export function hasPendingPracticeWrites(): boolean {
  return pendingPracticeWrites.size > 0;
}

export async function waitForPracticeWrites(): Promise<void> {
  await Promise.all([...pendingPracticeWrites.values()]);
}
