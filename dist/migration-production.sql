-- ============================================================
-- MIGRATION PRODUCTION — Banque Mondiale
-- À exécuter UNE SEULE FOIS sur la DB de production (Supabase / Plesk)
-- Toutes les commandes utilisent IF NOT EXISTS — sans danger de relancer
-- ============================================================

-- ── ENUMS ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE transfer_status AS ENUM ('pending', 'completed', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE access_type AS ENUM ('public', 'private', 'limited');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'blocked', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('none', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'transfer_sent', 'transfer_received', 'transfer_confirmed',
    'sub_account_created', 'kyc_updated', 'login', 'referral_joined',
    'deposit', 'withdrawal', 'bill_payment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLE: users ─────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS balance_alert_threshold NUMERIC(15, 2);

-- ── TABLE: transfers ─────────────────────────────────────────

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'virement',
  ADD COLUMN IF NOT EXISTS access_type access_type NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sender_first_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_last_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_country TEXT,
  ADD COLUMN IF NOT EXISTS sender_city TEXT,
  ADD COLUMN IF NOT EXISTS receiver_first_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_last_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_email TEXT,
  ADD COLUMN IF NOT EXISTS receiver_country TEXT,
  ADD COLUMN IF NOT EXISTS receiver_city TEXT,
  ADD COLUMN IF NOT EXISTS display_currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS receiver_account_number TEXT,
  ADD COLUMN IF NOT EXISTS receiver_bank_id TEXT,
  ADD COLUMN IF NOT EXISTS receiver_bank_label TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_labels TEXT,
  ADD COLUMN IF NOT EXISTS block_reason TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS admin_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_unlocked_at TIMESTAMPTZ;

-- ── TABLE: activity ──────────────────────────────────────────

ALTER TABLE activity
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reference_id INTEGER;

-- ── INDEX optionnels (performances) ──────────────────────────

CREATE INDEX IF NOT EXISTS transfers_user_id_idx ON transfers (user_id);
CREATE INDEX IF NOT EXISTS transfers_created_at_idx ON transfers (created_at);
CREATE INDEX IF NOT EXISTS transfers_status_idx ON transfers (status);
CREATE INDEX IF NOT EXISTS transfers_user_id_created_at_idx ON transfers (user_id, created_at);
CREATE INDEX IF NOT EXISTS activity_user_id_idx ON activity (user_id);
CREATE INDEX IF NOT EXISTS activity_user_id_created_at_idx ON activity (user_id, created_at);

-- ── FIN ──────────────────────────────────────────────────────
SELECT 'Migration terminée avec succès ✅' AS result;
