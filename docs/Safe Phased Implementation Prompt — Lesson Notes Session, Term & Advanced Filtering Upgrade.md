# Claude Code Agent — Safe, Phased Implementation Specification

You are working on an **existing production-style web application** for managing teachers, lesson notes, classes, subjects, and administrative review.

Your task is to implement a major upgrade to the existing lesson-note management system.

## CRITICAL RULE — DO NOT START CODING IMMEDIATELY

Before modifying **any code, database schema, Supabase tables, migrations, components, routes, APIs, or UI**, you MUST first thoroughly inspect and understand the existing project.

The existing application is already operational, and its current features must continue working exactly as they do unless a change is explicitly required by this specification.

Your highest priority is:

1. Preserve all existing functionality.
2. Avoid feature collisions.
3. Avoid unnecessary rewrites.
4. Reuse the existing architecture and components wherever possible.
5. Avoid introducing duplicate functionality.
6. Avoid breaking existing authentication, permissions, database relationships, lesson-note submission, approval workflows, teacher functionality, or admin functionality.
7. Make the smallest safe changes necessary.
8. Do not make architectural changes simply because you prefer another architecture.

---

# PART 1 — MANDATORY PROJECT AUDIT BEFORE IMPLEMENTATION

Before writing implementation code, inspect the project comprehensively.

You need to understand:

## A. Application Architecture

Identify:

- Frontend framework
- Backend architecture
- Routing system
- State-management approach
- Component structure
- Styling/UI framework
- Form-handling approach
- Validation libraries
- API/data-fetching approach
- Authentication implementation
- Authorization/role system
- Error-handling patterns
- Existing reusable components
- Existing hooks/services/utilities
- Existing admin dashboard architecture

Do not replace these systems.

Use the project's existing conventions.

---

## B. Database / Supabase Audit

Inspect the existing Supabase integration and determine:

- Existing tables
- Existing columns
- Primary keys
- Foreign keys
- Relationships
- Existing indexes
- Existing constraints
- Existing enums
- Existing triggers
- Existing functions
- Existing views
- Existing Row Level Security policies
- Existing storage buckets if relevant
- Existing authentication/user relationships
- Teacher relationships
- Class relationships
- Subject relationships
- Lesson-note relationships
- Approval/rejection relationships
- Existing session/term/week/day fields, if any

Pay particular attention to the current lesson-note schema.

Determine whether the existing database already has concepts equivalent to:

- Academic session
- Session year
- Term
- Week
- Day
- Teacher
- Class
- Subject
- Submission date
- Approval status

**Do not create duplicate database concepts if they already exist.**

---

## C. Existing Lesson Note Workflow

Trace the complete existing workflow.

Understand:

```text
Teacher
   ↓
Creates lesson note
   ↓
Selects relevant information
   ↓
Submits lesson note
   ↓
Admin reviews
   ↓
Approve / Reject / Other existing workflow
   ↓
Teacher sees result
```

Determine exactly how the current system handles this.

Do not replace the workflow.

The new session/term categorisation and filtering functionality should integrate into the existing workflow.

---

## D. Existing Admin Dashboard

Inspect the admin dashboard carefully.

Identify:

- Existing lesson-note pages
- Existing tables/cards
- Existing filters
- Existing search functionality
- Existing approval UI
- Existing teacher management
- Existing class management
- Existing subject management
- Existing navigation
- Existing dashboard layout
- Existing responsive behavior
- Existing reusable filter/table components

Before creating a new component, determine whether an existing component can be extended.

---

## E. Existing Teacher Dashboard

Inspect the teacher experience as well.

Determine where teachers:

- Create notes
- View notes
- Edit notes
- Submit notes
- See approval status
- See rejected notes
- Select classes
- Select subjects
- Select dates/weeks

The new session/term architecture must integrate naturally into this existing experience.

---

# PART 2 — AUDIT REPORT BEFORE CODING

After completing the inspection, DO NOT immediately implement.

Instead, produce an audit report containing:

### 1. Current architecture

Explain briefly how the application currently works.

### 2. Current lesson-note architecture

Explain:

- Database tables involved
- Important relationships
- Current workflow
- Current admin workflow
- Current teacher workflow

### 3. Existing features that will be affected

List every existing feature that could potentially be affected by this upgrade.

### 4. Recommended database changes

Clearly identify:

- Tables to modify
- Tables to create
- Columns to add
- Columns that should NOT be added because they already exist
- Indexes required
- Foreign keys
- Constraints
- RLS policies
- Migrations

### 5. Recommended frontend changes

Identify:

- Pages/components to modify
- Components to create
- Existing components to reuse
- Routes that may need modification

### 6. Risk analysis

Identify potential:

- Data migration risks
- Breaking-change risks
- Permission/RLS risks
- Existing-feature collision risks
- Performance risks
- UI/UX risks

### 7. Implementation phases

Provide a detailed phased implementation plan.

---

# PART 3 — STOP AND WAIT

After producing the audit and implementation plan:

**STOP.**

Do not modify any files.

Do not execute migrations.

Do not modify Supabase.

Do not implement anything.

Wait for my approval.

I will review the plan and tell you whether to proceed with Phase 1.

---

# CORE FEATURE TO IMPLEMENT

The primary upgrade is to introduce proper academic-session and term organisation for lesson notes.

The new academic session should support:

```text
2026/27
   ├── Term 1
   │     ├── Week 1
   │     ├── Week 2
   │     ├── Week 3
   │     └── ...
   │
   ├── Term 2
   │     ├── Week 1
   │     ├── Week 2
   │     └── ...
   │
   └── Term 3
         ├── Week 1
         ├── Week 2
         └── ...
```

Lesson notes should belong to an academic session and term.

Where appropriate, lesson notes should also retain:

- Teacher
- Class
- Subject
- Week
- Day
- Date
- Existing approval status
- Existing metadata

Do not duplicate information that already exists in the current schema.

---

# ADMIN FILTERING SYSTEM

The main UI upgrade should be in the Admin Dashboard.

Administrators should be able to filter lesson notes by:

- Academic session
- Term
- Teacher
- Class
- Subject
- Week
- Day
- Approval status, if compatible with the existing workflow
- Date, if useful and compatible with the existing data model

Filtering must support **multiple filters simultaneously**.

Example:

```text
Session: 2026/27
Term: Term 1
Teacher: John
Class: Grade 5
Subject: Mathematics
Week: 3
Day: Tuesday
```

The system should return only records matching the selected criteria.

Filters should work together rather than independently.

For example:

```text
Teacher = John
+
Class = Grade 5
+
Subject = Mathematics
+
Term = Term 1
```

should produce the intersection of those filters.

---

# FILTER UI REQUIREMENTS

The filter interface should be:

- Clear
- Responsive
- Easy to reset
- Easy to understand
- Consistent with the existing application's design
- Built using existing UI components where possible

Include:

### Apply filters

Where the existing application architecture benefits from explicit application of filters.

### Clear/Reset filters

One action should return the admin to the default view.

### Active filter indication

The admin should be able to easily understand which filters are currently active.

### Dependent filters

If appropriate and supported by the existing data architecture, consider sensible relationships.

For example:

```text
Session
   ↓
Term
   ↓
Week
   ↓
Day
```

Do not over-engineer this.

---

# SESSION MANAGEMENT

Determine whether academic sessions should be hard-coded or database-driven.

Prefer a database-driven approach if the existing architecture supports it safely.

The system should ultimately support multiple academic sessions, for example:

```text
2025/26
2026/27
2027/28
```

rather than treating `2026/27` as a permanent hard-coded value.

An administrator should eventually be able to work with historical sessions.

However, do not introduce a large session-management system unless it is necessary for this feature.

Use the smallest robust implementation.

---

# TERM MANAGEMENT

The system should support:

```text
Term 1
Term 2
Term 3
```

Each term belongs to an academic session.

Do not assume that all schools will always have exactly the same configuration if the current architecture already supports configurability.

However, do not over-engineer this requirement.

---

# WEEK AND DAY ORGANISATION

Lesson notes should be correctly associated with their:

- Term
- Week
- Day

Determine whether the existing system already calculates or stores these values.

If it already does:

**reuse the existing implementation.**

If it does not:

design the safest approach based on the existing application.

Do not introduce duplicate week/day representations.

---

# DATA MIGRATION

This is extremely important.

The application already contains existing lesson-note data from the previous academic session.

Do NOT delete or overwrite existing records.

Existing data must remain accessible.

If the current records can be safely associated with `2025/26`, determine whether a migration should assign them to that session.

If the existing data does not contain enough information to safely determine the academic session:

**DO NOT GUESS.**

Instead:

1. Identify the problem.
2. Explain what information is missing.
3. Recommend the safest migration strategy.
4. Ask for approval before modifying existing records.

Historical data must not be corrupted simply to make the new feature work.

---

# SUPABASE REQUIREMENTS

If database changes are required, create proper SQL migration scripts.

Do not tell me vaguely:

> "Create a table in Supabase."

Give me the exact SQL.

For every database change provide:

## 1. Migration SQL

Provide a complete SQL migration that can be executed safely.

## 2. Explanation

Explain:

- What it changes
- Why it is required
- Whether it is destructive
- Whether it can be rolled back
- What existing data it affects

## 3. RLS

If a new table or column requires RLS changes, provide the exact policies.

Ensure:

- Teachers can only access records they are supposed to access.
- Admins retain appropriate access.
- Existing permissions remain intact.

Do not weaken existing RLS policies merely to make the feature work.

## 4. Indexes

Recommend indexes where they will materially improve filtering performance.

For example, if appropriate:

- session
- term
- teacher
- class
- subject
- week
- day

But only create indexes that are justified by the actual query patterns.

Do not blindly index every column.

---

# IMPORTANT SUPABASE SAFETY RULES

Before executing any SQL:

1. Inspect the current schema.
2. Check whether the table/column already exists.
3. Avoid duplicate objects.
4. Prefer additive migrations.
5. Avoid destructive SQL.
6. Do not drop tables.
7. Do not drop columns.
8. Do not delete existing lesson notes.
9. Do not disable RLS.
10. Do not replace existing policies without understanding them.
11. Do not modify production data without explicit approval.

If a destructive migration appears necessary:

**STOP and ask me first.**

---

# PHASED IMPLEMENTATION

The project must be implemented incrementally.

Do not implement all features at once.

Use the following general structure.

---

# PHASE 1 — DATABASE FOUNDATION

Goal:

Establish the safest database foundation for academic sessions and terms.

Tasks:

1. Review current schema again.
2. Determine whether session/term entities already exist.
3. Create only the required database structures.
4. Create necessary relationships.
5. Create necessary indexes.
6. Create/update RLS policies safely.
7. Prepare migration for existing historical data only if it can be done safely.
8. Do not redesign the lesson-note system.

After implementation:

- Run type checks.
- Run linting.
- Run existing tests.
- Verify database queries.
- Verify RLS.
- Verify existing lesson-note functionality.

Then provide:

### Phase 1 completion report

Include:

- Files changed
- SQL migration created
- Database changes
- Tests run
- Test results
- Potential risks
- Manual testing instructions
- Any Supabase SQL I still need to execute manually

Then:

**STOP.**

Wait for my approval.

---

# PHASE 2 — SESSION & TERM INTEGRATION

After Phase 1 has been tested and approved:

Integrate academic session and term selection into the existing lesson-note workflow.

Teachers should be able to create notes associated with the correct:

- Session
- Term
- Week
- Day

Ensure existing lesson creation still works.

Do not remove existing fields unless the new architecture safely replaces them.

If migration is required, handle it safely.

Test:

- Creating a note
- Editing a note
- Submitting a note
- Viewing a note
- Existing approval workflow
- Existing teacher workflow
- Existing admin workflow

Then produce a completion report.

**STOP.**

Wait for approval.

---

# PHASE 3 — ADMIN FILTERING

Implement the advanced admin filtering system.

Filters:

- Session
- Term
- Teacher
- Class
- Subject
- Week
- Day
- Existing approval status
- Date filters where appropriate

Requirements:

- Multiple filters
- Reset filters
- Active filter state
- Efficient database queries
- Pagination if the existing system uses it
- Preserve existing sorting
- Preserve existing approval actions

Do not load thousands of records into the browser simply to filter them client-side if server-side filtering is more appropriate.

Use the existing data-fetching architecture.

Test combinations such as:

```text
2026/27 + Term 1
```

```text
2026/27 + Term 1 + Week 3
```

```text
2026/27 + Term 1 + Teacher + Subject
```

```text
2026/27 + Teacher + Class + Subject + Week + Day
```

Ensure results are correct.

Then:

**STOP and wait for approval.**

---

# PHASE 4 — ADMIN UX IMPROVEMENTS

Only after the core functionality works should you improve the interface.

Possible improvements:

- Better filter layout
- Filter chips
- Clear-all button
- Empty states
- Loading states
- Error states
- Pagination improvements
- Better session/term navigation
- Responsive behavior
- Accessibility improvements

Do not redesign the whole dashboard.

The UI should feel like an extension of the existing application.

Then:

**STOP and wait for approval.**

---

# PHASE 5 — ADDITIONAL FEATURES

Only after the session/term/filtering system is stable should we consider additional features.

The following are candidates for future phases:

## 1. Search

Search notes by:

- Topic
- Teacher
- Subject
- Keyword

## 2. Date Range Filtering

Filter by:

- Creation date
- Submission date
- Approval date

## 3. Approval History

Track:

- Who approved/rejected
- When
- Admin comments
- Status transitions

## 4. Notifications

Notify teachers when notes are:

- Submitted
- Approved
- Rejected
- Returned for changes

## 5. Teacher Profile Management

Admins can:

- Add teachers
- Edit teachers
- Deactivate teachers
- Assign subjects

## 6. Curriculum Templates

Allow teachers to start notes from predefined lesson structures.

## 7. Copy Previous Session

Allow teachers to copy a note from:

```text
2025/26
```

to:

```text
2026/27
```

while updating:

- Session
- Term
- Week
- Day

Do not blindly copy data that should be session-specific.

## 8. Bulk Admin Actions

Allow admins to select multiple notes and:

- Approve
- Reject
- Export
- Archive

## 9. Archive

Allow old sessions to remain available without cluttering the active session.

## 10. Export

Potential formats:

- PDF
- Excel/CSV
- Word

## 11. Note Version History

Keep previous versions when teachers edit rejected notes.

## 12. Dashboard Analytics

Possible statistics:

- Notes submitted per teacher
- Approval rate
- Notes per subject
- Weekly submission activity
- Rejected notes

## 13. Teacher Progress Dashboard

Show:

- Total notes
- Approved
- Pending
- Rejected
- Completion by week

## 14. Submission Deadlines

Allow administrators to define weekly deadlines.

## 15. Missing Notes Report

Show teachers who have not submitted required notes.

## 16. Comments/Discussion

Allow admins and teachers to communicate around a note.

## 17. Saved Filters

Allow admins to save filters such as:

```text
Pending Review
Grade 5 Mathematics
Term 1 Submissions
Teacher Notes This Week
```

## 18. Backup

Consider periodic backup/export mechanisms.

Do NOT implement these now.

They are future phases.

---

# GENERAL DEVELOPMENT RULES

## Rule 1 — Preserve Existing Features

Before changing anything, understand how the current feature works.

Do not replace working code unnecessarily.

---

## Rule 2 — Reuse Existing Architecture

If the project already has:

- Filter components
- Modal components
- Table components
- Form components
- Database services
- Hooks
- Validation
- Authentication
- Role checks

reuse them.

---

## Rule 3 — No Unnecessary Dependencies

Do not install new packages unless necessary.

If you believe a new dependency is required, explain why before installing it.

---

## Rule 4 — No Blind Refactoring

Do not refactor unrelated code while implementing this feature.

Avoid:

- Renaming unrelated components
- Changing unrelated APIs
- Rewriting existing services
- Changing styling systems
- Changing database architecture unnecessarily

---

## Rule 5 — Backward Compatibility

Existing users must continue to be able to:

- Log in
- Access their dashboards
- Create notes
- Edit notes
- Submit notes
- Review notes
- Approve/reject notes
- Use all currently operational features

unless explicitly changed by this specification.

---

# TESTING REQUIREMENTS

After every phase, test both:

## New functionality

and

## Existing functionality

At minimum check:

### Authentication

- Admin login
- Teacher login
- Existing permissions

### Teacher

- Dashboard
- Lesson-note creation
- Lesson-note editing
- Lesson-note submission
- Existing status workflow

### Admin

- Dashboard
- Lesson-note review
- Approval
- Rejection
- Existing filters/actions

### Database

- CRUD operations
- Relationships
- RLS
- Existing records

### UI

- Desktop
- Mobile/responsive layout
- Loading states
- Empty states
- Error states

---

# CODE QUALITY

Before declaring a phase complete:

Run the project's existing:

- Type checking
- Linting
- Tests
- Build process

If any existing check fails:

Determine whether:

1. It was already failing before your changes.
2. Your changes caused it.

Do not hide failures.

Report them honestly.

---

# ERROR HANDLING

If you encounter something unexpected:

DO NOT guess.

Examples:

- Unexpected database schema
- Missing relationship
- Conflicting column
- Existing migration
- Existing RLS policy
- Unexpected TypeScript error
- Duplicate component
- Existing feature that already implements part of this request

Stop and investigate.

If the correct solution is unclear and could risk existing functionality, stop and ask me.

---

# GIT / CHANGE MANAGEMENT

Keep changes easy to review.

Prefer small, logical commits if the project uses Git.

Example:

```text
feat: add academic session database foundation
feat: integrate session and term into lesson notes
feat: add admin lesson note filters
feat: improve lesson note filtering UX
```

Do not bundle unrelated changes into the feature.

---

# FINAL REQUIREMENT

At the end of every phase, report exactly:

## Phase
Name of phase.

## What changed
Concise list.

## Files changed
List files.

## Database changes
List tables, columns, indexes, policies, migrations.

## SQL required from me
Provide exact SQL if I need to manually execute anything in Supabase.

If nothing is required, explicitly say:

`No manual SQL action is required.`

## Tests performed
List tests.

## Results
Pass/fail.

## Manual testing
Give me the exact steps I should perform in the browser/Supabase.

## Risks or concerns
List anything that needs attention.

## Next phase
Explain what will happen next.

Then **STOP and wait for my confirmation.**

---

# MOST IMPORTANT INSTRUCTION

Do not interpret this prompt as permission to implement everything immediately.

The workflow is:

```text
AUDIT
  ↓
REPORT
  ↓
STOP
  ↓
MY APPROVAL
  ↓
PHASE 1
  ↓
TEST
  ↓
REPORT
  ↓
STOP
  ↓
MY APPROVAL
  ↓
PHASE 2
  ↓
TEST
  ↓
REPORT
  ↓
STOP
  ↓
MY APPROVAL
  ↓
PHASE 3
  ↓
...
```

Never skip the approval gates.

Never modify production data without understanding the consequences.

Never overwrite existing lesson-note data.

Never disable security controls to make implementation easier.

Never assume the database structure.

Never assume the existing code is structured the way you expect.

**Inspect first. Understand second. Plan third. Implement fourth. Test fifth.**

The existing application is already working. Treat preservation of its existing functionality as a hard requirement.