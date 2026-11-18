/*
# Create candidates table (multi-user, owner-scoped)

## What this migration does
Creates a `candidates` table that stores parsed resume data for each user.
Each user sees only the resumes they uploaded (owner-scoped via `user_id`).
The frontend uses Supabase Auth (email/password), so the app has a sign-in screen.

## New Tables
- `candidates`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users, cascade delete)
  - `name` (text) - extracted candidate name
  - `email` (text) - extracted candidate email
  - `phone` (text) - extracted candidate phone
  - `education` (text) - extracted education summary
  - `experience` (text) - extracted experience summary
  - `skills` (text[]) - extracted technical skills as array
  - `filename` (text) - original uploaded file name
  - `raw_text` (text) - full extracted resume text (for reference/match)
  - `created_at` (timestamptz, defaults to now)

## Security
- Enables Row Level Security on `candidates`.
- Grants SELECT, INSERT, UPDATE, DELETE to `authenticated` only (app requires sign-in).
- Four owner-scoped policies (one per CRUD verb) so each user can only access their own rows.
- `user_id` defaults to `auth.uid()` so inserts from the client succeed even when the client omits it.

## Notes
1. The app has a sign-in screen, so policies target `authenticated` only.
2. `user_id` has `DEFAULT auth.uid()` so frontend inserts that omit the owner still satisfy WITH CHECK.
3. `skills` is a text array to support filtering/matching by individual skill.
*/

CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  education text,
  experience text,
  skills text[] NOT NULL DEFAULT '{}',
  filename text NOT NULL,
  raw_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON candidates TO authenticated;

DROP POLICY IF EXISTS "select_own_candidates" ON candidates;
CREATE POLICY "select_own_candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_candidates" ON candidates;
CREATE POLICY "insert_own_candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_candidates" ON candidates;
CREATE POLICY "update_own_candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_candidates" ON candidates;
CREATE POLICY "delete_own_candidates"
  ON candidates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
