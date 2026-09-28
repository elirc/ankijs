# Finish the capstone beyond the local fixture

## Trusted session boundary

Replace x-test-user with a session lookup on the server. Store only a random opaque session token in a Secure, HttpOnly cookie. Store a digest of that token with user ID and expiry in the server database. On each request validate expiry/revocation and use the session's user ID for every query. Never accept owner_id from the request body. Apply an explicit CSRF/origin policy to cookie-authenticated mutations. Use an established identity component for credential enrollment/recovery rather than inventing a password protocol for this exercise.

Acceptance: an absent, expired or revoked session returns 401; user B cannot read/change A's note; logout invalidates the server session; state-changing cross-origin requests fail the chosen policy. Document SameSite behavior and test it in your deployment context.

## Persistent PostgreSQL contract

    CREATE TABLE notes (
      id uuid PRIMARY KEY,
      owner_id uuid NOT NULL,
      body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
      version integer NOT NULL DEFAULT 1,
      archived boolean NOT NULL DEFAULT false
    );
    UPDATE notes SET body=$1, version=version+1
    WHERE id=$2 AND owner_id=$3 AND version=$4 RETURNING *;

Use bound parameters. If the update returns no row, perform an owner-scoped lookup to choose missing/inaccessible (404) versus stale (409). Never retry a stale replacement silently. For EF Core, configure Version as a concurrency token and handle DbUpdateConcurrencyException with an owner-scoped reload. For a Node SQL driver, use the conditional UPDATE above. A process-local lock is insufficient after adding a second instance.

Acceptance: restart preserves data; two simultaneous writes with one revision yield one success; failed validation creates no record; migration rollback does not destroy newer user edits. Capture the actual query/EF mapping and test output in your journal.

## Deployment and restoration

1. Configure the production database and identity provider using environment-specific secrets outside source control.
2. Build the frontend; bind the service behind HTTPS; verify cookie scope, forwarded headers and allowed origins for that host.
3. Run migration compatibility checks against a copy of the prior schema and representative data.
4. Record request errors/latency without bodies, cookies or authorization headers.
5. Take a database backup, restore into a separate empty database, verify owner/content/version counts, then run the shared contract with an appropriate test-session adapter in the isolated environment.
6. Record elapsed restore time and the timestamp of the newest recovered write. Rehearse a deployment rollback against data already written by the new version.

These steps require your chosen runtime/host/database; a local in-memory reference cannot verify them on your behalf. The unit is complete when your evidence meets these checks, not merely when the reference starts.
