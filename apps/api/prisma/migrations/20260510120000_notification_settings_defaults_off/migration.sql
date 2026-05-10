-- Align defaults with product rule: notifications off until user activates

ALTER TABLE "NotificationSettings"
  ALTER COLUMN "workoutReminder" SET DEFAULT false,
  ALTER COLUMN "inactivityAlert" SET DEFAULT false,
  ALTER COLUMN "emailNotifications" SET DEFAULT false,
  ALTER COLUMN "pushNotifications" SET DEFAULT false;

UPDATE "NotificationSettings"
SET
  "workoutReminder" = false,
  "inactivityAlert" = false,
  "emailNotifications" = false,
  "pushNotifications" = false;

