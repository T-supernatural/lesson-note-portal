# RealJoy Schools Upgrade Roadmap

This roadmap is ordered for a live application. Each phase should be applied, tested, and monitored before the next phase begins.

## Phase 1: Protect the live application

Status: In progress

Goals:

- Keep API credentials out of the browser where they do not belong.
- Enforce ownership and workflow rules in Supabase, not only in React.
- Restrict and monitor file uploads.
- Add a repeatable security smoke test for authentication, RLS, and note status transitions.
- Preserve a rollback path for every database change.

Completed in this phase:

- Teacher deletion is now restricted to draft notes in `db/schema.sql`.
- The Supabase bootstrap remains repeatable and provisions the required Storage bucket.
- Gemini generation now runs through `supabase/functions/generate-lesson-note` instead of exposing the provider SDK and key in the browser.

Remaining Phase 1 work:

1. Rotate the previously exposed Gemini and Supabase credentials.
2. Deploy and smoke-test the new Gemini Edge Function in the official Supabase project.
3. Add database-enforced status transition rules and an audit trail.
4. Replace the broad Storage upload policy with user/note-scoped paths, MIME limits, and size limits.
5. Upgrade or replace vulnerable rich-text dependencies after compatibility testing.
6. Add executable security and workflow tests.

Before deploying this phase, run the updated SQL in the Supabase SQL Editor and verify that an approved or submitted note cannot be deleted by its teacher.

## Phase 2: Correctness and reliability

Status: Not started

- Fix the duplicate submitted/pending admin metric.
- Replace silent data-fetch failures with visible error states and retry actions.
- Refactor session/profile initialization so protected routes do not race profile loading.
- Remove the duplicate password-reset session lookup.
- Separate or clarify the admin reject and request-changes actions.
- Add typed error handling and loading state consistency.

## Phase 3: Maintainability and performance

Status: Not started

- Generate typed Supabase database definitions.
- Replace `any` values with domain types.
- Introduce versioned database migrations.
- Add route-level code splitting to reduce the initial JavaScript bundle.
- Add unit, integration, and RLS test coverage.
- Reconcile the rich-text documentation with the actual editor capabilities.

## Phase 4: Product capabilities

Status: Not started

- Add admin search and pagination.
- Add approval history and audit logs.
- Add teacher and subject management.
- Add review notifications.
- Add note version history.
- Add AI usage limits and generation history.
- Add stronger exports and reporting.

## Operating rule

Every phase must follow this loop:

1. Back up or export affected production data.
2. Apply the smallest change.
3. Run the focused validation and production build.
4. Test the affected workflow with a teacher and an admin account.
5. Monitor errors and database activity.
6. Record the result before continuing.