ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Member"
  ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "Commission" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "sourceMemberId" TEXT NOT NULL,
  "bookingAmount" DECIMAL(14,2) NOT NULL,
  "percentage" DECIMAL(5,2) NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Commission_memberId_idx" ON "Commission"("memberId");
CREATE INDEX IF NOT EXISTS "Commission_sourceMemberId_idx" ON "Commission"("sourceMemberId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Commission_memberId_fkey'
      AND conrelid = '"Commission"'::regclass
  ) THEN
    ALTER TABLE "Commission"
      ADD CONSTRAINT "Commission_memberId_fkey"
      FOREIGN KEY ("memberId") REFERENCES "Member"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Commission_sourceMemberId_fkey'
      AND conrelid = '"Commission"'::regclass
  ) THEN
    ALTER TABLE "Commission"
      ADD CONSTRAINT "Commission_sourceMemberId_fkey"
      FOREIGN KEY ("sourceMemberId") REFERENCES "Member"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
