-- Remove the single-column unique constraint that prevented a client from
-- being assigned to more than one coach (even historically). Replace with a
-- composite unique on (coachUserId, clientUserId) so the same coach can't
-- duplicate a client, but different coaches can each have the same client.

-- Drop the old single-column unique index
DROP INDEX IF EXISTS "CoachClient_clientUserId_key";

-- Add the composite unique constraint
ALTER TABLE "CoachClient"
  ADD CONSTRAINT "CoachClient_coachUserId_clientUserId_key"
  UNIQUE ("coachUserId", "clientUserId");

-- Add index on clientUserId for look-ups (was previously implied by @unique)
CREATE INDEX IF NOT EXISTS "CoachClient_clientUserId_idx"
  ON "CoachClient" ("clientUserId");
