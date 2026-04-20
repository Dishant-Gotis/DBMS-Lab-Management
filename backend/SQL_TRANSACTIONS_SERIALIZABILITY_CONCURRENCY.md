# SQL-Era Analysis for This Lab Management Backend

This document explains how **transactions**, **serializability**, **concurrency conflicts**, and **ACID properties** would apply if this backend were running on the original relational SQL design.

It is written for presentation use: concept + direct mapping to this codebase's workflows.

---

## 1. Why Transactions Matter in This System

This project has tightly related entities:
- `labs`
- `pcs`
- `software`
- `assistants`
- `faculty`
- `slots`
- `timetable`

Many endpoints are not single-row updates; they are **multi-step business operations**. In SQL, these should run as atomic transactions to avoid partial state.

Examples from this backend's route flows:
- Delete a lab and all dependent records.
- Assign assistant to a lab.
- Create slot and then bind it to timetable day.
- Delete a PC and also delete software installed on that PC.

If these are not transactional, users can observe inconsistent state (orphan rows, stale assignments, wrong timetable references).

---

## 2. ACID in This Codebase (Practical Mapping)

## 2.1 Atomicity (All-or-Nothing)

Atomicity means either every step in a workflow commits, or none does.

### Codebase examples
1. **Delete Lab flow**
   - delete software for all lab PCs
   - delete PCs
   - delete timetable row
   - delete lab
   - optionally null assistant assignments

If step 3 fails after steps 1 and 2 succeeded, without transaction control the database is partially changed.

2. **Create slot + timetable assignment (admin timetable usage pattern)**
   - create slot row
   - update timetable day reference

If the second step fails, you may end up with an unlinked slot.

## 2.2 Consistency (Rules Always Hold)

Consistency means each committed transaction preserves constraints and invariants.

### Invariants relevant to this project
- A timetable day should reference a valid slot ID.
- Assistant-lab assignment should point to existing lab.
- Software should belong to existing PC.
- PC should belong to existing lab.
- Lab should belong to existing college.

SQL constraints that support this:
- `FOREIGN KEY` constraints
- `UNIQUE` constraints (e.g., faculty/assistant email)
- `CHECK` constraints (e.g., positive strengths/credits)

Transactions ensure constraint checks happen at commit boundaries without exposing broken intermediate state.

## 2.3 Isolation (Concurrent users don't corrupt each other)

Isolation controls what one transaction can see from another transaction.

In this backend, multiple admins may operate simultaneously (especially timetable and lab maintenance). Isolation prevents anomalies such as:
- lost updates
- dirty reads
- non-repeatable reads
- write skew

## 2.4 Durability (Committed means persisted)

After commit, changes survive process crash/restart.

Operationally, this depends on SQL engine durability settings (WAL/fsync settings in PostgreSQL, etc.), but at application level the key is:
- `COMMIT` only after workflow is complete.
- Surface failure only when commit fails.

---

## 3. Where to Apply Transactions in This Project

The following are high-value transaction boundaries for the SQL-era version.

## 3.1 Lab Deletion (Critical)

### Flow
- lock target lab row
- delete dependent software rows (through PC set)
- delete PCs
- delete timetable row
- null out assistant references (or cascade strategy)
- delete lab
- commit

### Why
This is a classic multi-table mutation. Should be one transaction to maintain referential integrity and avoid half-deleted labs.

## 3.2 PC Deletion with Software Cleanup

### Flow
- lock PC row
- delete software rows for PC
- delete PC
- commit

### Why
Without transaction, concurrent reads may see software for a PC that no longer exists (or vice versa).

## 3.3 Assistant Assignment

### Flow
- verify lab exists (and in same college scope)
- lock assistant row
- update `assistant.lab_id`
- commit

### Why
Prevents races where two admins assign same assistant to different labs at nearly the same time (last-write wins unless controlled).

## 3.4 Timetable Day Update

### Flow
- lock timetable row for lab (or create and lock)
- verify slot exists and is valid for college constraints
- update day column (`mon_slot_id` etc.)
- commit

### Why
Timetable is highly concurrent in scheduling windows; row-level locking is important.

## 3.5 Faculty/Assistant Creation with Unique Fields

### Flow
- insert row with unique email/phone
- commit
- on unique violation, rollback and return conflict

### Why
Never do check-then-insert without transaction/constraint reliance. Use unique index as source of truth.

---

## 4. Concurrency Conflicts You Can Demonstrate in Presentation

## 4.1 Lost Update

### Scenario
Two admins update same timetable day for same lab at nearly same time.

### Without safeguards
Second write overwrites first silently.

### Mitigations
- `SELECT ... FOR UPDATE` on timetable row.
- Optimistic locking with version/timestamp check.
- Serializable transaction for scheduling-critical updates.

## 4.2 Dirty Read (if isolation too weak)

### Scenario
Transaction A updates assistant assignment but not committed.
Transaction B reads uncommitted value and acts on it.
Transaction A rolls back.

### Result
B made decisions on data that never committed.

### Mitigation
Use at least `READ COMMITTED` (default in PostgreSQL).

## 4.3 Non-repeatable Read

### Scenario
Admin dashboard transaction reads faculty count twice; another transaction inserts/deletes faculty in between.

### Result
Different values in same transaction.

### Mitigation
Use `REPEATABLE READ` for report-style flows requiring stable snapshot.

## 4.4 Phantom Read

### Scenario
Transaction reads all PCs in lab; concurrent transaction inserts a new PC; second read in first transaction now sees extra row.

### Mitigation
`REPEATABLE READ`/`SERIALIZABLE`, or explicit locking strategy depending on operation.

## 4.5 Referential Race on Delete

### Scenario
Admin A deletes lab while Admin B adds PC to that lab.

### Risk
Depending on timing, insertion fails due FK, or delete fails/blocks; poor handling can show flaky UX.

### Mitigation
- Lock lab row before destructive operation.
- Handle FK failures cleanly.
- Use cascading strategy deliberately (`ON DELETE CASCADE` vs manual order).

## 4.6 Write Skew (Business-rule conflict)

### Scenario
Two admins assign two different classes to same lab/day under a business rule "one class per day-slot per lab", but rule only checked in app code.

### Risk
Both transactions pass validation before either commits.

### Mitigation
- enforce with unique constraints where possible
- or serializable isolation + retry logic
- or locking on resource key `(lab_id, day)`

---

## 5. Serializability for This Backend

Serializability means concurrent execution behaves like some serial order of transactions.

## 5.1 Isolation Levels and Suitability

1. `READ COMMITTED`
- Good default for most CRUD endpoints.
- Prevents dirty reads.
- Still allows non-repeatable reads and some anomalies.

2. `REPEATABLE READ`
- Better for multi-step reads where consistency across reads matters (analytics/meta views).
- Reduced anomalies compared to `READ COMMITTED`.

3. `SERIALIZABLE`
- Best correctness guarantee for high-contention scheduling operations.
- May abort transactions due to serialization failure; app must retry.

## 5.2 Where SERIALIZABLE is most justified here

- Timetable updates during active scheduling windows.
- Complex "validate then write" operations touching shared schedule resources.

## 5.3 Retry Strategy (important slide point)

At SERIALIZABLE level, app should:
- catch serialization exceptions
- retry transaction (bounded retries, e.g., 2-3)
- return clear conflict message if retries exhausted

This turns correctness failures into controlled business responses.

---

## 6. SQL Transaction Design Patterns for This Codebase

## 6.1 Pessimistic Locking (Row locks)

Use for highly contended rows.

Example use cases:
- update one timetable row
- move assistant between labs
- destructive lab operations

Typical pattern:
- `BEGIN`
- `SELECT ... FOR UPDATE`
- perform checks + writes
- `COMMIT`

## 6.2 Optimistic Concurrency Control

Use version column (`row_version`) in rows like timetable.

Update form:
- `UPDATE ... WHERE id = ? AND row_version = ?`
- if affected rows = 0, conflict detected

Good when conflict probability is moderate but non-zero.

## 6.3 Constraint-First Integrity

Prefer DB-level constraints over app-only validation:
- unique emails/phones
- FK relationships
- optional composite unique keys for schedule conflicts

Benefit: race-safe correctness regardless of API server count.

---

## 7. Deadlock Risks and Prevention

Deadlocks are possible when two transactions lock resources in different orders.

## Example in this domain
- Txn A: lock lab, then lock PCs
- Txn B: lock one PC, then lock lab

Possible deadlock cycle.

## Prevention strategies
- Always lock tables/resources in same global order.
- Keep transactions short.
- Avoid user interaction mid-transaction.
- Add retry for deadlock-detected errors.

---

## 8. Suggested Slide Structure

1. Data model and why multi-table operations need transactions.
2. ACID mapped to concrete endpoints.
3. Conflict demos (lost update, write skew, referential race).
4. Isolation levels and trade-offs (`READ COMMITTED` vs `SERIALIZABLE`).
5. Recommended transaction boundaries in this backend.
6. Locking + retry strategy for timetable operations.
7. Key takeaway: correctness comes from transaction design + constraints + conflict handling.

---

## 9. Key Takeaways (Executive Summary)

- This backend has many operations that are naturally transactional.
- ACID is not theoretical here; it directly prevents broken lab/timetable state.
- Concurrency issues are most severe around timetable and cascading deletes.
- Use SQL constraints + transactions + locking together.
- For high-contention scheduling, use SERIALIZABLE with retry logic.
- Designing for serializability early avoids production data corruption and hard-to-debug race conditions.
