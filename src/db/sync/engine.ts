import {
  db,
  type Card,
  type Deck,
  type Note,
  type ReviewLog,
  type SyncTableName,
  type UserState,
} from "../schema";
import {
  mergeCard,
  mergeDeck,
  mergeNote,
  mergeReviewLog,
  type RemoteRow,
} from "./merge";
import { removeOutboxIfUnchanged } from "./outbox";
import { getSession, getSupabaseClient } from "./supabaseClient";
import { nowISO } from "../../lib/dates";
import { retireLegacyCurriculum } from "../retiredCurriculum";
import { assertOwnership } from "./ownership";
import { mergeUserState, saveUserState } from "../repos/userStateRepo";

export type SyncPhase = "idle" | "pushing" | "pulling" | "error";

export interface SyncState {
  phase: SyncPhase;
  message: string | null;
}

let syncState: SyncState = { phase: "idle", message: null };
const listeners = new Set<() => void>();
let running: Promise<void> | null = null;
let debounceTimer: number | undefined;
let retryTimer: number | undefined;
let backoffMs = 5_000;

const pullOrder: SyncTableName[] = [
  "decks",
  "notes",
  "cards",
  "review_logs",
  "user_state",
];

export function getSyncState(): SyncState {
  return syncState;
}

export function subscribeSyncState(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setSyncState(phase: SyncPhase, message: string | null = null) {
  if (syncState.phase === phase && syncState.message === message) return;
  syncState = { phase, message };
  for (const listener of listeners) listener();
}

export function scheduleSync(delayMs = 2_000): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void syncNow();
  }, delayMs);
}

export function setupSyncTriggers(): void {
  void syncNow();
  window.addEventListener("online", () => scheduleSync(0));
  window.addEventListener("recall:outbox-enqueued", () => scheduleSync());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleSync(0);
  });
  window.setInterval(() => scheduleSync(0), 60_000);
}

export async function syncNow(): Promise<void> {
  if (running) return running;
  running = syncLoop().finally(() => {
    running = null;
  });
  return running;
}

async function syncLoop(): Promise<void> {
  window.clearTimeout(retryTimer);
  const client = getSupabaseClient();
  const session = await getSession();
  if (!client || !session || !navigator.onLine) {
    setSyncState("idle");
    return;
  }
  try {
    await assertOwnership(session.user.id);
    await queueExistingLearningState(session.user.id);
    window.clearTimeout(retryTimer);
    setSyncState("pushing");
    await pushOutbox(session.user.id);
    setSyncState("pulling");
    await pullRemote(session.user.id);
    // An older device can still send the former bundled curriculum.
    if (await retireLegacyCurriculum()) await pushOutbox(session.user.id);
    await db.sync_meta.put({ key: "last_sync_ok_at", value: nowISO() });
    await db.sync_meta.delete("last_error");
    backoffMs = 5_000;
    setSyncState("idle");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.sync_meta.put({ key: "last_error", value: message });
    setSyncState("error", message);
    retryTimer = window.setTimeout(() => {
      void syncNow();
    }, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 300_000);
  }
}

async function rowsFor(tableName: SyncTableName, ids: string[]) {
  switch (tableName) {
    case "user_state":
      return (await db.user_state.bulkGet(ids)).filter(Boolean) as UserState[];
    case "decks":
      return (await db.decks.bulkGet(ids)).filter(Boolean) as Deck[];
    case "notes":
      return (await db.notes.bulkGet(ids)).filter(Boolean) as Note[];
    case "cards":
      return (await db.cards.bulkGet(ids)).filter(Boolean) as Card[];
    case "review_logs":
      return (await db.review_logs.bulkGet(ids)).filter(Boolean) as ReviewLog[];
  }
}

async function pushOutbox(uid: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const entries = await db.outbox.toArray();
  for (const tableName of pullOrder) {
    await assertSyncSession(uid);
    const group = entries.filter((entry) => entry.table_name === tableName);
    if (group.length === 0) continue;
    const rows = (
      await rowsFor(
        tableName,
        group.map((entry) => entry.row_id),
      )
    ).map((row) => ({ ...row, user_id: uid }));
    if (rows.length === 0) {
      await removeOutboxIfUnchanged(group);
      continue;
    }
    if (tableName === "review_logs") {
      const { error } = await client
        .from(tableName)
        .upsert(rows, { onConflict: "user_id,id", ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const rpcName =
        tableName === "user_state"
          ? "upsert_user_state"
          : tableName === "decks"
            ? "upsert_deck"
            : tableName === "notes"
              ? "upsert_note"
              : "upsert_card";
      const argName =
        tableName === "user_state"
          ? "s"
          : tableName === "decks"
            ? "d"
            : tableName === "notes"
              ? "n"
              : "c";
      for (let index = 0; index < rows.length; index += 50) {
        await assertSyncSession(uid);
        const chunk = rows.slice(index, index + 50);
        const results = await Promise.all(
          chunk.map((row) => client.rpc(rpcName, { [argName]: row })),
        );
        const error = results.find((result) => result.error)?.error;
        if (error) throw error;
      }
    }
    await removeOutboxIfUnchanged(group);
  }
}

export const pullPageSize = 500;

// Keyset pagination over (server_updated_at, id). A batched upsert stamps every row
// with the same server_updated_at, so paging on the timestamp alone skips rows that
// share the boundary value beyond one page. The id tie-breaker makes the cursor exact.
async function pullRemote(uid: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  for (const tableName of pullOrder) {
    let cursor =
      (await db.sync_meta.get(`cursor:${uid}:${tableName}`))?.value ??
      "1970-01-01T00:00:00.000Z";
    let cursorId =
      (await db.sync_meta.get(`cursor_id:${uid}:${tableName}`))?.value ?? "";
    let keepGoing = true;
    while (keepGoing) {
      await assertSyncSession(uid);
      const query = client.from(tableName).select("*").eq("user_id", uid);
      const { data, error } = await (
        cursorId
          ? query.or(
              `server_updated_at.gt.${cursor},and(server_updated_at.eq.${cursor},id.gt.${cursorId})`,
            )
          : query.gt("server_updated_at", cursor)
      )
        .order("server_updated_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(pullPageSize);
      if (error) throw error;
      const rows = (data ?? []) as RemoteRow<
        Deck | Note | Card | ReviewLog | UserState
      >[];
      await assertSyncSession(uid);
      if (rows.some((row) => row.user_id !== uid))
        throw new Error("Remote ownership mismatch");
      await mergeRows(tableName, rows);
      const last = rows.at(-1);
      if (last?.server_updated_at) {
        cursor = last.server_updated_at;
        cursorId = last.id;
        await db.sync_meta.bulkPut([
          { key: `cursor:${uid}:${tableName}`, value: cursor },
          { key: `cursor_id:${uid}:${tableName}`, value: cursorId },
        ]);
      }
      keepGoing = rows.length === pullPageSize;
    }
  }
}

async function mergeRows(
  tableName: SyncTableName,
  rows: RemoteRow<Deck | Note | Card | ReviewLog | UserState>[],
): Promise<void> {
  if (rows.length === 0) return;
  await db.transaction(
    "rw",
    [db.decks, db.notes, db.cards, db.review_logs, db.sync_meta, db.user_state],
    async () => {
      for (const row of rows) {
        switch (tableName) {
          case "user_state": {
            await mergeUserState(row as UserState);
            break;
          }
          case "decks": {
            const remote = row as RemoteRow<Deck>;
            await db.decks.put(
              mergeDeck(await db.decks.get(remote.id), remote),
            );
            break;
          }
          case "notes": {
            const remote = row as RemoteRow<Note>;
            await db.notes.put(
              mergeNote(await db.notes.get(remote.id), remote),
            );
            break;
          }
          case "cards": {
            const remote = row as RemoteRow<Card>;
            const deck = await db.decks.get(remote.deck_id);
            if (!deck) break;
            await db.cards.put(
              mergeCard(await db.cards.get(remote.id), remote),
            );
            break;
          }
          case "review_logs": {
            const remote = row as RemoteRow<ReviewLog>;
            if (!(await db.user_state.get("review_revoked:" + remote.id)))
              await db.review_logs.put(
                mergeReviewLog(await db.review_logs.get(remote.id), remote),
              );
            break;
          }
        }
      }
    },
  );
}

async function assertSyncSession(uid: string) {
  if ((await getSession())?.user.id !== uid)
    throw new Error("Account changed during sync. Please retry.");
  if ((await db.sync_meta.get("local_owner"))?.value !== uid)
    throw new Error("Local account ownership changed. No data was synced.");
}

async function queueExistingLearningState(uid: string) {
  const key = "extended_sync_ready:" + uid;
  if (await db.sync_meta.get(key)) return;
  await db.transaction(
    "rw",
    db.sync_meta,
    db.user_state,
    db.outbox,
    async () => {
      const rows = await db.sync_meta.toArray();
      for (const row of rows.filter(
        (item) =>
          item.key.startsWith("engineering_practice:") ||
          item.key === "learning_settings",
      )) {
        if (!(await db.user_state.get(row.key))) {
          const stamp =
            JSON.parse(row.value).updated_at ?? new Date().toISOString();
          await saveUserState(row.key, row.value, stamp);
        }
      }
      await db.sync_meta.put({ key, value: "1" });
    },
  );
}
