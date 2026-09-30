import type { EngineeringMission } from "./engineering-missions";
import {
  additionalEffectProjects,
  deeperMilestones,
} from "./effect-project-expansion.ts";

export interface EffectMilestone extends EngineeringMission {
  concept: string;
  explanation: string;
  experiment: string;
  /** Practice drills retain a link to the original build milestone. */
  parentId?: string;
  workedExample?: string;
  retrieval?: { question: string; answer: string }[];
}

export type EffectTrack = "Project practice" | "Fundamentals" | "System design";

export interface EffectProject {
  id: string;
  title: string;
  kind: "Extend Recall" | "Standalone app";
  track?: EffectTrack;
  summary: string;
  outcome: string;
  prerequisites: string;
  model: string[];
  boundaries: string;
  resources?: { label: string; url: string }[];
  milestones: EffectMilestone[];
}

function milestone(
  id: string,
  title: string,
  concept: string,
  brief: string,
  explanation: string,
  steps: string[],
  checks: string[],
  experiment: string,
  review: string,
  stretch: string,
): EffectMilestone {
  return {
    id: `effect-${id}`,
    title,
    concept,
    brief,
    explanation,
    steps,
    checks: checks.map((label, index) => ({
      id: `criterion-${index + 1}`,
      label,
    })),
    experiment,
    review,
    stretch,
    stage: "Build independently",
    minutes: 90,
    skill: "Effect & agentic CRUD",
    study: "TypeScript",
  };
}

// Stable IDs are persisted in the existing evidence journal and backups.
const baseEffectProjects: EffectProject[] = [
  {
    id: "project-tracker",
    title: "Project tracker",
    kind: "Extend Recall",
    summary:
      "Build your first Effect feature: create, find, edit, and archive learning projects.",
    outcome:
      "A usable local project tracker with validated writes, recoverable forms, and tests against replaceable storage.",
    prerequisites:
      "React forms, TypeScript unions, and async functions. Start here before the other projects.",
    model: [
      "Project: id, name (1–100 trimmed characters), goal, status (active or archived), createdAt, updatedAt.",
      "Generate identity once per create attempt. Define whether archived names may be reused before adding uniqueness rules.",
      "Follow src/db/schema.ts and src/db/repos/ for persistence conventions; add a versioned Dexie migration for a new table.",
    ],
    boundaries:
      "React form → createProject operation → ProjectRepository → Dexie. Keep validation in the operation and run the Effect at the UI boundary.",
    milestones: [
      milestone(
        "tracker-create",
        "Create and list projects",
        "Schema · Effect.gen · typed failures",
        "Ship one complete path from a project form to durable storage and back to the list.",
        "Effect<Success, Error, Requirements> describes a computation, its expected failures, and its dependencies. Building an Effect does not execute the write. Decode unknown form input with Schema, compose the operation with Effect.gen, then execute it at the boundary. Invalid input must stop before storage is called.",
        [
          "Write examples for a valid name, whitespace-only name, overlong name, and a storage failure. Trim before validating length.",
          "Add the project model, migration, repository, create operation, and labeled form. Show loading, empty, success, and error states; preserve the draft after failure.",
          "Wrap the Dexie promise boundary with Effect.tryPromise and map failures into an explicit storage error. Disable repeated submit while pending and inspect the actual saved records.",
        ],
        [
          "A valid project appears once and survives reload.",
          "Blank and overlong names produce useful errors and no database writes.",
          "A rejected save preserves the draft and can be retried successfully.",
        ],
        "Make the repository reject the first save. Submit the same draft twice, then restore storage and retry. Predict the record count before inspecting it.",
        "Trace input normalization, validation, persistence, and rendering. Avoid calling runPromise inside the repository; the UI boundary owns execution and presentation of failures.",
        "Add a stable operation ID so an ambiguous response can be retried without a duplicate project.",
      ),
      milestone(
        "tracker-edit",
        "Edit, search, and archive",
        "Domain errors · explicit state transitions",
        "Complete the tracker with editing, active/archive filters, and recovery from missing records.",
        "A missing project and a failed database connection need different responses. Represent expected domain failures explicitly, then map them to useful UI states. Archiving is a reversible update; define its behavior separately from permanent deletion.",
        [
          "Specify case-insensitive search, active/archive filtering, and the behavior of an editor opened for a missing project.",
          "Implement update, archive, and restore operations. Reuse the name validation and preserve identity and createdAt during edits.",
          "Add a keyboard-accessible editor and archive confirmation. Clear a search with no matches; verify the full list returns.",
        ],
        [
          "Edits persist without changing identity or creation time.",
          "Search and status filters compose, including an empty result.",
          "Archive and restore survive reload; a missing record has a recoverable state.",
        ],
        "Open the editor, remove its record from a test store, then save. The app must not silently recreate the record or report success.",
        "Check that the write boundary enforces the same rules as the form. A disabled button alone cannot enforce a business rule.",
        "Add a revision field and reject an edit when another tab has already changed the project.",
      ),
      milestone(
        "tracker-layers",
        "Replace storage in tests",
        "Services · Layer · runtime boundaries",
        "Give the same project operations a Dexie implementation and a deterministic in-memory test implementation.",
        "A service defines what an operation needs; a Layer supplies that dependency. The business operation should not need to know which implementation it receives. A fake repository is useful for controlled failures, but it does not prove Dexie migrations or transactions work.",
        [
          "Define ProjectRepository with the smallest interface needed by create, list, update, and archive. Keep storage-specific types inside the adapter.",
          "Provide live and in-memory Layers. Supply a controllable ID generator and clock where assertions depend on identity or timestamps.",
          "Run behavior checks against the in-memory service and persistence checks against Dexie. Document where the application constructs and disposes its runtime.",
        ],
        [
          "Business operations run with either repository without changing their code.",
          "Tests cover missing records and storage failures without a live backend.",
          "A Dexie integration check proves reload persistence and the migration path.",
        ],
        "Replace the clock and ID generator with fixed values. Run the same create case twice in fresh stores and compare the entire result.",
        "Explain each type parameter in one operation and which Layer satisfies its requirements. Keep test state isolated between cases.",
        "Write a second adapter using a local HTTP API and run a shared repository contract against both implementations.",
      ),
    ],
  },
  {
    id: "project-milestones",
    title: "Milestones & evidence",
    kind: "Extend Recall",
    summary:
      "Give projects tasks, deadlines, completion rules, and linked evidence from your practice journal.",
    outcome:
      "A project detail page whose progress reflects verified milestone state and stays consistent after edits.",
    prerequisites:
      "Finish Project tracker. Read src/db/repos/practiceRepo.ts and its tests.",
    model: [
      "Milestone: id, projectId, title, dueDate (optional YYYY-MM-DD), order, status, evidenceMissionId (optional).",
      "One project has many milestones. Define what happens to children when a project is archived or removed.",
      "Treat a deadline as a calendar date unless the product explicitly requires an instant and time zone.",
    ],
    boundaries:
      "Project detail → milestone service → project and milestone repositories. Keep changes that must succeed together inside one database transaction.",
    milestones: [
      milestone(
        "milestones-crud",
        "Add related tasks and deadlines",
        "Service composition · relationship validation",
        "Create and reorder milestones inside a project, with a clear due-date policy.",
        "A projectId string is not proof that the parent exists. Validate the relationship at the write boundary and use database guarantees where available. Compose small services so the screen does not have to orchestrate parent lookup, validation, and child insertion itself.",
        [
          "Define create, rename, reorder, and remove behavior with examples for a missing or archived parent.",
          "Implement the operations and a project detail screen with labeled controls. Reject impossible dates and document whether past deadlines are allowed.",
          "Persist ordering explicitly. Test a fresh load with multiple projects so milestones cannot leak into another project's list.",
        ],
        [
          "Each milestone appears only under its own project.",
          "Missing parents and invalid dates are rejected before a child is saved.",
          "Reordering and deletion persist after reload.",
        ],
        "Attempt to create a milestone using a project ID that was just removed. Inspect the store for orphan records.",
        "Explain the parent-child invariant and where it is enforced. Use deterministic ordering when two rows share the same position.",
        "Add due-today and overdue filters and test them near midnight in two time zones.",
      ),
      milestone(
        "milestones-evidence",
        "Link completion to evidence",
        "Schema refinements · domain invariants",
        "Require an outcome, verification, and tradeoff before marking a milestone complete.",
        "Completion is a business transition, not just a checkbox. Validate evidence when the transition occurs. Link to stable journal IDs instead of copying text into multiple places, and define how missing or reopened evidence affects milestone status.",
        [
          "Choose and document whether reopening a linked journal entry reopens its milestone or leaves a historical completion snapshot.",
          "Add a link to a practice entry and show its outcome, verification, and tradeoff. Gate completion at the service boundary.",
          "Implement reopening and progress counts derived from stored milestones. Include empty projects and removed evidence in the cases.",
        ],
        [
          "Incomplete evidence cannot mark a milestone complete through UI or direct service calls.",
          "A completed milestone can be reopened and its progress count updates.",
          "Missing evidence is visible and does not crash the detail page.",
        ],
        "Complete one of three milestones, reopen its evidence, then reload. Compare the result with your documented rule.",
        "Avoid maintaining a separate completedCount that can drift from the underlying milestones. State what self-reviewed completion does and does not establish.",
        "Export a project work-sample report with milestone evidence and links to commits.",
      ),
      milestone(
        "milestones-atomic",
        "Make multi-record edits atomic",
        "Effect composition · database transactions",
        "Prevent half-completed project changes when a child write fails.",
        "Sequential Effect steps do not automatically form a database transaction. Atomicity comes from the storage transaction that encloses the related writes. Do not hold a transaction open while waiting for a network request or user interaction.",
        [
          "Choose a multi-row operation, such as moving milestones between projects or archiving a project and its active children. Write the invariant before coding.",
          "Implement a repository operation that owns the transaction. Inject a failure after the first write and inspect every affected row.",
          "Use the same failure case through the UI. Preserve selection and drafts so the user can retry after rollback.",
        ],
        [
          "All related writes commit together on success.",
          "An injected intermediate failure leaves every affected row unchanged.",
          "Retry after rollback yields the same final state as one successful attempt.",
        ],
        "Fail the second of three writes. A test that only checks the returned error is insufficient: compare the before and after database snapshots.",
        "Show which transaction covers which rows. Distinguish a storage transaction from Effect error recovery.",
        "Introduce two competing edits and define which revision checks must occur inside the transaction.",
      ),
    ],
  },
  {
    id: "import-preview",
    title: "Import preview",
    kind: "Extend Recall",
    summary:
      "Turn an untrusted project file into a useful preview and an all-or-nothing import.",
    outcome:
      "A validated import flow with row errors, an explicit merge policy, and no partial writes.",
    prerequisites:
      "Finish the first two projects. Inspect src/db/repos/dataRepo.ts and existing backup validation before changing formats.",
    model: [
      "ProjectFile: formatVersion, projects[], milestones[].",
      "Preview: normalized records, row errors, and create/update/skip counts.",
      "Choose one duplicate policy for IDs within a file and a separate policy for IDs already stored locally.",
    ],
    boundaries:
      "File reader → parse JSON → Schema decode → relationship checks → preview → transactional import. Preview performs no writes.",
    milestones: [
      milestone(
        "import-decode",
        "Decode files and explain row errors",
        "Schema · unknown input · error accumulation",
        "Validate an entire project file before giving the user an import button.",
        "JSON.parse only checks JSON syntax. A TypeScript cast does not validate runtime data. Decode the envelope, version, and each record, then check relationships and duplicates. Bound input size and row counts so validation itself cannot freeze the interface.",
        [
          "Create fixtures for a valid file, broken JSON, unsupported version, duplicate ID, invalid name, and orphan milestone.",
          "Read unknown input, decode it, and display errors with record number and field. Use a file-size limit and a documented maximum record count.",
          "Show create/update/skip totals for valid input. Keep the confirm action unavailable when validation fails.",
        ],
        [
          "Every malformed fixture produces an actionable error without a write.",
          "A valid file produces accurate preview counts.",
          "Oversized input is rejected before expensive processing.",
        ],
        "Put a malformed record at the end of an otherwise valid file. Verify the earlier rows have not been imported.",
        "Keep syntax, schema, and relationship failures distinguishable. Do not include raw sensitive record contents in logs.",
        "Offer a downloadable validation report with row numbers and messages.",
      ),
      milestone(
        "import-commit",
        "Confirm an atomic merge",
        "Transactional services · stale-preview handling",
        "Import the preview with an explicit duplicate policy and no partial merge.",
        "A preview can go stale while the user reads it. Recheck the relevant data inside the import transaction, or reject and regenerate the preview if the baseline changed. Repeating the same import should have a defined result instead of silently duplicating records.",
        [
          "Specify how existing IDs are treated: skip, reject, or update only when a version rule permits it. Show that policy in the confirmation UI.",
          "Validate the final merge and write projects and milestones in one transaction. Prevent double submission and report committed counts.",
          "Fail a write in the middle, retry, then import the same file again. Compare stored identities and relationships after each attempt.",
        ],
        [
          "A mid-import failure rolls back all imported rows.",
          "Repeated import follows the displayed duplicate policy.",
          "Changes made after preview trigger revalidation or a refreshed preview.",
        ],
        "Preview an update, edit the same project in another tab, then confirm. Verify the newer edit is not silently overwritten.",
        "Identify the point where the operation becomes durable. An optimistic success toast before commit is misleading.",
        "Add an import receipt containing the file digest, policy, counts, and completion time.",
      ),
      milestone(
        "import-roundtrip",
        "Prove export and restore",
        "Boundary contracts · integration testing",
        "Restore exported project data into an empty store and verify it through the actual interface.",
        "An export that downloads successfully may still omit relationships or progress. Restoration is the real test. Compare stable business fields and a complete user journey; timestamps that intentionally change during import need an explicit comparison policy.",
        [
          "Create a fixture with active and archived projects, ordered milestones, and linked evidence. Export it through the normal UI.",
          "Restore into an independent empty browser store, then search, open, edit, and reopen the imported work.",
          "Document the format version, included data, and handling of a newer unsupported file. Keep existing Recall backup compatibility intact.",
        ],
        [
          "Identity, relationships, ordering, and completion survive a round trip.",
          "Restored records remain editable and exportable.",
          "An unsupported future version fails without changing the target store.",
        ],
        "Remove one field from the export serializer and confirm that the round-trip test detects the lost information.",
        "Verify the restored data, not just a success message. Include migration behavior for old backups when extending the real Recall format.",
        "Add a fixture for the previous format and prove an explicit migration preserves its meaning.",
      ),
    ],
  },
  {
    id: "shared-projects",
    title: "Shared projects",
    kind: "Extend Recall",
    summary:
      "Add verified sessions, project membership, roles, and paginated comments.",
    outcome:
      "An owner-scoped collaboration feature with database-enforced access and conflict-aware editing.",
    prerequisites:
      "Finish local project CRUD. Use a disposable backend and study the existing Supabase ownership migrations.",
    model: [
      "ProjectMember: projectId, userId, role (owner, editor, viewer); unique membership pair.",
      "Comment: id, projectId, authorId, body, createdAt; cursor order uses createdAt plus id.",
      "Project: revision for conditional updates. Define last-owner removal and membership-revocation behavior.",
    ],
    boundaries:
      "Verified session → membership authorization → project service → database with ownership/RLS policies. Never accept a submitted ownerId as proof of identity.",
    milestones: [
      milestone(
        "sharing-auth",
        "Enforce ownership on every request",
        "Request services · authorization failures",
        "Connect verified identity to project reads and writes, including direct API requests.",
        "Authentication establishes who is calling; authorization decides what that caller may do. A hidden edit button is not access control. Supply verified identity through a request-scoped service and enforce membership at the backend and database boundary.",
        [
          "Create two test users and a public/private access matrix for create, list, read, update, and archive.",
          "Use verified sessions and owner-scoped queries or RLS. Map expired sessions and denied access into recoverable UI states.",
          "Test direct requests with another user's project ID, without a session, and after session expiry. Do not expose privileged backend secrets to the client.",
        ],
        [
          "One user cannot enumerate or modify another user's private projects.",
          "Missing and expired sessions fail safely and preserve unsaved input.",
          "Ownership comes from verified identity, never a trusted request body field.",
        ],
        "Send an update with a valid session for user B and user A's project ID. Inspect both the response and the unchanged row.",
        "Include reads and list counts in the access tests. Decide whether forbidden resources appear as 403 or 404 and apply the policy consistently.",
        "Test a role revoked while the user still has the editor open.",
      ),
      milestone(
        "sharing-members",
        "Add roles and paginated comments",
        "Service composition · boundary schemas",
        "Support owner, editor, and viewer roles with predictable comment pagination.",
        "Membership is a relationship with rules of its own. Define who can invite, change roles, comment, and remove members. Cursor pagination needs a stable tie-breaker; timestamp alone can skip records when multiple comments share a creation time.",
        [
          "Write a role/action matrix and a rule preventing removal of the last owner. Enforce it in the membership operation.",
          "Implement add, change-role, and remove actions plus comment create/read/update/delete with author checks.",
          "Use a stable cursor and bounded page size. Test comments with identical timestamps and insertion between page requests.",
        ],
        [
          "Every role matches the action matrix, including direct requests.",
          "Concurrent membership changes cannot leave the project ownerless.",
          "Pagination has no repeated or skipped items in the documented ordering model.",
        ],
        "Give two owners separate tabs and make both attempt to remove the other. Explain the locking or constraint that preserves an owner.",
        "Review comment edit/delete ownership separately from project edit permission. Describe how newly inserted comments appear during pagination.",
        "Add a membership audit trail without recording session credentials.",
      ),
      milestone(
        "sharing-conflicts",
        "Reject stale edits and migrate safely",
        "Tagged conflicts · conditional writes",
        "Protect collaborator edits with revision checks and rehearse a compatible schema change.",
        "Checking a revision and later issuing an unconditional update leaves a race. Compare the expected revision inside the database update. A conflict is an expected domain outcome: keep the draft and offer a reload or explicit merge rather than silently retrying over someone else's work.",
        [
          "Add revisions and update only when ID, authorized scope, and expected revision match. Increment the revision atomically.",
          "Show a conflict panel with the current value and preserved draft. Let the user choose how to reconcile before resubmitting.",
          "Rehearse a migration on a database copy, validate both app versions during rollout, and document a data-compatible rollback.",
        ],
        [
          "Two edits from the same revision cannot both silently succeed.",
          "A conflict preserves the losing draft and offers recovery.",
          "Migration and rollback rehearsal preserve existing projects and permissions.",
        ],
        "Load revision 4 in two tabs. Save different names from both. Inspect the row and prove the losing draft remains available.",
        "Do not automatically retry a stale edit using a freshly fetched revision. That defeats conflict detection.",
        "Implement a field-level merge that is allowed only when edits affect different fields.",
      ),
    ],
  },
  {
    id: "reliable-sync",
    title: "Reliable background sync",
    kind: "Extend Recall",
    summary:
      "Exercise retries, cancellation, outbox delivery, and diagnostics under unreliable networks.",
    outcome:
      "A tested sync pipeline that survives ambiguous responses and explains its current state to users.",
    prerequisites:
      "Finish service Layers and shared projects. Read src/db/sync/engine.ts, outbox.ts, and ownership.ts before proposing changes.",
    model: [
      "Outbox operation: stable operationId, entityId, payload/revision, attempt count, nextAttemptAt, status.",
      "Server receipt: unique (userId, operationId) paired transactionally with the business write.",
      "Sync states: idle, queued, running, blocked, retrying; define which errors require user intervention.",
    ],
    boundaries:
      "Local transaction + outbox → scoped worker → authenticated API → atomic receipt and write → conditional local acknowledgement.",
    milestones: [
      milestone(
        "sync-retry",
        "Bound retries and timeouts",
        "Schedule · timeout · classified errors",
        "Retry temporary network failures without retrying invalid input or expired authorization forever.",
        "Retry policy follows failure meaning. A 503 may be temporary; validation and permission failures usually require a change. A timeout means the response was not observed, not that the server did nothing. Bound attempts and elapsed time, and respect server retry guidance where applicable.",
        [
          "Write an error table: network/429/503, validation, denied access, conflict, and unexpected defect. Specify retry or user action for each.",
          "Use a capped retry schedule with backoff, jitter, a per-attempt timeout, and a total budget. Keep timing controllable in tests.",
          "Use public/workshop/fixtures/fake-service.mjs or an injected fake transport to exercise 429, 503, then success. Expose a retry state and last useful error.",
        ],
        [
          "Transient failures retry within a finite attempt and elapsed-time budget.",
          "Validation, permission, and conflict failures do not enter a blind retry loop.",
          "Timing tests run deterministically without real long sleeps.",
        ],
        "Have the transport fail on every attempt. Measure attempts and final state; verify the operation eventually stops retrying.",
        "Distinguish defects from expected operational failures. Log enough context to diagnose the attempt without logging tokens or private payloads.",
        "Add a shared rate limit so multiple queued items do not each retry at the maximum rate.",
      ),
      milestone(
        "sync-outbox",
        "Deliver writes without duplicates",
        "Idempotency · durable outbox · transactions",
        "Survive a successful server write whose response is lost before the client receives it.",
        "A retryable write needs a durable identity. Persist the local change and its outbox record together. On the server, record the operation receipt and business write atomically. Acknowledge only the exact outbox version that was sent so a newer local edit is not accidentally removed.",
        [
          "Define a stable operation ID, payload policy, and server duplicate response. Reject reuse of the same ID with a different payload.",
          "Simulate delivery, server commit, lost response, and client retry. Keep the receipt and mutation inside the same server transaction.",
          "Test a newer local edit arriving while the older request is in flight. Remove the old outbox entry only if it still matches the sent version.",
        ],
        [
          "A committed write with a lost response is applied only once after retry.",
          "A local write cannot commit without its required outbox entry.",
          "Acknowledging an older request never deletes a newer queued edit.",
        ],
        "Commit the server mutation, drop its response, then restart the client. Check both the final entity and operation-receipt counts.",
        "A client-side disabled button cannot provide server idempotency. Explain receipt retention and what happens after the retention window.",
        "Add a dead-letter view for operations that require manual resolution.",
      ),
      milestone(
        "sync-lifecycle",
        "Own worker lifetime and diagnostics",
        "Scope · interruption · structured logging",
        "Stop stale work on logout and make sync behavior understandable after reconnects.",
        "Background work needs an owner and a lifetime. Scope workers and resources so cleanup happens on shutdown. Interruption stops local work cooperatively; it cannot reverse a remote commit. Guard identity and request generation before applying a late result.",
        [
          "Define startup, reconnect, account logout, and application shutdown behavior. Ensure repeated setup does not register duplicate workers or listeners.",
          "Cancel or interrupt the active worker when its owner changes, pass cancellation to transports that support it, and reject stale responses.",
          "Add operation IDs, attempt numbers, duration, and categorized failures to diagnostics. Expose pending and blocked counts with an explicit retry action.",
        ],
        [
          "Repeated startup or reconnect produces only one active worker per scope.",
          "Logout prevents late results from updating a different account's state.",
          "A recorded operation ID traces queueing, attempts, and final acknowledgement.",
        ],
        "Pause a request, log out, then release its response. Verify no stale UI update or cross-account local write occurs.",
        "Explain which effects can be interrupted and which remote consequences may already be durable. Inspect listener and timer cleanup.",
        "Measure queue drain time before and after adding bounded concurrency without breaking per-entity ordering.",
      ),
    ],
  },
  {
    id: "support-desk",
    title: "Support-ticket app",
    kind: "Standalone app",
    summary:
      "Build a React + Effect API + PostgreSQL app for requests, assignments, comments, and audit history.",
    outcome:
      "A deployed support desk with verified sessions, owner-scoped CRUD, a tested workflow, and a restore rehearsal.",
    prerequisites:
      "Complete Project tracker and Shared projects. Start a separate repository; keep your frontend stack familiar.",
    model: [
      "Ticket: id, requesterId, assigneeId (optional), subject, description, status, revision, createdAt.",
      "Comment: ticketId, authorId, body, createdAt. AuditEvent: actorId, ticketId, action, prior/new status, timestamp.",
      "Roles: requester and staff. Define who can view, assign, transition, comment, and delete or archive.",
    ],
    boundaries:
      "React client → schema-validated HTTP API → verified session and ticket service → PostgreSQL repository. Construct server dependencies once and request identity per request.",
    milestones: [
      milestone(
        "tickets-slice",
        "Ship ticket CRUD from browser to SQL",
        "HTTP boundaries · Schema · repository Layers",
        "Create the first standalone app with a durable ticket and complete browser/API/database checks.",
        "The network boundary receives unknown input even if your frontend uses TypeScript. Decode requests and responses, map domain failures to stable HTTP responses, and keep SQL details inside the repository. Test database constraints with a real disposable database as well as service tests with fakes.",
        [
          "Create a React client, Node API, and versioned PostgreSQL migration. Pin one Effect major and document the matching server package versions.",
          "Implement authenticated create/list/read/update/archive endpoints and labeled forms. Scope tickets to the requester unless staff access is explicitly allowed.",
          "Test valid and invalid HTTP input, unauthenticated access, another user's ticket, missing IDs, restart persistence, and a failed save preserving the draft.",
        ],
        [
          "A browser-created ticket survives API and database restart.",
          "Direct API calls enforce validation and requester access.",
          "The browser handles empty, loading, failed, and successful requests without losing edits.",
        ],
        "Bypass the browser and submit malformed JSON, an overlong subject, and a different requester's ticket ID.",
        "Show the path through route, service, and repository. Keep credentials in server configuration and provide a safe example environment file.",
        "Reuse the workshop's contract-testing approach to run the same HTTP behavior checks against two repository implementations.",
      ),
      milestone(
        "tickets-workflow",
        "Add assignments and an audit trail",
        "Domain transitions · transaction boundaries",
        "Support staff assignment and ticket state changes with an audit record for each accepted transition.",
        "A workflow is a set of allowed transitions, not a free-form status string. The state update and audit event should commit together. Use optimistic concurrency so two staff members cannot silently overwrite an assignment based on the same old revision.",
        [
          "Define a transition table for open, in-progress, resolved, and reopened. Specify which actors may perform each transition.",
          "Add assignment and comment operations. Store the actor from verified identity; validate assignees are eligible staff.",
          "Commit each accepted status change with its audit event and revision increment. Test an audit-write failure and two competing updates.",
        ],
        [
          "Invalid transitions and unauthorized assignments are rejected.",
          "Every committed transition has exactly one matching audit event.",
          "A stale assignment fails visibly and preserves the user's intended choice.",
        ],
        "Force audit insertion to fail after updating status. Verify both changes roll back instead of leaving an undocumented transition.",
        "Distinguish an audit trail from debug logs. Define whether comment editing requires edit history and how retention affects the product.",
        "Add notification delivery through an outbox so an email failure does not roll back a valid ticket update.",
      ),
      milestone(
        "tickets-release",
        "Search, ship, and restore",
        "Observability · bounded queries · configuration",
        "Finish the support desk with usable search, deployment evidence, and a recovery procedure.",
        "A finished CRUD app includes its operational behavior. Bound list queries, inspect query plans using representative data, verify configuration at startup, and make failures traceable. Recovery requires a restore into an independent database, not just a successful backup command.",
        [
          "Add search, status/assignee filters, and stable pagination. Seed enough synthetic rows to inspect an actual query plan and justify an index.",
          "Deploy a migration and application build to a test environment. Add request IDs and a health/readiness policy that does not disclose secrets.",
          "Run a smoke journey with two accounts, restore a backup into an empty database, and rehearse rollback while preserving existing data.",
        ],
        [
          "Search and pagination remain correct with duplicate timestamps and changing filters.",
          "A deployed ticket can be created, assigned, commented on, and resolved with enforced permissions.",
          "A restored database supports the same journey with matching ticket and audit data.",
        ],
        "Make the database unavailable in the test environment. Record the request response, user-visible recovery, and diagnostic trail.",
        "Record commands and observed results, including limitations. A deployment URL alone does not demonstrate correct permissions or recovery.",
        "Measure a slow query and compare plans and timings before and after one targeted index change.",
      ),
    ],
  },
  {
    id: "inventory",
    title: "Inventory & reservations",
    kind: "Standalone app",
    summary:
      "Build products, locations, stock movements, and reservations that remain correct under concurrency.",
    outcome:
      "A second full-stack app where the last item cannot be reserved twice and retries cannot duplicate stock changes.",
    prerequisites:
      "Finish Support-ticket app and the transaction/idempotency milestones. Use a disposable PostgreSQL database for race experiments.",
    model: [
      "Product: id, sku (unique within owner), name, archivedAt. Location: id, ownerId, name.",
      "Stock: productId, locationId, onHand, reserved; unique pair and constraints 0 ≤ reserved ≤ onHand.",
      "Reservation: id, operationId, productId, locationId, quantity, status, expiresAt. StockMovement records every accepted stock adjustment.",
    ],
    boundaries:
      "Authenticated command → inventory service → one SQL transaction for conditional stock mutation, reservation, and receipt. Read availability is advisory until the write commits.",
    milestones: [
      milestone(
        "inventory-catalog",
        "Build the catalog and stock ledger",
        "Refined inputs · database constraints",
        "Implement product/location CRUD and auditable stock adjustments with integer quantities.",
        "A schema catches bad input early; a database constraint protects stored truth under every writer. Use integer quantities for indivisible items and choose an explicit unit/precision policy for measured goods. A stock adjustment is a command with a reason, not an arbitrary overwrite of a displayed total.",
        [
          "Define product SKU uniqueness, archival behavior, location ownership, and positive integer adjustment quantities. Add SQL constraints and foreign keys.",
          "Build product/location forms, lists, and archive actions. Implement stock receipt and removal commands with an actor and reason.",
          "Write the balance change and stock movement in one transaction. Reject removal below reserved stock and test direct SQL constraint violations in a disposable database.",
        ],
        [
          "Duplicate scoped SKUs, fractional quantities, and invalid relationships are rejected.",
          "Stock balances and movement records agree after accepted adjustments.",
          "Archived catalog entries preserve history and cannot receive disallowed new operations.",
        ],
        "Try removing five items when only three unreserved items remain. Inspect balance and ledger to confirm neither changed.",
        "Explain why UI validation and an integer TypeScript annotation cannot replace database constraints.",
        "Support moving stock between locations with an atomic debit, credit, and paired movement records.",
      ),
      milestone(
        "inventory-race",
        "Reserve the last item safely",
        "Atomic conditional updates · typed conflicts",
        "Make two concurrent reservation requests compete for one remaining item without overselling.",
        "Reading available=1 and later writing reserved=1 is unsafe when two requests race. Perform a conditional update or acquire appropriate row locks inside the transaction. Treat insufficient stock as a domain failure. If the database requires transaction retries, retry the complete transaction within a bound.",
        [
          "Define availability as onHand minus reserved and write the accepted/rejected reservation responses before implementing them.",
          "Atomically increment reserved only when sufficient stock remains, then insert the reservation in the same transaction. Use consistent lock order for multi-row operations.",
          "Launch two requests concurrently against PostgreSQL with one item available. Inspect both responses, reservation rows, and final balances.",
        ],
        [
          "Exactly one of two competing requests reserves the last item.",
          "No committed balance has reserved greater than onHand or below zero.",
          "A reservation insertion failure rolls back the stock update.",
        ],
        "Use a barrier so both clients begin together. A sequential test cannot demonstrate protection against this race.",
        "Show the exact SQL predicate or locking strategy. An in-process mutex does not protect against a second server instance.",
        "Reserve a basket across multiple products and demonstrate all-or-nothing allocation with consistent lock ordering.",
      ),
      milestone(
        "inventory-lifecycle",
        "Retry, release, and expire reservations",
        "Idempotency · scoped workers · lifecycle rules",
        "Finish the reservation lifecycle with duplicate-safe requests and single-application release or expiry.",
        "A reservation can leave active state once. Release, fulfilment, and expiration may race; guard the transition and stock update in one transaction. Durable receipts make a retried request return its prior result. A worker should not decrement reserved again for an already released record.",
        [
          "Define active → fulfilled/released/expired transitions. Specify how onHand and reserved change for each and use a controllable clock for expiry tests.",
          "Store a unique operation receipt with each accepted command. Reject reuse with different parameters and test a lost response followed by retry.",
          "Run an expiry worker with bounded batches and clean shutdown. Race user release against expiry, then deploy and verify backup restoration preserves balances and history.",
        ],
        [
          "Duplicate requests return the established outcome without extra balance changes.",
          "Release and expiry racing each other apply the stock correction only once.",
          "Restored reservations, receipts, movements, and balances satisfy the same invariants.",
        ],
        "Freeze time just before expiry, start a release, advance time, and run expiry concurrently. Repeat with a dropped response and request retry.",
        "Check receipt uniqueness, retention, transaction scope, and worker restart behavior. Reconcile the ledger against balances as an independent check.",
        "Add reconciliation that reports inconsistencies without silently rewriting stock, and rehearse a repair procedure.",
      ),
    ],
  },
];

const additionalOrder = [
  "customer-crm",
  "booking",
  "approval-workflow",
  "file-library",
  "notifications",
  "webhook-console",
  "agent-delivery",
];

export const effectProjects: EffectProject[] = [
  ...baseEffectProjects.map((project) => ({
    ...project,
    milestones: [
      ...project.milestones,
      ...(deeperMilestones[project.id] ?? []),
    ],
  })),
  ...[...additionalEffectProjects].sort(
    (a, b) => additionalOrder.indexOf(a.id) - additionalOrder.indexOf(b.id),
  ),
];

export const effectMissions = effectProjects.flatMap(
  (project) => project.milestones,
);

export { agentPrompt, effectResources } from "./effect-guidance.ts";
