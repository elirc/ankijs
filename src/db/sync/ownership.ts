import { db } from "../schema";

export async function assertOwnership(uid: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.decks, db.cards, db.notes, db.review_logs, db.user_state, db.sync_meta],
    async () => {
      const owner = (await db.sync_meta.get("local_owner"))?.value;
      const foreign =
        (owner && owner !== uid) ||
        (
          await Promise.all(
            [db.decks, db.cards, db.notes, db.review_logs, db.user_state].map(
              (table) =>
                table
                  .filter((row) => Boolean(row.user_id && row.user_id !== uid))
                  .count(),
            ),
          )
        ).some(Boolean);
      if (foreign)
        throw new Error(
          "This device belongs to another account. Sign back into that account, or use a separate browser profile. No data was synced.",
        );
      await db.sync_meta.put({ key: "local_owner", value: uid });
      await db.sync_meta.delete("auth_blocked");
    },
  );
}
