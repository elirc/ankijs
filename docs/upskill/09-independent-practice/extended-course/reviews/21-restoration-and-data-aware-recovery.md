# Review 21. Restore into evidence, not optimism

Return to [the assignment](../21-restoration-and-data-aware-recovery.md). A successful drill has a known source boundary, an independent destination, and a usable application result. Parsing a backup file is one preliminary check, not the whole recovery milestone.

## A21-A: adjacent levels of confidence

A checksum can match for a structurally invalid artifact. Valid JSON can contain duplicate identities. Structurally valid rows can refer to nonexistent owners. Consistent rows can still be unusable by an incompatible application version. Each counterexample explains why the next level needs its own check.

The reference restore helper checks a truthy owner but has no owner table. Do not call that a complete foreign-key verification. It also copies simple rows shallowly. A broader backup schema requires additional validation and copying decisions rather than relying on the helper's name.

## A21-B: independent destination

Keep the source intact and restore into an empty isolated store. Compare record identities, owners, counts, and representative content, then execute an authorized journey and denied cross-owner cases. A wrong ownership mapping can preserve total count while exposing another person's notes, so count alone is inadequate.

Label the identity mechanism used. The local test adapter can establish ownership behavior under its supplied identities but does not prove a production session service. The destination's runtime and configuration are also part of the drill. Data without the required application environment may not represent a usable recovery.

## A21-C: point and duration

Identify the newest recovered committed write and the first intentionally absent later write. That establishes the artifact's recovery point under the experiment. Measure duration from a declared start to a successful destination journey, stating whether setup and configuration are included. Do not substitute file creation time for both measurements.

An empty restore isolates artifact coverage. A populated Recall import exercises merge rules and may preserve newer local data. Keep those reports separate so the existing destination does not conceal missing backup content. Optional absent practice fields do not necessarily erase local journal entries; the existing tests document that compatibility behavior.

## A21-D: rollback and causation

Test the old reader against data already written by the newer version before calling binary rollback safe. Preserve valid committed meaning instead of deleting unfamiliar statuses to make an old parser accept them. A mitigation can stop the risky writer while a compatible recovery path is evaluated.

Connect request r17 to event e9 and its worker attempts through stable identity. Nearby request r18 is not part of that causal chain merely because its timestamp is close. In a restore drill, artifact, attempt, and destination identities serve the same purpose: they distinguish which evidence belongs to which operation.

## Final review questions

Ask whether a fast restore of an old backup proves a small data-loss window. It does not. Ask whether a recent backup proves a short recovery duration. It does not. Ask whether a successful merge into a populated library proves that every restored row came from the artifact. It does not. A learner who answers these separately can write a recovery report whose claims are useful to another engineer rather than simply reassuring.
