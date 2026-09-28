import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/schema";
export async function backupStatus() {
  const last = (await db.sync_meta.get("last_backup_at"))?.value;
  const since = last ?? "1970-01-01T00:00:00.000Z";
  const [cards, notes, logs, journal, decks] = await Promise.all([
    db.cards
      .filter((c) => c.content_updated_at > since || c.srs_updated_at > since)
      .count(),
    db.notes.where("updated_at").above(since).count(),
    db.review_logs.where("reviewed_at").above(since).count(),
    db.user_state.where("updated_at").above(since).count(),
    db.decks.where("updated_at").above(since).count(),
  ]);
  return { last, changes: cards + notes + logs + journal + decks };
}
export function DataProtection({ compact = false }: { compact?: boolean }) {
  const status = useLiveQuery(backupStatus);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void navigator.storage
      ?.persisted?.()
      .then(setPersistent)
      .catch(() => setPersistent(null));
  }, []);
  if (compact)
    return (
      <p className="quiet-note">
        <Link to="/settings">
          {status?.last
            ? "Last backup: " + new Date(status.last).toLocaleDateString()
            : "Protect your progress: export your first backup"}
        </Link>
        {status?.last &&
          " · " + status.changes + " records changed since export"}
      </p>
    );
  return (
    <section className="content-panel settings-section">
      <h2>Protect your progress</h2>
      <p>
        Saved locally means this browser has your data. Sync copies supported
        records to your account. An exported backup is a separate recovery copy.
      </p>
      <p>
        Last backup:{" "}
        {status?.last
          ? new Date(status.last).toLocaleString()
          : "Never exported"}{" "}
        · {status?.changes ?? 0} changed records. One review can change more
        than one record.
      </p>
      <p>
        Storage protection:{" "}
        {persistent === true
          ? "persistent"
          : persistent === false
            ? "best effort"
            : "not available or not checked"}
        . Clearing site data still removes local progress.
      </p>
      <button
        onClick={() => {
          if (!navigator.storage?.persist) {
            setMessage(
              "This browser does not expose storage protection. Keep separate backups.",
            );
            return;
          }
          void navigator.storage
            .persist()
            .then((result) => {
              setPersistent(result);
              setMessage(
                result
                  ? "Persistent storage granted. Keep exporting backups."
                  : "The browser did not grant persistence. Your current data is still saved locally.",
              );
            })
            .catch(() =>
              setMessage(
                "Could not request persistence. Try again or export a backup.",
              ),
            );
        }}
      >
        Request storage protection
      </button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
