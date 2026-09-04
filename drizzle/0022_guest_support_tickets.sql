ALTER TABLE support_tickets
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS requester_type varchar(20) NOT NULL DEFAULT 'client';

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS guest_session_id text;

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS guest_email varchar(255);

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS guest_name varchar(255);

CREATE INDEX IF NOT EXISTS support_tickets_guest_session_idx
  ON support_tickets (guest_session_id);

UPDATE support_tickets
SET requester_type = 'client'
WHERE requester_type IS NULL;
